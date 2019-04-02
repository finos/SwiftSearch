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

    public indexBatchCallback = ((data: {status: boolean, message: string}) => {
        this.eventCallback(apiBridgeCmds.swiftSearch, { method: apiBridgeCmds.getSearchUserConfigCallback, data});
    });

    public getLatestTimestampCallback = ((status: boolean, message: string) => {
        this.eventCallback(
            apiBridgeCmds.swiftSearch,
            {
                method: apiBridgeCmds.getSearchUserConfigCallback,
                response: { status, message },
            });
    });

    public searchCallback = ((data: any): void => {
        this.eventCallback(apiBridgeCmds.searchCallback, data);
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
                this.getLatestTimestamp(message);
                break;
            case apiBridgeCmds.indexBatch:
                this.indexBatch(message);
                break;
            case apiBridgeCmds.search:
                this.search(message);
                break;
            case apiBridgeCmds.checkDiskSpace:
                this.checkDiskSpace(data);
                break;
            case apiBridgeCmds.getSearchUserConfig:
                this.getSearchUserConfig(data);
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
        const { message } = data;
        SwiftSearchAPI.indexBatch(message, this.indexBatchCallback);
    }

    public getLatestTimestamp(data: PostDataFromSFE): void {
        const { message } = data;
        SwiftSearchAPI.getLatestMessageTimestamp(this.getLatestTimestampCallback);
    }

    public search(data: any): void {
        const { query,
            senderIds,
            threadIds,
            fileType,
            startDat,
            endDat,
            limit,
            offset,
            sortOrder } = data;

        SwiftSearchAPI.searchQuery(query,
            senderIds,
            threadIds,
            fileType,
            startDat,
            endDat,
            limit,
            offset,
            sortOrder).then(() => {
                this.searchCallback({});
        });
    }
}