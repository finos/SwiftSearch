import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as ref from 'ref';
import * as util from 'util';
import { compression, decompression } from './compressionLib/compression';
import {
    Message,
    SearchInitialPayload,
    SearchInterface,
    SearchPayload,
    SearchResponse,
    UserConfig,
} from './interface/interface';
import { logger } from './log/logger';
import { searchConfig } from './searchConfig';
import { libSymphonySearch } from './searchLibrary';
import { makeBoundTimedCollector } from './utils/queue';
import SearchUtils from './utils/searchUtils';

const exec = util.promisify(childProcess.exec);

/**
 * This search class communicates with the SymphonySearchEngine C library via node-ffi.
 * There should be only 1 instance of this class in the Electron
 */

export default class Search extends SearchUtils implements SearchInterface {
    public validatorResponse: null | {};

    public readonly userId: string;
    private isInitialized: boolean;
    private isRealTimeIndexing: boolean;
    private readonly collector: any;
    private readonly searchPeriodSubtract: number;
    private readonly minimumDiskSpace: number;
    private readonly publishLibState: (state: boolean) => void;

    /**
     * Constructor for the SymphonySearchEngine library
     * @param userId {number} For the index folder name
     * @param key {string} - Key for serializing and deserialize of the index
     * @param payload {object} - Additional payload
     */
    constructor(userId: string, key: string, payload: SearchInitialPayload) {
        super();
        logger.info(`-------------------- Swift-Search Utils Initialized --------------------`);
        logger.info(`-------------------- Starting Swift-Search --------------------`);
        this.searchPeriodSubtract = (payload && payload.searchPeriod) || searchConfig.SEARCH_PERIOD_SUBTRACTOR;
        this.minimumDiskSpace = (payload && payload.minimumDiskSpace) || searchConfig.MINIMUM_DISK_SPACE;
        this.publishLibState = (payload && payload.setLibInit) || null;
        this.isInitialized = false;
        this.userId = userId;
        this.isRealTimeIndexing = false;
        this.validatorResponse = null;
        this.getUserConfig(key);
        this.collector = makeBoundTimedCollector(this.checkIsRealTimeIndexing.bind(this),
            searchConfig.REAL_TIME_INDEXING_TIME, this.realTimeIndexing.bind(this));
    }

    /**
     * Checks config version before decompression
     * @param key {string} - Key for serializing and deserialize of the index
     */
    public getUserConfig(key: string): void {
        super.getSearchUserConfig(this.userId)
            .then((config: UserConfig) => {
                if (config.indexVersion === searchConfig.INDEX_VERSION) {
                    /**
                     * decompress passing false as 2nd arg
                     * decrypts the previously stored index
                     */
                    this.decompress(key, false);
                    return;
                }
                /**
                 * decompress passing true as 2nd arg creates
                 * a new index without decrypting the old
                 * index
                 */
                this.decompress(key, true);
            })
            .catch(() => {
                this.decompress(key, true);
                logger.error('search: Error reading user config');
            });
    }

    /**
     * returns isInitialized boolean
     * @returns {boolean}
     */
    public isLibInit(): boolean {
        return this.isInitialized;
    }

