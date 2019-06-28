import {
    apiBridgeCmds,
    PostDataFromSFE,
    PostErrorCallback,
    PostSuccessCallback,
    SearchInitialPayload,
    SSAPIBridgeInterface,
} from './interface/interface';
import { logger } from './log/logger';
import Search from './search';
import SearchUtils from './utils/searchUtils';

let SwiftSearchAPI: any;

const makePayload = (data: PostSuccessCallback | PostErrorCallback) => {
    return { ...data };
};

const WHITELIST = [
    apiBridgeCmds.initialSearch,
    apiBridgeCmds.checkDiskSpace,
    apiBridgeCmds.getSearchUserConfig,
    apiBridgeCmds.updateUserConfig,
    apiBridgeCmds.search,
    apiBridgeCmds.getValidatorResponse,
].reduce((acc, curr) => {
    acc[ curr ] = true;
    return acc;
}, {});

export default class SSAPIBridge implements SSAPIBridgeInterface {
    private static isLibInit(): boolean {
        return SwiftSearchAPI && SwiftSearchAPI.isLibInit();
    }

    private static initSearch(data: any): void {
        logger.info(`-------------------- Swift-Search Api Bridge Created --------------------`);
        const { userId, key, payload } = data;
        SwiftSearchAPI = new Search(userId, key, payload as SearchInitialPayload);
    }

    public indexBatchCallback = ((requestId: number, status: boolean, data: string) => {
        this.eventCallback(
            apiBridgeCmds.swiftSearch,
            makePayload({ requestId, method: apiBridgeCmds.indexBatchCallback, response: { status, data }}),
        );
    });

    public getLatestTimestampCallback = ((requestId: number, status: boolean, timestamp: string) => {
        this.eventCallback(
            apiBridgeCmds.swiftSearch,
            makePayload({ requestId, method: apiBridgeCmds.getLatestTimestampCallback, response: { status, timestamp }}),
        );
    });

    public searchCallback = ((requestId: number, data: any): void => {
        this.eventCallback(
            apiBridgeCmds.swiftSearch,
            makePayload({ requestId, method: apiBridgeCmds.searchCallback, response:  data }),
        );
    });

    public getValidatorResponseCallback = ((requestId: number, data: any): void => {
        this.eventCallback(
            apiBridgeCmds.swiftSearch,
            makePayload({ requestId, method: apiBridgeCmds.getValidatorResponseCallback, response: data }),
        );
    });

    private SearchUtils: SearchUtils;
    private eventCallback: any;

    constructor() {
        this.SearchUtils = new SearchUtils();
        this.handleMessageEvents = this.handleMessageEvents.bind(this);
    }

    public setBroadcastMessage(eventCallback: () => void): void {
        this.eventCallback = eventCallback;
    }

    public handleMessageEvents(data: any): void {
        const { method, message } = data;

        if (method === apiBridgeCmds.setIsSwiftSearchInitialized) {
            return;
        }

        if (!SSAPIBridge.isLibInit() && !WHITELIST[method]) {
            logger.info(`-------------------- searchAPIBridge: Call was made before Initializing --------------------`);
            return;
        }

        switch (method) {
            case apiBridgeCmds.initialSearch:
                const { payload } = message;
                payload.setLibInit = (state: boolean) => {
                    this.publishInitializeState(state);
                };
                SSAPIBridge.initSearch(message);
                break;
            case apiBridgeCmds.getLatestTimestamp:
                this.getLatestTimestamp(data);
                break;
            case apiBridgeCmds.indexBatch:
                this.indexBatch(data);
                break;
            case apiBridgeCmds.search:
                this.searchQuery(data);
                break;
            case apiBridgeCmds.checkDiskSpace:
                this.checkDiskSpace(data);
                break;
            case apiBridgeCmds.getSearchUserConfig:
                this.getSearchUserConfig(data);
                break;
            case apiBridgeCmds.encryptIndex:
                this.encryptIndex(data);
                break;
            case apiBridgeCmds.updateUserConfig:
                this.updateUserConfig(data);
                break;
            case apiBridgeCmds.realTimeIndex:
                this.realTimeIndex(data);
                break;
            case apiBridgeCmds.deleteRealTimeIndex:
                this.deleteRealTimeFolder();
                break;
            case apiBridgeCmds.getValidatorResponse:
                this.getValidatorResponseCallback(data.requestId, SwiftSearchAPI && SwiftSearchAPI.validatorResponse);
                break;
            default:
                break;
        }
    }

