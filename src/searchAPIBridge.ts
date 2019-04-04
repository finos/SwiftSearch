import { apiBridgeCmds,
    PostDataFromSFE,
    PostErrorCallback,
    PostSuccessCallback,
    SSAPIBridgeInterface,
} from './interface/interface';
import { log } from './log/log';
import { logLevels } from './log/logLevels';
import Search from './search';
import SearchUtils from './utils/searchUtils';

let SwiftSearchAPI: any;

const makePayload = (requestId: number, data: PostSuccessCallback | PostErrorCallback) => {
    return {
        requestId,
        ...data,
    };
};

const WHITELIST = [
    apiBridgeCmds.initialSearch,
    apiBridgeCmds.checkDiskSpace,
    apiBridgeCmds.checkDiskSpaceCallBack,
];

export default class SSAPIBridge implements SSAPIBridgeInterface {
    private static isLibInit(): boolean {
        return true; // SwiftSearchAPI && SwiftSearchAPI.isLibInit();
    }

    private static initSearch(data: any): void {
        const { userId, key } = data;
        SwiftSearchAPI = new Search(userId, key);
    }

    public indexBatchCallback = ((requestId: number, status: boolean, data: string) => {
        this.eventCallback(
            apiBridgeCmds.swiftSearch,
            makePayload(requestId, { method: apiBridgeCmds.indexBatchCallback, response: { status, data }}));
    });

    public getLatestTimestampCallback = ((requestId: number, status: boolean, timestamp: string) => {
        this.eventCallback(
            apiBridgeCmds.swiftSearch,
            makePayload(requestId, { method: apiBridgeCmds.getLatestTimestampCallback, response: { status, timestamp }}));
    });

    public searchCallback = ((requestId: number, data: any): void => {
        this.eventCallback(
            apiBridgeCmds.swiftSearch,
            makePayload(requestId, { method: apiBridgeCmds.searchCallback, response:  data }));
    });

    private eventCallback: any;
    private SearchUtils: SearchUtils;

    constructor() {
        log.send(logLevels.INFO, 'Swift-Search Api Bridge Created');
        this.SearchUtils = new SearchUtils();
    }

    public setBroadcastMessage(eventCallback: () => void): void {
        this.eventCallback = eventCallback;
    }

    public handleMessageEvents(data: any): void {
        const { method, message } = data;

        if (!SSAPIBridge.isLibInit() && !WHITELIST[method]) {
            return;
        }

        switch (method) {
            case apiBridgeCmds.initialSearch:
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
            case apiBridgeCmds.realTimeIndex:
                this.realTimeIndex(data);
                break;
            case apiBridgeCmds.deleteRealTimeIndex:
                this.deleteRealTimeFolder();
                break;
            default:
                break;
        }
    }

    public checkDiskSpace(data: PostDataFromSFE) {
        const { requestId } = data;
        this.SearchUtils.checkFreeSpace()
            .then((res: boolean) => {
                this.eventCallback(apiBridgeCmds.swiftSearch,
                    makePayload(requestId, { method: apiBridgeCmds.checkDiskSpaceCallBack, response: res}));
            })
            .catch((err) => {
                this.eventCallback(apiBridgeCmds.swiftSearch,
                    makePayload(requestId, { method: apiBridgeCmds.checkDiskSpaceCallBack, error: err}));
            });
    }

    public getSearchUserConfig(data: PostDataFromSFE) {
        const { requestId, message } = data;
        this.SearchUtils.getSearchUserConfig(message.userId)
            .then((res: any) => {
                this.eventCallback(apiBridgeCmds.swiftSearch,
                    makePayload(requestId, { method: apiBridgeCmds.getSearchUserConfigCallback, response: res}));
            })
            .catch((err) => {
                this.eventCallback(apiBridgeCmds.swiftSearch,
                    makePayload(requestId, { method: apiBridgeCmds.getSearchUserConfigCallback, error: err}));
            });
    }

    public updateUserConfig(data: PostDataFromSFE) {
        const { requestId, message } = data;
        this.SearchUtils.updateUserConfig(message.userId, message.userData)
            .then((res: any) => {
                this.eventCallback(apiBridgeCmds.swiftSearch,
                    makePayload(requestId, { method: apiBridgeCmds.updateUserConfigCallback, response: res}));
            })
            .catch((err) => {
                this.eventCallback(apiBridgeCmds.swiftSearch,
                    makePayload(requestId, { method: apiBridgeCmds.updateUserConfigCallback, error: err}));
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
                this.eventCallback(apiBridgeCmds.swiftSearch,
                    makePayload(requestId, { method: apiBridgeCmds.encryptIndexCallback, response: true}));
            })
            .catch((e: any) => {
                this.eventCallback(apiBridgeCmds.swiftSearch,
                    makePayload(requestId, { method: apiBridgeCmds.encryptIndexCallback, error: e}));
            });
    }

    public searchQuery(data: PostDataFromSFE): void {
        const { requestId, message } = data;
        const { q,
            senderId,
            threadId,
            has,
            startDate,
            endDate,
            limit,
            startingrow,
            sortBy,
        } = message;

        SwiftSearchAPI.searchQuery(q,
            senderId,
            threadId,
            has,
            startDate,
            endDate,
            limit,
            startingrow,
            sortBy,
        ).then((res: any) => {
            this.searchCallback(requestId, res);
        });
    }
}