    /**
     * This init function
     * initialise the SymphonySearchEngine library
     * and creates a folder in the userData
     * @param key {string} - Key for serializing and deserialize of the index
     * @param isDecompressed {boolean} - If decompressed
     */
    public async init(key: string, isDecompressed: boolean): Promise<void> {
        if (!key) {
            return;
        }
        const bufKey = new Buffer(key, searchConfig.KEY_ENCODING);
        if (bufKey.length !== searchConfig.KEY_LENGTH) {
            return;
        }
        libSymphonySearch.symSEDestroy();
        try {
            libSymphonySearch.symSEInit(searchConfig.LIBRARY_CONSTANTS.DICTIONARY_PATH);
        } catch (e) {
            logger.error(`search: Initialization failed (symSEInit)`, e);
            this.setLibInitState(false);
            return;
        }
        libSymphonySearch.symSEClearMainRAMIndex();
        libSymphonySearch.symSEClearRealtimeRAMIndex();
        const userIndexPath = path.join(searchConfig.FOLDERS_CONSTANTS.INDEX_PATH,
            `${searchConfig.FOLDERS_CONSTANTS.PREFIX_NAME}_${this.userId}`);
        if (isFileExist.call(this, 'USER_INDEX_PATH') && isDecompressed) {
            const mainIndexFolder = path.join(userIndexPath, searchConfig.FOLDERS_CONSTANTS.MAIN_INDEX);
            libSymphonySearch.symSEDeserializeMainIndexToEncryptedFoldersAsync(mainIndexFolder, key, (error: never, res: number) => {

                clearSearchData.call(this);
                if (res === undefined || res === null || res < 0) {
                    logger.error(`search: Deserialization of Main Index Failed`, error);
                    this.setLibInitState(true);
                    return;
                }
                logger.info(`search: Deserialization of Main Index Successful`, res);
                const indexDateStartFrom = new Date().getTime() - this.searchPeriodSubtract;
                // Deleting all the messages except 3 Months from now
                libSymphonySearch.symSEDeleteMessagesFromRAMIndex(null,
                    searchConfig.MINIMUM_DATE, indexDateStartFrom.toString());
                this.setLibInitState(true);
                logger.info(`-------------------- Initialization Complete --------------------`);
            });
        } else {
            logger.info(`-------------------- Initializing Fresh Index --------------------`);
            this.setLibInitState(true);
            clearSearchData.call(this);
        }
    }

    /**
     * This validated the available size of the index
     * If less than the minimumDiskSpace will init the search
     * else we disable swift-search
     * @param key {string} - Key for serializing and deserialize of the index
     * @param isDecompressed {boolean} - If decompressed
     */
    public async validateIndexSize(key: string, isDecompressed: boolean): Promise<void> {
        const lz4Path = path.join(searchConfig.FOLDERS_CONSTANTS.INDEX_PATH,
            `${searchConfig.FOLDERS_CONSTANTS.PREFIX_NAME}_${this.userId}${searchConfig.TAR_LZ4_EXT}`);
        const stats = fs.existsSync(lz4Path) && fs.statSync(lz4Path);
        if (stats && stats.size > this.minimumDiskSpace) {
            logger.info(`search: Disabling Swift Search Index file (LZ4) size is greater than`, {
                minimumDiskSpace: this.minimumDiskSpace,
                size: stats.size,
            });
            this.setLibInitState(false);
            clearSearchData.call(this);
            return;
        }
        const validateSpace = stats && stats.size ? stats.size - this.minimumDiskSpace : this.minimumDiskSpace;
        const result = await super.checkFreeSpace(validateSpace);
        if (!result) {
            logger.info(`search: Disabling Swift Search disk space less than the subtracted space (file size lz4 - minimum space required > available space)`, {
                minimumDiskSpace: this.minimumDiskSpace,
                size: stats && stats.size,
            });
            this.setLibInitState(false);
            clearSearchData.call(this);
            return;
        }

        if (isFileExist.call(this, 'USER_INDEX_PATH') && isDecompressed) {
            const validatorResponse = await indexValidator.call(this, key);
            logger.info(`search: Index validator response`, validatorResponse);
            if (!validatorResponse) {
                logger.info(`search: Index Corrupted`);
                logger.info(`-------------------- search: Initializing Fresh Index --------------------`);
                this.init(key, false);
                return;
            }
            try {
                if (!this.validatorResponse) {
                    this.validatorResponse = {};
                }
                Object.assign(this.validatorResponse, { size: stats && stats.size});
                logger.info(`search: Index validator response with size`, this.validatorResponse);
            } catch (e) {
                logger.info(`search: set size to validatorResponse failed`, this.validatorResponse);
                this.validatorResponse = null;
            }
        }
        this.init(key, isDecompressed);
    }

    /**
     * This function sets the isInitialized state
     * which is then published to client only if its in
     * context-isolated world
     * @param state
     */
    public setLibInitState(state: boolean): void {
        if (typeof state !== 'boolean') {
            return;
        }
        this.isInitialized = state;
        if (typeof this.publishLibState === 'function') {
            logger.info(`search: publishing lib state`, this.isInitialized);
            this.publishLibState(this.isInitialized);
        }
    }