    /**
     * This function is required to set isLibInit
     * Which sets the current swift-search state on the client
     * only if its in context-isolated world
     * @param arg
     */
    public publishInitializeState(arg: boolean) {
        if (this.eventCallback) {
            this.eventCallback(apiBridgeCmds.swiftSearch, {
                data: arg,
                method: apiBridgeCmds.setIsSwiftSearchInitialized,
            });
        }
    }

    public checkDiskSpace(data: PostDataFromSFE) {
        const { requestId, message } = data;
        this.SearchUtils.checkFreeSpace(message.minimumDiskSpace)
            .then((res: boolean) => {
                this.eventCallback(
                    apiBridgeCmds.swiftSearch,
                    makePayload({ requestId, method: apiBridgeCmds.checkDiskSpaceCallBack, response: res}),
                );
            })
            .catch((err) => {
                this.eventCallback(
                    apiBridgeCmds.swiftSearch,
                    makePayload({ requestId, method: apiBridgeCmds.checkDiskSpaceCallBack, error: err}),
                );
            });
    }

    public getSearchUserConfig(data: PostDataFromSFE) {
        const { requestId, message } = data;
        this.SearchUtils.getSearchUserConfig(message.userId)
            .then((res: any) => {
                this.eventCallback(
                    apiBridgeCmds.swiftSearch,
                    makePayload({ requestId, method: apiBridgeCmds.getSearchUserConfigCallback, response: res}),
                );
            })
            .catch((err) => {
                this.eventCallback(
                    apiBridgeCmds.swiftSearch,
                    makePayload({ requestId, method: apiBridgeCmds.getSearchUserConfigCallback, error: err}),
                );
            });
    }

    public updateUserConfig(data: PostDataFromSFE) {
        const { requestId, message } = data;
        this.SearchUtils.updateUserConfig(message.userId, message.userData)
            .then((res: any) => {
                this.eventCallback(
                    apiBridgeCmds.swiftSearch,
                    makePayload({ requestId, method: apiBridgeCmds.updateUserConfigCallback, response: res}),
                );
            })
            .catch((err) => {
                this.eventCallback(
                    apiBridgeCmds.swiftSearch,
                    makePayload({ requestId, method: apiBridgeCmds.updateUserConfigCallback, error: err}),
                );
            });
    }

    public indexBatch(data: PostDataFromSFE): void {
        const { message, requestId } = data;
        SwiftSearchAPI.indexBatch(message, this.indexBatchCallback.bind(this, requestId));
    }

    public realTimeIndex(data: PostDataFromSFE): void {
        const { message } = data;
        SwiftSearchAPI.batchRealTimeIndexing(message);
    }

    public getLatestTimestamp(data: PostDataFromSFE): void {
        const { requestId } = data;
        SwiftSearchAPI.getLatestMessageTimestamp(this.getLatestTimestampCallback.bind(this, requestId));
    }

    public deleteRealTimeFolder(): void {
        SwiftSearchAPI.deleteRealTimeFolder();
    }

    public encryptIndex(data: PostDataFromSFE): void {
        const { requestId, message } = data;
        SwiftSearchAPI.encryptIndex(message)
            .then(() => {
                this.eventCallback(
                    apiBridgeCmds.swiftSearch,
                    makePayload({ requestId, method: apiBridgeCmds.encryptIndexCallback, response: true}),
                );
            })
            .catch((e: any) => {
                this.eventCallback(
                    apiBridgeCmds.swiftSearch,
                    makePayload({ requestId, method: apiBridgeCmds.encryptIndexCallback, error: e}),
                );
            });
    }

    public searchQuery(data: PostDataFromSFE): void {
        const { requestId, message } = data;
        SwiftSearchAPI.searchQueryV2(message).then((res: any) => {
            this.searchCallback(requestId, res);
        });
    }
}
