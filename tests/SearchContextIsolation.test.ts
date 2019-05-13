import * as fs from 'fs';
import * as path from 'path';

import { apiBridgeCmds } from '../src/interface/interface';
import { isWindowsOS } from '../src/utils/misc';

let executionPath: string = '';
let userConfigDir: string = '';
let searchBridge: any;

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

describe('Tests for Search Context-Isolation PostMessage', () => {
    jest.setTimeout(20000);
    const spyConsoleError = jest.spyOn( console, 'error' );
    const spyConsoleInfo = jest.spyOn( console, 'info' );

    const UserID: number = 89876543212345;
    const Key: string = 'jjjehdnctkeerthilskcjdhsnahsadndfnusdfsdfsd=';

    const pathToLZ4 = path.join(mockedGetPath('userData'), `search_index_${UserID}.tar.lz4`);
    const configFile = path.join(userConfigDir, 'search_users_config.json');

    const UserData: any = {
        indexVersion: 'v3',
        language: 'en',
        rotationId: 0,
        version: 1,
    };

    beforeAll(() => {
        executionPath = path.join(__dirname, 'library');
        if (isWindowsOS) {
            executionPath = path.join(__dirname, '..', 'library');
        }
        userConfigDir = path.join(__dirname, '..');
        if (fs.existsSync(configFile)) fs.unlinkSync(configFile);
        if (fs.existsSync(pathToLZ4)) fs.unlinkSync(pathToLZ4);

        const SearchAPIBridge = require('../src/searchAPIBridge').default;
        searchBridge = new SearchAPIBridge();
    });

    afterAll(() => {
        if (fs.existsSync(configFile)) fs.unlinkSync(configFile);
        if (fs.existsSync(pathToLZ4)) fs.unlinkSync(pathToLZ4);
    });

    it('should should not initialize search if key is missing', (done) => {
        const message = generatePostData(apiBridgeCmds.initialSearch,
            {
                message: {
                    key: null,
                    userId: UserID,
                },
            },
        );
        searchBridge.setBroadcastMessage(getCallback.bind(null));
        searchBridge.handleMessageEvents(message);

        const message1 = generatePostData(apiBridgeCmds.initialSearch,
            {
                message: {
                    key: '123',
                    userId: UserID,
                },
            },
        );
        searchBridge.setBroadcastMessage(getCallback.bind(null));
        searchBridge.handleMessageEvents(message1);
        expect( spyConsoleInfo ).toHaveBeenCalledWith(expect.stringMatching(/Swift-Search Api Bridge Created/));
        setTimeout(() => {
            done();
        }, 1000);
    });

    it('should return empty results for search before initialization', (done) => {
        const message1 = generatePostData(apiBridgeCmds.search,
            {
                message: {
                    q: 'test',
                },
                requestId: 1,
            },
        );
        searchBridge.setBroadcastMessage(getCallback.bind(null, generateResponseData(apiBridgeCmds.searchCallback, {
            requestId: 1,
            response: {messages: [], more: 0, returned: 0, total: 0},
        }), done));
        searchBridge.handleMessageEvents(message1);
        expect( spyConsoleError ).toHaveBeenCalledWith(expect.stringMatching(/Library not initialized/));
    });

    it('should not batch before search is initialized', (done) => {
        const index = jest.spyOn(searchBridge, 'indexBatch');
        const message1 = generatePostData(apiBridgeCmds.indexBatch,
            {
                message: getMessage('testing'),
                requestId: 1,
            },
        );

        searchBridge.handleMessageEvents(message1);
        expect(index).not.toHaveBeenCalled();
        done();
    });

    it('should not do real time indexing before search is initialized', (done) => {
        const realTimeIndex = jest.spyOn(searchBridge, 'realTimeIndex');
        const message1 = generatePostData(apiBridgeCmds.realTimeIndex,
            {
                message: JSON.parse(getMessage('John'))[0],
                requestId: 1,
            },
        );

        searchBridge.handleMessageEvents(message1);
        expect(realTimeIndex).not.toHaveBeenCalled();
        done();
    });

    it('should not delete real time index before search is initialized', (done) => {
        const deleteRealTime = jest.spyOn(searchBridge, 'deleteRealTimeFolder');
        const message1 = generatePostData(apiBridgeCmds.deleteRealTimeIndex, null);

        searchBridge.handleMessageEvents(message1);
        expect(deleteRealTime).not.toHaveBeenCalled();
        done();
    });

    it('should not encrypt index before search is initialized', (done) => {
        const encryptIndex = jest.spyOn(searchBridge, 'encryptIndex');
        const message1 = generatePostData(apiBridgeCmds.encryptIndex, null);

        searchBridge.handleMessageEvents(message1);
        expect(encryptIndex).not.toHaveBeenCalled();
        done();
    });

    it('should initialize search', (done) => {
        const message = generatePostData(apiBridgeCmds.initialSearch,
            {
                message: {
                    key: Key,
                    userId: UserID,
                },
            },
        );
        searchBridge.setBroadcastMessage(getCallback.bind(null));
        searchBridge.handleMessageEvents(message);
        expect( spyConsoleInfo ).toHaveBeenCalledWith(expect.stringMatching(/Swift-Search Api Bridge Created/));
        expect( spyConsoleError ).toHaveBeenCalledWith(expect.stringMatching(/Error reading user config/));
        setTimeout(() => done(), 1000);
    });

    it('should get timestamp as 0 after initialized', (done) => {
        const message1 = generatePostData(apiBridgeCmds.getLatestTimestamp,
            {
                message: null,
                requestId: 1,
            },
        );
        searchBridge.setBroadcastMessage(getCallback.bind(null, generateResponseData(apiBridgeCmds.getLatestTimestampCallback, {
            requestId: 1,
            response: { status: true, timestamp: '0000000000000' },
        }), done));
        searchBridge.handleMessageEvents(message1);
    });

    it('should return empty results for search after initialization is completed', (done) => {
        const message1 = generatePostData(apiBridgeCmds.search,
            {
                message: {
                    q: 'test',
                },
                requestId: 1,
            },
        );
        searchBridge.setBroadcastMessage(getCallback.bind(null, generateResponseData(apiBridgeCmds.searchCallback, {
            requestId: 1,
            response: {messages: [], more: 0, returned: 0, total: 0},
        }), done));
        searchBridge.handleMessageEvents(message1);
    });

    it('should batch index messages', (done) => {
        const message1 = generatePostData(apiBridgeCmds.indexBatch,
            {
                message: getMessage('testing'),
                requestId: 1,
            },
        );

        searchBridge.setBroadcastMessage(getCallback.bind(null, generateResponseData(apiBridgeCmds.indexBatchCallback, {
            requestId: 1,
            response: { status: true, data: 0 },
        }), done));
        searchBridge.handleMessageEvents(message1);
    });

    it('should not batch if message is not passed', (done) => {
        const message1 = generatePostData(apiBridgeCmds.indexBatch,
            {
                message: null,
                requestId: 1,
            },
        );

        searchBridge.setBroadcastMessage(getCallback.bind(null, generateResponseData(apiBridgeCmds.indexBatchCallback, {
            requestId: 1,
            response: {data: 'Batch Indexing: Messages are required', status: false},
        }), done));
        searchBridge.handleMessageEvents(message1);
        expect( spyConsoleError ).toHaveBeenCalledWith(expect.stringMatching(/Batch Indexing: Messages not provided/));
    });

    it('should not batch if message is invalid', (done) => {
        const message1 = generatePostData(apiBridgeCmds.indexBatch,
            {
                message: { test: 123 },
                requestId: 1,
            },
        );

        searchBridge.setBroadcastMessage(getCallback.bind(null, generateResponseData(apiBridgeCmds.indexBatchCallback, {
            requestId: 1,
            response: {data: 'Batch Indexing parse error', status: false},
        }), done));
        searchBridge.handleMessageEvents(message1);
        expect( spyConsoleError ).toHaveBeenCalledWith(expect.stringMatching(/Batch Indexing: parse error ->/));
    });

    it('should not batch if message is not string', (done) => {
        const message1 = generatePostData(apiBridgeCmds.indexBatch,
            {
                message: JSON.stringify({ test: 123 }),
                requestId: 1,
            },
        );

        searchBridge.setBroadcastMessage(getCallback.bind(null, generateResponseData(apiBridgeCmds.indexBatchCallback, {
            requestId: 1,
            response: {data: 'Batch Indexing: Messages must be an array', status: false},
        }), done));
        searchBridge.handleMessageEvents(message1);
        expect( spyConsoleError ).toHaveBeenCalledWith(expect.stringMatching(/Batch Indexing: Messages must be an array/));
    });

    it('should return message after batch indexing', (done) => {
        const message1 = generatePostData(apiBridgeCmds.search,
            {
                message: {
                    q: 'testing',
                },
                requestId: 1,
            },
        );
        searchBridge.setBroadcastMessage(getCallback.bind(null, generateResponseData(apiBridgeCmds.searchCallback, {
            requestId: 1,
            response: {messages: JSON.parse(getMessage('testing')), more: 0, returned: 1, total: 1},
        }), done));
        searchBridge.handleMessageEvents(message1);
    });

    it('should do real time indexing of the message', (done) => {
        const message1 = generatePostData(apiBridgeCmds.realTimeIndex,
            {
                message: JSON.parse(getMessage('John'))[0],
            },
        );

        searchBridge.setBroadcastMessage(getCallback.bind(null, null), done);
        searchBridge.handleMessageEvents(message1);
        // Setting time out as we don't have callback for realtime indexing.
        setTimeout(() => {
            done();
        }, 1000);
    });

    it('should return message after real time', (done) => {
        const message1 = generatePostData(apiBridgeCmds.search,
            {
                message: {
                    q: 'John',
                },
                requestId: 1,
            },
        );
        searchBridge.setBroadcastMessage(getCallback.bind(null, generateResponseData(apiBridgeCmds.searchCallback, {
            requestId: 1,
            response: {messages: JSON.parse(getMessage('John')), more: 0, returned: 1, total: 1},
        }), done));
        searchBridge.handleMessageEvents(message1);
    });

    it('should clear real time index', (done) => {
        const message1 = generatePostData(apiBridgeCmds.deleteRealTimeIndex, null);
        searchBridge.handleMessageEvents(message1);

        const message2 = generatePostData(apiBridgeCmds.search,
            {
                message: {
                    q: 'John',
                },
                requestId: 1,
            },
        );
        searchBridge.setBroadcastMessage(getCallback.bind(null, generateResponseData(apiBridgeCmds.searchCallback, {
            requestId: 1,
            response: {messages: [], more: 0, returned: 0, total: 0},
        }), done));
        searchBridge.handleMessageEvents(message2);
    });

    it('should encrypt index to a file', (done) => {
        const message1 = generatePostData(apiBridgeCmds.encryptIndex,
            {
                message: Key,
                requestId: 1,
            },
        );
        const checkFile = () => {
            setTimeout(() => {
                expect(fs.existsSync(pathToLZ4)).toBe(true);
                expect( spyConsoleInfo ).toHaveBeenCalledWith(expect.stringMatching(/compression success stdout: /));
                done();
            }, 2000);
        };
        searchBridge.setBroadcastMessage(getCallback.bind(null, generateResponseData(apiBridgeCmds.encryptIndexCallback, {
            requestId: 1,
            response: true,
        }), checkFile));
        searchBridge.handleMessageEvents(message1);
    });

    it('should return user config data and should be empty', (done) => {
        const message1 = generatePostData(apiBridgeCmds.getSearchUserConfig,
            {
                message: {
                    userId: UserID,
                },
                requestId: 1,
            },
        );
        searchBridge.setBroadcastMessage(getCallback.bind(null, generateResponseData(apiBridgeCmds.getSearchUserConfigCallback, {
            requestId: 1,
            response: {},
        }), done));
        searchBridge.handleMessageEvents(message1);
    });

    it('should write user config data', (done) => {
        const message1 = generatePostData(apiBridgeCmds.updateUserConfig,
            {
                message: {
                    userData: UserData,
                    userId: UserID,
                },
                requestId: 1,
            },
        );
        searchBridge.setBroadcastMessage(getCallback.bind(null, generateResponseData(apiBridgeCmds.updateUserConfigCallback, {
            requestId: 1,
            response: UserData,
        }), done));
        searchBridge.handleMessageEvents(message1);
    });

    it('should add new user data and return empty object', (done) => {
        const message2 = generatePostData(apiBridgeCmds.getSearchUserConfig,
            {
                message: {
                    userId: 123,
                },
                requestId: 1,
            },
        );
        const validate = () => {
            const message3 = generatePostData(apiBridgeCmds.getSearchUserConfig,
                {
                    message: {
                        userId: 123,
                    },
                    requestId: 1,
                },
            );
            searchBridge.setBroadcastMessage(getCallback.bind(null, generateResponseData(apiBridgeCmds.getSearchUserConfigCallback, {
                requestId: 1,
                response: {},
            }), done));
            searchBridge.handleMessageEvents(message3);
        };
        searchBridge.setBroadcastMessage(getCallback.bind(null, generateResponseData(apiBridgeCmds.getSearchUserConfigCallback, {
            error: null,
            requestId: 1,
        }), validate));
        searchBridge.handleMessageEvents(message2);
    });

    it('should check space and return status', (done) => {
        const message1 = generatePostData(apiBridgeCmds.checkDiskSpace,
            {
                message: null,
                requestId: 1,
            },
        );
        searchBridge.setBroadcastMessage(getCallback.bind(null, generateResponseData(apiBridgeCmds.checkDiskSpaceCallBack, {
            requestId: 1,
            response: true,
        }), done));
        searchBridge.handleMessageEvents(message1);
    });
});