    /**
     * decompress the previously
     * @param key {string} - Key for serializing and deserialize of the index
     * @param reIndex {boolean} - Does re-indexing required
     */
    public decompress(key: string, reIndex: boolean): void {
        const userIndexPath = path.join(searchConfig.FOLDERS_CONSTANTS.INDEX_PATH,
            `${searchConfig.FOLDERS_CONSTANTS.PREFIX_NAME}_${this.userId}`);
        // SEARCH-1496: Need to clear the data folder before decompression
        clearSearchData.call(this);
        if (isFileExist.call(this, 'LZ4') && !reIndex) {
            decompression(`${userIndexPath}${searchConfig.TAR_LZ4_EXT}`, (status: boolean) => {
                let decompressedStatus = true;
                if (!status) {
                    logger.info('search: decompression: failed re-creating index');
                    clearSearchData.call(this);
                    logger.info('search: Creating new index');
                    fs.mkdirSync(userIndexPath);
                    decompressedStatus = false;
                }
                this.validateIndexSize(key, decompressedStatus);
            });
        } else {
            if (!isFileExist.call(this, 'USER_INDEX_PATH')) {
                fs.mkdirSync(userIndexPath);
            }
            this.init(key, false);
        }
    }

    /**
     * An array of messages is passed for indexing
     * it will be indexed in a temporary index folder
     * @param messages {Array}
     * @param callback {function} - success or failure callback
     */
    public indexBatch(messages: string, callback: any): any {
        if (typeof callback !== 'function') {
            return false;
        }

        if (!messages) {
            logger.error('search: Batch Indexing: Messages not provided');
            return callback(false, 'Batch Indexing: Messages are required');
        }

        try {
            const messagesData = JSON.parse(messages);
            if (!(messagesData instanceof Array)) {
                logger.error('search: Batch Indexing: Messages must be an array');
                return callback(false, 'Batch Indexing: Messages must be an array');
            }
        } catch (e) {
            logger.error(`search: Batch Indexing: parse error`, e);
            return callback(false, 'Batch Indexing parse error');
        }

        if (!this.isInitialized) {
            logger.error('search: Library not initialized');
            return callback(false, 'Library not initialized');
        }

        libSymphonySearch.symSEIndexMainRAMAsync(messages, (err: any, res: any) => {
            if (err) {
                logger.error(`search: IndexBatch: Error indexing messages to memory`, err);
                return callback(false, 'IndexBatch: Error indexing messages to memory');
            }
            return callback(true, res);
        });

        return false;
    }

    /**
     * Batching the real time
     * messages for queue and flush
     * @param message {Object}
     */
    public batchRealTimeIndexing(message: Message[]): void {
        this.collector(message);
    }

    /**
     * Returns the current state of the
     * real-time indexing
     * @returns {boolean}
     */
    public checkIsRealTimeIndexing(): boolean {
        return this.isRealTimeIndexing;
    }

    /**
     * An array of messages to be indexed
     * in real time
     * @param messages {string}
     * @param callback {function}
     */
    public realTimeIndexing(messages: string, callback: (status: boolean, message: string) => void): void | boolean | null {
        if (typeof callback !== 'function') {
            return false;
        }

        try {
            const messagesData = JSON.parse(messages);
            if (!(messagesData instanceof Array)) {
                return callback(false, 'RealTime Indexing: Messages must be an array');
            }
        } catch (e) {
            return callback(false, 'RealTime Indexing: parse error ');
        }

        if (!this.isInitialized) {
            return callback(false, 'Library not initialized');
        }

        this.isRealTimeIndexing = true;
        libSymphonySearch.symSEIndexRealtimeRAMAsync(messages, (err: any, result: any) => {
            this.isRealTimeIndexing = false;
            if (err) {
                return callback(false, 'RealTime Indexing: error');
            }
            return callback(true, result);
        });

        return null;
    }

