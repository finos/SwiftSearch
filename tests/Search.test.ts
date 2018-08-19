import * as fs from 'fs';
import * as path from 'path';
import { SearchResponse, UserConfig } from '../src/interface/interface';
import {isMac, isWindowsOS} from '../src/utils/misc';

let executionPath: string = '';
let userConfigDir: string = '';

let searchConfig: any;
let SearchApi: any;
let SearchUtilsAPI: any;
let libSymphonySearch: any;

jest.mock('electron', (): object => {
    return {
        app: {
            getName: mockedGetName,
            getPath: mockedGetPath,
        },
    };
});

function mockedGetName(): string {
    return 'Symphony';
}

function mockedGetPath(type: string): string {
    if (type === 'exe') {
        return executionPath;
    }

    if (type === 'userData') {
        return userConfigDir;
    }
    return '';
}

describe('Tests for Search', () => {

    let userId: number;
    let key: string;
    const currentDate: number = new Date().getTime();

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

    beforeAll((done) => {
        userId = 12345678910112;
        key = 'jjjehdnctsjyieoalskcjdhsnahsadndfnusdfsdfsd=';

        executionPath = path.join(__dirname, 'library');
        if (isWindowsOS) {
            executionPath = path.join(__dirname, '..', 'library');
        }
        userConfigDir = path.join(__dirname, '..');
        libSymphonySearch = require('../src/searchLibrary').libSymphonySearch;
        searchConfig = require('../src/searchConfig').searchConfig;
        if (fs.existsSync(path.join(userConfigDir, 'search_index_12345678910112.tar.lz4'))) {
            fs.unlinkSync(path.join(userConfigDir, 'search_index_12345678910112.tar.lz4'));
        }
        if (fs.existsSync(path.join(userConfigDir, 'search_index_12345678910112'))) {
            deleteIndexFolders(path.join(userConfigDir, 'search_index_12345678910112'));
        }
        const Search = require('../index').Search;
        SearchApi = new Search(userId, key);
        const SearchUtils = require('../index').SearchUtils;
        SearchUtilsAPI = new SearchUtils();

        done();
    });

    afterAll((done) => {
        setTimeout(() => {
            libSymphonySearch.symSEDestroy();
            if (fs.existsSync(path.join(userConfigDir, 'search_index_12345678910112.tar.lz4'))) {
                fs.unlinkSync(path.join(userConfigDir, 'search_index_12345678910112.tar.lz4'));
            }

            if (fs.existsSync(searchConfig.FOLDERS_CONSTANTS.USER_CONFIG_FILE)) {
                fs.unlinkSync(searchConfig.FOLDERS_CONSTANTS.USER_CONFIG_FILE);
            }
            done();
        }, 3000);
    });

    function deleteIndexFolders(location: string) {
        if (fs.existsSync(location)) {
            fs.readdirSync(location).forEach((file) => {
                const curPath = path.join(location, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    deleteIndexFolders(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(location);
        }
    }

    describe('Search Initial checks', () => {

        it('should be initialized', (done) => {
            setTimeout(() => {

                expect(SearchApi.isInitialized).toBe(true);
                expect(SearchApi.isRealTimeIndexing).toBe(false);

                done();
            }, 3000);
        });

        it('should isLibInit to true', () => {
            const init = SearchApi.isLibInit();
            expect(init).toEqual(true);
        });

        it('should isLibInit to false', () => {
            SearchApi.isInitialized = false;
            const init = SearchApi.isLibInit();
            expect(init).toEqual(false);
            SearchApi.isInitialized = true;
        });

    });

    describe('Batch indexing process tests', () => {

        it('should index in a batch', (done) => {
            const messages = [{
                chatType: 'CHATROOM',
                ingestionDate: currentDate.toString(),
                isPublic: 'false',
                messageId: 'Jc+4K8RtPxHJfyuDQU9atX///qN3KHYXdA==',
                senderId: '71811853189212',
                sendingApp: 'lc',
                text: 'it works',
                threadId: 'Au8O2xKHyX1LtE6zW019GX///rZYegAtdA==',
            }, {
                chatType: 'CHATROOM',
                ingestionDate: currentDate.toString(),
                isPublic: 'false',
                messageId: 'Jc+4K8RtPxHJfyuDeU9atX///qN3KHYXdA==',
                senderId: '71811853189212',
                sendingApp: 'lc',
                text: 'it works',
                threadId: 'Au8O2xKHyX1LtE6zW019GX///rZYegAtdA==',
            }, {
                chatType: 'CHATROOM',
                ingestionDate: currentDate.toString(),
                isPublic: 'false',
                messageId: 'Jc+4K8RtPxHJfyuDrU9atX///qN3KHYXdA==',
                senderId: '71811853189212',
                sendingApp: 'lc',
                text: 'it works',
                threadId: 'Au8O2xKHyX1LtE6zW019GX///rZYegAtdA==',
            }];
            const indexBatch = jest.spyOn(SearchApi, 'indexBatch');
            function handleResponse(status: boolean, data: number) {
                expect(indexBatch).toHaveBeenCalled();
                expect(status).toBe(true);
                expect(data).toBe(0);
                done();
            }
            SearchApi.indexBatch(JSON.stringify(messages), handleResponse);
        });

        it('should not batch index', (done) => {
            const indexBatch = jest.spyOn(SearchApi, 'indexBatch');
            function handleResponse(status: boolean, data: string) {
                expect(indexBatch).toHaveBeenCalled();
                expect(status).toBe(false);
                expect(data).toBe('Batch Indexing: Messages are required');
                done();
            }
            SearchApi.indexBatch(undefined, handleResponse);
        });

        it('should not batch index invalid object', (done) => {
            const indexBatch = jest.spyOn(SearchApi, 'indexBatch');
            function handleResponse(status: boolean, data: string) {
                expect(indexBatch).toHaveBeenCalled();
                expect(status).toBe(false);
                expect(data).toEqual('Batch Indexing parse error');
                done();
            }
            SearchApi.indexBatch('message', handleResponse);
        });

        it('should not batch index parse error', (done) => {
            const message = {
                chatType: 'CHATROOM',
                ingestionDate: currentDate.toString(),
                isPublic: 'false',
                messageId: 'Jc+4K8RtPxHJfyuDQU9atX///qN3KHYXdA==',
                senderId: '71811853189212',
                sendingApp: 'lc',
                text: 'it works',
                threadId: 'Au8O2xKHyX1LtE6zW019GX///rZYegAtdA==',
            };
            const indexBatch = jest.spyOn(SearchApi, 'indexBatch');
            function handleResponse(status: boolean, data: string) {
                expect(indexBatch).toHaveBeenCalled();
                expect(status).toBe(false);
                expect(data).toEqual('Batch Indexing: Messages must be an array');
                done();
            }
            SearchApi.indexBatch(JSON.stringify(message), handleResponse);
        });

        it('should not batch index isInitialized is false', (done) => {
            SearchApi.isInitialized = false;
            const message = [ {
                chatType: 'CHATROOM',
                ingestionDate: currentDate.toString(),
                isPublic: 'false',
                messageId: 'Jc+4K8RtPxHJfyuDQU9atX///qN3KHYXdA==',
                senderId: '71811853189212',
                sendingApp: 'lc',
                text: 'it fails',
                threadId: 'Au8O2xKHyX1LtE6zW019GX///rZYegAtdA==',
            } ];
            const indexBatch = jest.spyOn(SearchApi, 'indexBatch');
            function handleResponse(status: boolean, data: string) {
                expect(indexBatch).toHaveBeenCalled();
                expect(status).toBe(false);
                expect(data).toEqual('Library not initialized');
                SearchApi.isInitialized = true;
                done();
            }
            SearchApi.indexBatch(JSON.stringify(message), handleResponse);
        });

        it('should match messages length after batch indexing', (done) => {
            const searchQuery = jest.spyOn(SearchApi, 'searchQuery');
            SearchApi.searchQuery('it works', [], [],
                '', undefined, undefined, 25, 0,
                0).then((res: SearchResponse) => {
                expect(res.messages.length).toEqual(3);
                expect(searchQuery).toHaveBeenCalled();
                done();
            });
        });
    });

    describe('RealTime indexing process', () => {

        it('should index realTime message', () => {
            const message = [{
                chatType: 'CHATROOM',
                ingestionDate: currentDate.toString(),
                isPublic: 'false',
                messageId: 'Jc+4K8RtPxHJfyuDQU9atX///qN3KHYXdA==',
                senderId: '71811853189212',
                sendingApp: 'lc',
                text: 'realtime working',
                threadId: 'Au8O2xKHyX1LtE6zW019GX///rZYegAtdA==',
            }];

            const batchRealTimeIndexing = jest.spyOn(SearchApi, 'batchRealTimeIndexing');
            SearchApi.batchRealTimeIndexing(message);
            expect(batchRealTimeIndexing).toHaveBeenCalled();
        });

        it('should match message length', (done) => {
            const searchQuery = jest.spyOn(SearchApi, 'searchQuery');
            SearchApi.searchQuery('realtime working', ['71811853189212'],
                ['Au8O2xKHyX1LtE6zW019GX///rZYegAtdA=='],
                '', undefined, undefined,
                25, 0, 0).then((res: SearchResponse) => {
                expect(res.messages.length).toEqual(3);
                expect(searchQuery).toHaveBeenCalled();
                done();
            });
        });

        it('should not index realTime message', (done) => {
            const message = [{
                chatType: 'CHATROOM',
                ingestionDate: currentDate.toString(),
                isPublic: 'false',
                messageId: 'Jc+4K8RtPxHJfyuDQU9atX///qN3KHYXdA==',
                senderId: '71811853189212',
                sendingApp: 'lc',
                text: 'isRealTimeIndexing',
                threadId: 'Au8O2xKHyX1LtE6zW019GX///rZYegAtdA==',
            }];

            const batchRealTimeIndexing = jest.spyOn(SearchApi, 'batchRealTimeIndexing');
            const realTimeIndexing = jest.spyOn(SearchApi, 'realTimeIndexing');
            SearchApi.isRealTimeIndexing = true;
            expect(SearchApi.checkIsRealTimeIndexing()).toBe(true);
            SearchApi.batchRealTimeIndexing(message);
            expect(batchRealTimeIndexing).toHaveBeenCalled();
            expect(realTimeIndexing).not.toBeCalled();
            setTimeout(() => {

                SearchApi.searchQuery('isRealTimeIndexing', [], [], '',
                    undefined, undefined,
                    25, 0, 0).then((res: SearchResponse) => {
                    expect(res.messages.length).toEqual(0);
                    done();
                });
            }, 6000);
        });

        it('should not call the real-time index', () => {
            const message = [{
                chatType: 'CHATROOM',
                ingestionDate: currentDate.toString(),
                isPublic: 'false',
                messageId: 'Jc+4K8RtPxHJfyuDQU9atX///qN3KHYXdA==',
                senderId: '71811853189212',
                sendingApp: 'lc',
                text: 'isRealTimeIndexing',
                threadId: 'Au8O2xKHyX1LtE6zW019GX///rZYegAtdA==',
            }];

            const batchRealTimeIndexing = jest.spyOn(SearchApi, 'batchRealTimeIndexing');
            const realTimeIndexing = jest.spyOn(SearchApi, 'realTimeIndexing');
            SearchApi.isRealTimeIndexing = true;
            SearchApi.batchRealTimeIndexing(message);
            expect(batchRealTimeIndexing).toHaveBeenCalled();
            expect(realTimeIndexing).not.toBeCalled();
        });

        it('should not realTime index invalid object', (done) => {
            const realTimeIndexing = jest.spyOn(SearchApi, 'realTimeIndexing');
            function handleResponse(status: boolean, data: string) {
                expect(realTimeIndexing).toHaveBeenCalled();
                expect(status).toBe(false);
                expect(data).toEqual('RealTime Indexing: parse error ');
                done();
            }
            SearchApi.realTimeIndexing('message', handleResponse);
        });

        it('should fail no data is passed for real-time indexing', (done) => {
            const realTimeIndexing = jest.spyOn(SearchApi, 'realTimeIndexing');
            function handleResponse(status: boolean, data: string) {
                expect(realTimeIndexing).toHaveBeenCalled();
                expect(status).toBe(false);
                expect(data).toEqual('RealTime Indexing: parse error ');
                done();
            }
            SearchApi.realTimeIndexing(undefined, handleResponse);
        });

        it('should fail library not initialized', (done) => {
            const message = [{
                chatType: 'CHATROOM',
                ingestionDate: currentDate.toString(),
                isPublic: 'false',
                messageId: 'Jc+4K8RtPxHJfyuDQU9atX///qN3KHYXdA==',
                senderId: '71811853189212',
                sendingApp: 'lc',
                text: 'isRealTimeIndexing',
                threadId: 'Au8O2xKHyX1LtE6zW019GX///rZYegAtdA==',
            }];
            const realTimeIndexing = jest.spyOn(SearchApi, 'realTimeIndexing');
            SearchApi.isInitialized = false;
            function handleResponse(status: boolean, data: string) {
                SearchApi.isInitialized = true;
                expect(status).toBe(false);
                expect(data).toEqual('Library not initialized');
                expect(realTimeIndexing).toHaveBeenCalled();
                expect(realTimeIndexing).toHaveBeenCalledTimes(3);
                done();
            }
            SearchApi.realTimeIndexing(JSON.stringify(message), handleResponse);
        });

        it('should return realTime bool', () => {
            const checkIsRealTimeIndexing = jest.spyOn(SearchApi, 'checkIsRealTimeIndexing');
            SearchApi.isRealTimeIndexing = true;
            expect(SearchApi.checkIsRealTimeIndexing()).toBe(true);
            SearchApi.isRealTimeIndexing = false;
            expect(SearchApi.checkIsRealTimeIndexing()).toBe(false);
            expect(checkIsRealTimeIndexing).toHaveBeenCalled();
            expect(checkIsRealTimeIndexing).toHaveBeenCalledTimes(2);
        });

        it('should delete realtime index', () => {
            const deleteRealTimeFolder = jest.spyOn(SearchApi, 'deleteRealTimeFolder');
            SearchApi.deleteRealTimeFolder();
            expect(deleteRealTimeFolder).toHaveBeenCalled();
        });
    });

    describe('Test for encryption of the index', () => {

        it('should encrypt user index', (done) => {
            const encryptIndex = jest.spyOn(SearchApi, 'encryptIndex');
            SearchApi.encryptIndex(key).then(() => {
                expect(encryptIndex).toHaveBeenCalled();
                done();
            });
        });

        it('should exist encrypted file', (done) => {
            expect(fs.existsSync(path.join(userConfigDir, 'search_index_12345678910112.tar.lz4'))).toBe(false);
            done();
        });
    });

    describe('Test for latest timestamp', () => {

        it('should get the latest timestamp', (done) => {
            const getLatestMessageTimestamp = jest.spyOn(SearchApi, 'getLatestMessageTimestamp');
            function handleResponse(status: boolean, data: string) {
                expect(status).toBe(true);
                expect(data).toEqual(currentDate.toString());
                expect(getLatestMessageTimestamp).toHaveBeenCalled();
                done();
            }
            SearchApi.getLatestMessageTimestamp(handleResponse);
        });

        it('should not get the latest timestamp', (done) => {
            const getLatestMessageTimestamp = jest.spyOn(SearchApi, 'getLatestMessageTimestamp');
            SearchApi.isInitialized = false;
            function handleResponse(status: boolean, data: string) {
                expect(status).toBe(false);
                expect(data).toEqual('Not initialized');
                expect(getLatestMessageTimestamp).toHaveBeenCalled();
                SearchApi.isInitialized = true;
                done();
            }
            SearchApi.getLatestMessageTimestamp(handleResponse);
        });

        it('should be equal to 0000000000000', (done) => {
            const getLatestMessageTimestamp = jest.spyOn(SearchApi, 'getLatestMessageTimestamp');
            libSymphonySearch.symSEClearMainRAMIndex();
            libSymphonySearch.symSEClearRealtimeRAMIndex();
            function handleResponse(status: boolean, data: string) {
                expect(data).toEqual('0000000000000');
                expect(status).toBe(true);
                expect(getLatestMessageTimestamp).toHaveBeenCalled();
                expect(getLatestMessageTimestamp).toHaveBeenCalledTimes(3);
                SearchApi.isInitialized = true;
                done();
            }
            SearchApi.getLatestMessageTimestamp(handleResponse);
        });
    });

    describe('Test to decrypt the index', () => {

        it('should decrypt the index', (done) => {
            const init = jest.spyOn(SearchApi, 'init');
            SearchApi.init(key);
            expect(init).toHaveBeenCalled();
            done();
        });

        it('should get message from the decrypted index', (done) => {
            setTimeout(() => {
                const searchQuery = jest.spyOn(SearchApi, 'searchQuery');
                const endTime = new Date().getTime();
                const startTime = new Date().getTime() - (4 * 31 * 24 * 60 * 60 * 1000);
                SearchApi.searchQuery('it works', [], [], '',
                    startTime.toString(), endTime.toString(),
                    0, 0.2, 0.1).then((res: SearchResponse) => {
                    expect(res.messages.length).toEqual(3);
                    expect(searchQuery).toHaveBeenCalled();
                    done();
                });
            }, 3000);
        });
    });

    describe('Test for search functions', () => {

        it('should search fail isInitialized is false', (done) => {
            const searchQuery = jest.spyOn(SearchApi, 'searchQuery');
            SearchApi.isInitialized = false;
            SearchApi.searchQuery('it works', [], [], '',
                '', '', 25, 0, 0).then((res: SearchResponse) => {
                expect(res).toEqual({
                    messages: [],
                    more: 0,
                    returned: 0,
                    total: 0,
                });
                expect(searchQuery).toHaveBeenCalled();
                SearchApi.isInitialized = true;
                done();
            });
        });

        it('should filter search limit ', (done) => {
            const searchQuery = jest.spyOn(SearchApi, 'searchQuery');
            SearchApi.searchQuery('works', [], [], '',
                '', '', 2, 0, 0).then((res: SearchResponse) => {
                expect(res.messages.length).toBe(2);
                expect(searchQuery).toHaveBeenCalledTimes(6);
                expect(searchQuery).toHaveBeenCalled();
                done();
            });
        });

        it('should search fails result cleared', (done) => {
            libSymphonySearch.symSEClearMainRAMIndex();
            libSymphonySearch.symSEClearRealtimeRAMIndex();
            const searchQuery = jest.spyOn(SearchApi, 'searchQuery');
            SearchApi.searchQuery('it works', [], [], '',
                '', '', 25, 0, 0).then((res: SearchResponse) => {
                expect(res.messages.length).toBe(0);
                expect(searchQuery).toHaveBeenCalledTimes(7);
                expect(searchQuery).toHaveBeenCalled();
                SearchApi = undefined;
                const Search = require('../index').Search;
                SearchApi = new Search(userId, key);
                done();
            });
        });

        it('should search fails query is undefined', (done) => {
            setTimeout(() => {
                const searchQuery = jest.spyOn(SearchApi, 'searchQuery');
                expect(SearchApi.isInitialized).toBe(true);
                SearchApi.searchQuery(undefined, [], [], '',
                    '', '', 25, 0, 0).then((res: SearchResponse) => {
                    expect(res).toEqual({
                        messages: [],
                        more: 0,
                        returned: 0,
                        total: 0,
                    });
                    expect(searchQuery).toHaveBeenCalled();
                    done();
                });
            }, 3000);
        });

        it('should search for hashtag', (done) => {
            const searchQuery = jest.spyOn(SearchApi, 'searchQuery');
            SearchApi.searchQuery('#123 "testing"', [], [],
                'attachment', '', '', 25,
                0, 0).then((res: SearchResponse) => {
                expect(res.messages.length).toEqual(0);
                expect(searchQuery).toHaveBeenCalled();
                done();
            });
        });

        it('should search for pdf', (done) => {
            const searchQuery = jest.spyOn(SearchApi, 'searchQuery');
            SearchApi.searchQuery('', [], [], 'pdf',
                '', '', 25, 0, 0).then((res: SearchResponse) => {
                expect(res.messages.length).toEqual(0);
                expect(searchQuery).toHaveBeenCalled();
                expect(searchQuery).toHaveBeenCalledTimes(3);
                done();
            });
        });

        it('should index for testing quote', (done) => {
            const messages = [{
                chatType: 'CHATROOM',
                ingestionDate: currentDate.toString(),
                isPublic: 'false',
                messageId: 'Jc+4K8RtPxHJfyuDQU9atX///qN3KHYXdA==',
                senderId: '71811853189212',
                sendingApp: 'lc',
                text: 'quote search',
                threadId: 'Au8O2xKHyX1LtE6zW019GX///rZYegAtdA==',
            }, {
                chatType: 'CHATROOM',
                ingestionDate: currentDate.toString(),
                isPublic: 'false',
                messageId: 'Jc+4K8RtPxHJfyuDQU9atX///qN3KHYXdA==',
                senderId: '71811853189212',
                sendingApp: 'lc',
                text: 'search',
                threadId: 'Au8O2xKHyX1LtE6zW019GX///rZYegAtdA==',
            }];
            const indexBatch = jest.spyOn(SearchApi, 'indexBatch');
            function handleResponse(status: boolean, data: number) {
                expect(indexBatch).toHaveBeenCalled();
                expect(status).toBe(true);
                expect(data).toBe(0);
                done();
            }
            SearchApi.indexBatch(JSON.stringify(messages), handleResponse);
        });

        it('should search without quote', (done) => {
            const searchQuery = jest.spyOn(SearchApi, 'searchQuery');
            SearchApi.searchQuery('search', [], [], undefined,
                '', '', 25, 0, 0).then((res: SearchResponse) => {
                expect(res.messages.length).toEqual(2);
                expect(searchQuery).toHaveBeenCalled();
                expect(searchQuery).toHaveBeenCalledTimes(4);
                done();
            });
        });

        it('should quote search', (done) => {
            const searchQuery = jest.spyOn(SearchApi, 'searchQuery');
            SearchApi.searchQuery('\"quote search\"', [], [], undefined,
                '', '', 25, 0, 0).then((res: SearchResponse) => {
                expect(res.messages.length).toEqual(1);
                expect(searchQuery).toHaveBeenCalled();
                expect(searchQuery).toHaveBeenCalledTimes(5);
                done();
            });
        });
    });

    describe('Tests for checking disk space', () => {

        it('should return free space', (done) => {
            const checkFreeSpace = jest.spyOn(SearchUtilsAPI, 'checkFreeSpace');
            SearchUtilsAPI.checkFreeSpace().then(() => {
                expect(checkFreeSpace).toHaveBeenCalled();
                done();
            });
        });

        it('should return error', (done) => {
            if (isMac) {
                searchConfig.FOLDERS_CONSTANTS.USER_DATA_PATH = undefined;
                SearchUtilsAPI.checkFreeSpace().then((res: boolean) => {
                    expect(res).toEqual(false);
                    done();
                });
            } else {
                searchConfig.FOLDERS_CONSTANTS.USER_DATA_PATH = undefined;
                SearchUtilsAPI.checkFreeSpace().then((res: boolean) => {
                    expect(res).toEqual(false);
                    done();
                });
            }
        });

        it('should return error invalid path', (done) => {
            const checkFreeSpace = jest.spyOn(SearchUtilsAPI, 'checkFreeSpace');
            searchConfig.FOLDERS_CONSTANTS.USER_DATA_PATH = './tp';
            if (isWindowsOS) {
                searchConfig.FOLDERS_CONSTANTS.USER_DATA_PATH = 'A://test';
                searchConfig.LIBRARY_CONSTANTS.FREE_DISK_SPACE = path.join(__dirname, '..',
                    'node_modules/electron-utils/FreeDiskSpace/bin/Release/FreeDiskSpace.exe');
            }
            SearchUtilsAPI.checkFreeSpace().then((err: never) => {
                searchConfig.LIBRARY_CONSTANTS.FREE_DISK_SPACE = path.join(__dirname, '..',
                    'library/FreeDiskSpace.exe');
                expect(checkFreeSpace).toHaveBeenCalled();
                expect(err).toBe(false);
                done();
            });
        });
    });

    describe('Test for search users config', () => {

        it('should return null for new user config', (done) => {
            if (fs.existsSync(searchConfig.FOLDERS_CONSTANTS.USER_CONFIG_FILE)) {
                fs.unlinkSync(searchConfig.FOLDERS_CONSTANTS.USER_CONFIG_FILE);
            }
            SearchUtilsAPI.getSearchUserConfig(1234567891011).then((res: null) => {
                expect(res).toBe(null);
                done();
            });
        });

        it('should exist users config file', (done) => {
            setTimeout(() => {
                expect(fs.existsSync(searchConfig.FOLDERS_CONSTANTS.USER_CONFIG_FILE)).toEqual(true);
                done();
            }, 2000);
        });

        it('should exist users config file', (done) => {
            setTimeout(() => {
                SearchUtilsAPI.getSearchUserConfig(1234567891011).then((res: UserConfig) => {
                    expect(res).toEqual({});
                    done();
                });
            }, 3000);
        });

        it('should update user config file', (done) => {
            const data = {
                language: 'en',
                rotationId: 0,
                version: 1,
            };
            SearchUtilsAPI.updateUserConfig(1234567891011, data).then((res: UserConfig) => {
                expect(res.indexVersion).toEqual('v1');
                done();
            });
        });

        it('should modify user config file', (done) => {
            const data = {
                language: 'en',
                rotationId: 1,
                version: 1,
            };
            SearchUtilsAPI.updateUserConfig(1234567891011, data).then((res: UserConfig) => {
                expect(res.rotationId).toEqual(1);
                expect(res.indexVersion).toEqual('v1');
                done();
            });
        });

        it('should create user if not exist', (done) => {
            SearchUtilsAPI.getSearchUserConfig(2234567891011).catch((err: null) => {
                expect(err).toEqual(null);
                done();
            });
        });

    });
});