/**
 * Verify callback data
 * @param response {object} - sent in test
 * @param done {function} - test done function
 * @param method {string} - received method name
 * @param data {object} - received from the original callback
 */
function getCallback(response: any, done: any, method: string, data: any) {
    if (!response) {
        return done();
    }

    const result = data.response;
    const excepted = response.response;

    if (data.method === apiBridgeCmds.searchCallback) {
        expect(result.total).toEqual(excepted.total);
        expect(result.returned).toEqual(excepted.returned);
        expect(result.messages.length).toEqual(excepted.messages.length);
        expect(result.messages.text).toEqual(excepted.messages.text);
    } else {
        expect(method).toBe('swift-search');
        expect(data.method).toEqual(response.method);
        if (data.response) {
            expect(result).toEqual(excepted);
        } else {
            expect(data.error).toEqual(response.error);
        }
    }
    if (done) done();
}

/**
 * Generated a const Post data object
 * @param method {string}
 * @param data {object}
 */
function generatePostData(method: string, data: any) {
    return {
        message: data ? data.message : null,
        method,
        requestId: data ? data.requestId : 1,
    };
}

/**
 * Generate mock response data to verify
 * @param method {string}
 * @param data {object}
 */
function generateResponseData(method: string, data: any) {
    const response: any = {};

    if (data.response) {
        response.response = data.response;
    } else {
        response.error = data.error;
    }

    response.method = method;
    response.requestId = data.requestId;

    return response;
}

function getMessage(text: string, senderId: string = '71811853189821', threadId: string = 'XT1MqvynsFruoPAf+F7mPn///qKxEuBadA==') {
    const data = new Date();
    const time = data.getTime();

    const message = [{
        chatType: 'INSTANT_CHAT',
        ingestionDate: time.toString(),
        isPublic: 'false',
        messageId: 'SYyDPxSxABUpOIGyXNnx8H///p53Gb0obQ==',
        senderAvatar: '../avatars/sym-corp-stage-chat-glb-1/150/71811853189821/BNItmUO7OeaUhh7MxIzGqgHVvOh9Iame0WHBHhAcA_w.png',
        senderId,
        senderName: 'John',
        senderType: 'lc',
        sendingApp: 'lc',
        text,
        threadId,
    }];

    return JSON.stringify(message);
}