    /**
     * Encrypting the index after the merging the index
     * to the main user index
     * @param key {string} - Key for serializing and deserialize of the index
     */
    public encryptIndex(key: string): Promise<void> {
        const mainIndexFolder: string = path.join(searchConfig.FOLDERS_CONSTANTS.INDEX_PATH,
            `${searchConfig.FOLDERS_CONSTANTS.PREFIX_NAME}_${this.userId}`);
        return new Promise((resolve: any) => {
            if (!isFileExist.call(this, 'USER_INDEX_PATH')) {
                fs.mkdirSync(mainIndexFolder);
            }

            if (!this.isInitialized) {
                logger.error('search: Library not initialized');
                return;
            }
            libSymphonySearch.symSESerializeMainIndexToEncryptedFoldersAsync(mainIndexFolder, key, (err: any, res: any) => {
                if (res === undefined || res === null || res < 0) {
                    logger.error(`search: Serializing Main Index Failed`, err);
                    if (isFileExist.call(this, 'USER_INDEX_PATH')) {
                        clearSearchData.call(this);
                    }
                    return;
                }
                const userIndexPath: string = `${searchConfig.FOLDERS_CONSTANTS.PREFIX_NAME}_${this.userId}`;
                compression(userIndexPath, userIndexPath, (status: boolean) => {
                    if (!status) {
                        logger.error('search: Error Compressing Main Index Folder');
                    }
                    logger.info(`-------------------- Compression Complete --------------------`);
                    clearSearchData.call(this);
                });
                resolve();
            });
        });
    }

    /**
     * This returns the search results
     * which returns a char *
     * @param query {String}
     * @param senderIds {Array}
     * @param threadIds {Array}
     * @param fileType {String}
     * @param startDate {String}
     * @param endDate {String}
     * @param limit {Number}
     * @param offset {Number}
     * @param sortOrder {Number}
     * @returns {Promise}
     * @deprecated Use searchQueryV2 instead
     */
    public searchQuery(query: string, senderIds: string[], threadIds: string[], fileType: string, startDate: string,
                       endDate: string, limit: number, offset: number, sortOrder: number): Promise<SearchResponse> {

        let LIMIT = limit;
        let OFFSET = offset;
        let SORT_ORDER = sortOrder;

        return new Promise((resolve) => {
            if (!this.isInitialized) {
                logger.error('search: Library not initialized');
                resolve({
                    messages: [],
                    more: 0,
                    returned: 0,
                    total: 0,
                });
                return;
            }

            if (SORT_ORDER === undefined || SORT_ORDER === null || typeof SORT_ORDER !== 'number' || Math.round(SORT_ORDER) !== SORT_ORDER) {
                SORT_ORDER = searchConfig.SORT_BY_DATE;
            }

            const q = this.constructQuery(query, senderIds, threadIds, fileType, SORT_ORDER === searchConfig.SORT_BY_DATE);

            if (!q) {
                resolve({
                    messages: [],
                    more: 0,
                    returned: 0,
                    total: 0,
                });
                return;
            }

            const searchPeriod = new Date().getTime() - this.searchPeriodSubtract;
            let startDateTime = searchPeriod;
            if (startDate) {
                startDateTime = new Date(parseInt(startDate, 10)).getTime();
                if (!startDateTime || startDateTime < searchPeriod) {
                    startDateTime = searchPeriod;
                }
            }

            let endDateTime: any = searchConfig.MAXIMUM_DATE;
            if (endDate) {
                const eTime = new Date(parseInt(endDate, 10)).getTime();
                if (eTime) {
                    endDateTime = eTime;
                }
            }

            if (!LIMIT || typeof LIMIT !== 'number' || Math.round(LIMIT) !== LIMIT) {
                LIMIT = 25;
            }

            if (!OFFSET || typeof OFFSET !== 'number' || Math.round(OFFSET) !== OFFSET) {
                OFFSET = 0;
            }

            const returnedResult = libSymphonySearch.symSERAMIndexSearch(q, startDateTime.toString(), endDateTime.toString(), OFFSET, LIMIT, SORT_ORDER);
            try {
                const ret = ref.readCString(returnedResult);
                resolve(JSON.parse(ret));
            } finally {
                libSymphonySearch.symSEFreeResult(returnedResult);
            }
        });
    }

