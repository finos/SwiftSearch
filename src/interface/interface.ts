/**
 * Search User Config interface
 */
export interface UserConfig {
    rotationId: number;
    language: string;
    version: number;
    indexVersion: string;
}

/**
 * FileInterface
 */
interface FileInterface {
    file: string;
    level: string;
    format: string;
    maxSize: number;
    appName: string;
}

/**
 * TransportsInterface
 */
interface TransportsInterface {
    file: FileInterface;
}

/**
 * ElectronLogInterface
 */
export interface ElectronLogInterface {
    transports: TransportsInterface;
    error(message: string): void;
    warn(message: string): void;
    info(message: string): void;
    debug(message: string): void;
}

/**
 * LogWindow
 */
export interface LogWindow {
    send(id: string, message: object): void;
}

/**
 * Entities
 */
interface Entities {
    hashtags: any[];
    cashtags: any[];
    userMentions: any[];
}

/**
 * Messages
 */
export interface Message {
    renderingBlob: string;
    messageId: string;
    text: string;
    senderId: string;
    threadId: string;
    ingestionDate: string;
    chatType: string;
    isPublic: string;
    sendingApp: string;
    senderAvatar: string;
    senderName: string;
    senderType: string;
    entities: Entities;
    tags: string;
    attachments: any[];
    attachmentNames: string;
}

/**
 * SearchResponse
 */
export interface SearchResponse {
    messages: Message[];
    more: number;
    returned: number;
    total: number;
}

/**
 * Search Payload
 */
export interface SearchPayload {
    q: string;
    limit: number;
    offset: number;
    sortOrder: number;
    startDate: string;
    endDate: string;
}

/**
 * SearchInterface
 */
export interface SearchInterface {
    getUserConfig(key: string): void;
    isLibInit(): boolean;
    init(key: string, isDecompressed: boolean): Promise<void>;
    decompress(key: string, reIndex: boolean): void;
    indexBatch(messages: string, callback: any): any;
    batchRealTimeIndexing(message: Message[]): void;
    checkIsRealTimeIndexing(): boolean;
    realTimeIndexing(messages: string, callback: (status: boolean, message: string) => void): void | boolean | null;
    encryptIndex(key: string): Promise<void>;
    searchQuery(query: string, senderIds: string[], threadIds: string[], fileType: string, startDate: string,
                endDate: string, limit: number, offset: number, sortOrder: number, isQueryConstructed: boolean): Promise<SearchResponse>;
    searchQueryV2(payload: SearchPayload): Promise<SearchResponse>;
    getLatestMessageTimestamp(callback: any): boolean | void | null;
    deleteRealTimeFolder(): void;
    constructQuery(searchQuery: string, senderId: string[], threadId: string[], fileType: string, sort: boolean): string;
}

/**
 * SearchUtilsInterface
 */
export interface SearchUtilsInterface {
    checkFreeSpace(minimumDiskSpace: number): Promise<boolean>;
    getSearchUserConfig(userId: string): Promise<UserConfig>;
    updateUserConfig(userId: string, data: UserConfig): Promise<UserConfig>;
}
/**
 * SSAPIBridgeInterface
 */
export interface SSAPIBridgeInterface {
    handleMessageEvents(data: any): void;
    indexBatch(data: PostDataFromSFE): void;
    realTimeIndex(data: PostDataFromSFE): void;
    searchQuery(data: PostDataFromSFE): void;
    indexBatchCallback(requestId: number, status: boolean, data: string): void;
    getLatestTimestampCallback(requestId: number, status: boolean, timestamp: string): void;
    searchCallback(requestId: number, data: any): void;
    checkDiskSpace(data: PostDataFromSFE): void;
    getSearchUserConfig(data: PostDataFromSFE): void;
    updateUserConfig(data: PostDataFromSFE): void;
    getLatestTimestamp(data: PostDataFromSFE): void;
    encryptIndex(data: PostDataFromSFE): void;
    deleteRealTimeFolder(): void;
    publishInitializeState(arg: boolean): void;
}

export interface SearchInitialPayload {
    searchPeriod: number;
    minimumDiskSpace: number;
    setLibInit: (state: boolean) => void;
}

export interface PostSuccessCallback {
    method: string;
    requestId: number;
    response: any;
}

export interface PostErrorCallback {
    method: string;
    requestId: number;
    error: any;
}

export interface PostDataFromSFE {
    requestId: number;
    message?: any;
}

export enum apiBridgeCmds {
    // Main Events
    swiftSearch = 'swift-search',
    initialSearch = 'swift-search::init-search',
    indexBatch = 'swift-search::index-batch',
    search = 'swift-search::search',
    getLatestTimestamp = 'swift-search::get-latest-timestamp',
    encryptIndex = 'swift-search::encrypt-index',
    realTimeIndex = 'swift-search::real-time-index',
    deleteRealTimeIndex = 'swift-search::delete-real-time-index',
    getValidatorResponse = 'swift-search::get-validator-response',
    setIsSwiftSearchInitialized = 'swift-search::set-is-swift-search-initialized',

    // Search Utils
    checkDiskSpace = 'swift-search::check-disk-space',
    getSearchUserConfig = 'swift-search::get-search-user-config',
    updateUserConfig = 'swift-search::update-user-config',

    // Callbacks
    indexBatchCallback = 'swift-search::index-batch-callback',
    searchCallback = 'swift-search::search-callback',
    checkDiskSpaceCallBack = 'swift-search::check-disk-space-callback',
    getSearchUserConfigCallback = 'swift-search::get-search-user-config-callback',
    updateUserConfigCallback = 'swift-search::update-user-config-callback',
    getLatestTimestampCallback = 'swift-search::get-latest-timestamp-callback',
    encryptIndexCallback = 'swift-search::encrypt-index-callback',
    getValidatorResponseCallback = 'swift-search::get-validator-response-callback',
}