    /**
     * This returns the search results
     * which returns a char *
     * @param payload {object}
     * @returns {Promise}
     */
    public searchQueryV2(payload: SearchPayload): Promise<SearchResponse> {

        const {
            q,
            startDate,
            endDate,
            limit,
            offset,
            sortOrder,
        } = payload;

        let LIMIT = limit;
        let OFFSET = offset;
        let SORT_ORDER = sortOrder;

        return new Promise((resolve) => {
            if (!this.isInitialized) {
                logger.error('search: Library not initialized');
                resolve({
                    messages: [],
                    more: 0,
                    returned: 0,
                    total: 0,
                });
                return;
            }

            if (SORT_ORDER === undefined || SORT_ORDER === null || typeof SORT_ORDER !== 'number' || Math.round(SORT_ORDER) !== SORT_ORDER) {
                SORT_ORDER = searchConfig.SORT_BY_DATE;
            }

            if (!q) {
                resolve({
                    messages: [],
                    more: 0,
                    returned: 0,
                    total: 0,
                });
                return;
            }

            const searchPeriod = new Date().getTime() - this.searchPeriodSubtract;
            let startDateTime = searchPeriod;
            if (startDate) {
                startDateTime = new Date(parseInt(startDate, 10)).getTime();
                if (!startDateTime || startDateTime < searchPeriod) {
                    startDateTime = searchPeriod;
                }
            }

            let endDateTime: any = searchConfig.MAXIMUM_DATE;
            if (endDate) {
                const eTime = new Date(parseInt(endDate, 10)).getTime();
                if (eTime) {
                    endDateTime = eTime;
                }
            }

            if (!LIMIT || typeof LIMIT !== 'number' || Math.round(LIMIT) !== LIMIT) {
                LIMIT = 25;
            }

            if (!OFFSET || typeof OFFSET !== 'number' || Math.round(OFFSET) !== OFFSET) {
                OFFSET = 0;
            }

            const returnedResult = libSymphonySearch.symSERAMIndexSearch(q, startDateTime.toString(), endDateTime.toString(), OFFSET, LIMIT, SORT_ORDER);
            try {
                const ret = ref.readCString(returnedResult);
                resolve(JSON.parse(ret));
            } finally {
                libSymphonySearch.symSEFreeResult(returnedResult);
            }
        });
    }

    /**
     * returns the latest message timestamp
     * from the indexed data
     * @param callback {function}
     */
    public getLatestMessageTimestamp(callback: any): boolean | void | null {
        if (typeof callback !== 'function') {
            return false;
        }

        if (!this.isInitialized) {
            logger.error('search: Library not initialized');
            return callback(false, 'Not initialized');
        }

        libSymphonySearch.symSEMainRAMIndexGetLastMessageTimestampAsync((err: any, res: any) => {
            if (err) {
                logger.error(`search: Error getting the index timestamp`, err);
                return callback(false, 'Error getting the index timestamp');
            }
            const returnedResult = res;
            try {
                const ret = ref.readCString(returnedResult);
                return callback(true, ret);
            } finally {
                libSymphonySearch.symSEFreeResult(returnedResult);
            }
        });

        return null;
    }

    /**
     * This function clears the real-time index
     * before starting the batch-indexing
     */
    public deleteRealTimeFolder(): void {
        if (!this.isInitialized) {
            return;
        }
        libSymphonySearch.symSEClearRealtimeRAMIndex();
    }

    /**
     * This the query constructor
     * for the search function
     * @param searchQuery {String}
     * @param senderId {Array}
     * @param threadId {Array}
     * @param fileType {String}
     * @param sort {Boolean}
     * @returns {string}
     * @deprecated
     */
    public constructQuery(searchQuery: string, senderId: string[], threadId: string[], fileType: string, sort: boolean): string {

        let searchText = '';
        let textQuery = '';
        if (searchQuery !== undefined) {
            searchText = searchQuery.trim().toLowerCase(); // to prevent injection of AND and ORs
            textQuery = this.getTextQuery(searchText, sort);
        }
        let q = '';
        const hashTags = this.getHashTags(searchText);
        let hashCashTagQuery = '';

        if (hashTags.length > 0) {
            hashCashTagQuery = ' OR tags:(';
            hashTags.forEach((item: string) => {
                hashCashTagQuery = hashCashTagQuery + '"' + item + '" ';
            });
            hashCashTagQuery += ')';
        }

        let hasAttachments = false;
        let additionalAttachmentQuery = '';
        if (fileType) {
            hasAttachments = true;
            if (fileType.toLowerCase() === 'attachment') {
                additionalAttachmentQuery = '(hasfiles:true)';
            } else {
                additionalAttachmentQuery = '(filetype:(' + fileType + '))';
            }
        }

        if (searchText.length > 0 ) {
            q = '((text:(' + textQuery + '))' + hashCashTagQuery ;
            if (hasAttachments) {
                q += ' OR (filename:(' + searchText + '))' ;
            }
            q = q + ')';
        }

        q = this.appendFilterQuery(q, 'senderId', senderId);
        q = this.appendFilterQuery(q, 'threadId', threadId);

        if (q === '') {
            if (hasAttachments) {
                q = additionalAttachmentQuery;
            } else {
                q = ''; // will be handled in the search function
            }
        } else {
            if (hasAttachments) {
                q = q + ' AND ' + additionalAttachmentQuery;
            }
        }
        return q;
    }

    /**
     * This will destroy search instance if created
     */
    public destroyLibrary() {
        if (!libSymphonySearch) {
            return;
        }
        logger.info(`-------------------- Swift-Search Instance Destroyed --------------------`);
        this.setLibInitState(false);
        libSymphonySearch.symSEDestroy();
    }

    /**
     * appending the senderId and threadId for the query
     * @param searchText {String}
     * @param fieldName {String}
     * @param valueArray {Array}
     * @returns {string}
     * @deprecated
     */
    private appendFilterQuery(searchText: string, fieldName: string, valueArray: any[]): string {
        let q = '';
        if (valueArray && valueArray.length > 0 ) {

            q += '(' + fieldName + ':(';
            valueArray.forEach((item) => {
                q += '"' + item + '" ';
            });
            q += '))';
            if (searchText.length > 0 ) {
                q = searchText + ' AND ' + q;
            }

        } else {
            q = searchText;
        }

        return q;
    }

    // hashtags can have any characters(before the latest release it was
    // not like this). So the only regex is splitting the search query based on
    // whitespaces
    /**
     * return the hash cash
     * tags from the query
     * @param searchText {String}
     * @returns {Array}
     * @deprecated
     */
    private getHashTags(searchText: string): any[string] {
        const hashTags: any[] = [];
        const tokens = searchText.toLowerCase()
            .trim()
            .replace(/\s\s+/g, ' ')
            .split(' ').filter((el) => el.length !== 0);
        tokens.forEach((item) => {
            if (item.startsWith('#') || item.startsWith('$')) {
                hashTags.push(item);
            }
        });
        return hashTags;
    }

    /**
     * If the search query does not have double quotes (implying phrase search),
     * then create all tuples of the terms in the search query
     * @param searchText {String}
     * @param sort {Boolean}
     * @returns {String}
     * @deprecated
     */
    private getTextQuery(searchText: string, sort: boolean): string {
        const s1 = searchText.trim().toLowerCase();
        // if contains quotes we assume it will be a phrase search
        if (searchText.indexOf('"') !== -1 ) {
            return s1;
        }
        // else we will create tuples
        const s2 = s1.replace(/\s{2,}/g, ' ').trim();
        const tokens = s2.split(' ');

        let i;
        let j = 0;
        let out = '';
        if (sort) {
            return tokens.join(' ');
        }
        for (i = tokens.length; i > 0; i--) {// number of tokens in a tuple
            for (j = 0; j < tokens.length - i + 1 ; j++) { // start from index
                if (out !== '') {
                    out += ' ';
                }
                out += this.putTokensInRange(tokens, j, i);
            }
        }
        return out;
    }

    /**
     * Helper function for getTextQuery()
     * Given a list of tokens create a tuple given the start index of the
     * token list and given the number of tokens to create.
     * @param tokens {Array}
     * @param start {Number}
     * @param numTokens {Number}
     * @returns {String}
     * @deprecated
     */
    private putTokensInRange(tokens: any[], start: number, numTokens: number): string {
        let out = '"';
        for (let i = 0; i < numTokens; i++) {
            if (i !== 0) {
                out += ' ';
            }
            out += tokens[start + i];
        }
        out += '"';
        return out;
    }

}

function clearSearchData(this: Search): void {
    function removeFiles(filePath: string) {
        if (fs.existsSync(filePath)) {
            fs.readdirSync(filePath).forEach((file) => {
                const curPath = filePath + '/' + file;
                if (fs.lstatSync(curPath).isDirectory()) {
                    removeFiles(curPath);
                } else {
                    try {
                        fs.unlinkSync(curPath);
                    } catch (e) {
                        logger.warn('search: clearSearchData -> Error removing index file ' +
                            '(nothing to worry this will be replaced by lz4 extraction)');
                    }
                }
            });
            try {
                fs.rmdirSync(filePath);
            } catch (e) {
                logger.warn('search: clearSearchData -> Error removing index dir ' +
                    '(nothing to worry this will be replaced by lz4 extraction)');
            }
        }
    }

    if (this.userId) {
        removeFiles(path.join(searchConfig.FOLDERS_CONSTANTS.INDEX_PATH,
            `${searchConfig.FOLDERS_CONSTANTS.PREFIX_NAME}_${this.userId}`));
    }
}

/**
 * Check if the file or folder exist or not
 * @param type
 * @returns {boolean}
 */
function isFileExist(this: Search, type: string): boolean {
    let searchPath;

    if (!this.userId) {
        return false;
    }

    const paths: any = {
        LZ4: path.join(searchConfig.FOLDERS_CONSTANTS.INDEX_PATH,
            `${searchConfig.FOLDERS_CONSTANTS.PREFIX_NAME}_${this.userId}${searchConfig.TAR_LZ4_EXT}`),
        USER_INDEX_PATH: path.join(searchConfig.FOLDERS_CONSTANTS.INDEX_PATH,
            `${searchConfig.FOLDERS_CONSTANTS.PREFIX_NAME}_${this.userId}`),
    };

    searchPath = paths[type];

    return searchPath && fs.existsSync(searchPath);
}

/**
 * Validate Index before initializing the index
 * to prevent unexpected crashes due to corrupted index
 * @param {string} key
 */
async function indexValidator(this: Search, key: string): Promise<boolean> {
    const userIndexPath = path.join(searchConfig.FOLDERS_CONSTANTS.INDEX_PATH,
        `${searchConfig.FOLDERS_CONSTANTS.PREFIX_NAME}_${this.userId}`);
    const mainIndexFolder = path.join(userIndexPath, searchConfig.FOLDERS_CONSTANTS.MAIN_INDEX);
    try {
        const { stdout } = await exec(`"${searchConfig.LIBRARY_CONSTANTS.INDEX_VALIDATOR}" "${mainIndexFolder}" "${key}" "${searchConfig.LIBRARY_CONSTANTS.DICTIONARY_PATH}"`);
        const data = JSON.parse(stdout);
        logger.info(`search: Index validator response`, { stdout: data });
        this.validatorResponse = data;
        if (data.status === 'OK') {
            return true;
        }
        logger.error('search: Unable validate index folder status false');
        return false;
    } catch (err) {
        if (err.stdout) {
            try {
                this.validatorResponse = JSON.parse(err.stdout);
            } catch (e) {
                this.validatorResponse = null;
            }
            logger.error(`search: Index Validation error stdout`, { stdoutError: err.stdout });
        }
        logger.error(`search: Index Validation failed / Corrupted`);
        return false;
    }
}
