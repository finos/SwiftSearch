import { apiBridgeCmds, SSAPIBridgeInterface } from './interface/interface';
import { log } from './log/log';
import { logLevels } from './log/logLevels';
import Search from './search';
import SearchUtils from './utils/searchUtils';

let SwiftSearchAPI: any;

const makePayload = (requestId: number, data: any) => {
    return {
        requestId,
        ...data,
    };
};

export default class SSAPIBridge implements SSAPIBridgeInterface {
    private static isLibInit(): boolean {
        return SwiftSearchAPI && SwiftSearchAPI.isLibInit();
    }

    private static initSearch(data: any): void {
        const { userId, key } = data;
        SwiftSearchAPI = new Search(userId, key);
    }

    public indexBatchCallback = ((data: {status: boolean, message: string}) => {
        this.eventCallback(apiBridgeCmds.indexBatchCallback, data);
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

    public handleMessageEvents(data: any, eventCallback: () => void): void {
        const { method, message } = data;
        this.eventCallback = eventCallback;
        if (!SSAPIBridge.isLibInit() && method !== apiBridgeCmds.initialSearch) {
            return;
        }

        log.send(logLevels.INFO, message);
        log.send(logLevels.INFO, method);

        switch (method) {
            case apiBridgeCmds.initialSearch:
                SSAPIBridge.initSearch(message);
                break;
            case apiBridgeCmds.indexBatch:
                this.indexBatch(message);
                break;
            case apiBridgeCmds.search:
                this.search(message);
                break;
            case apiBridgeCmds.checkDiskSpace:
                this.checkDiskSpace(message);
                break;
            default:
                break;
        }
    }

    public checkDiskSpace(message: any) {
        const { requestId } = message;
        this.SearchUtils.checkFreeSpace().then((res: boolean) => {
            log.send(logLevels.INFO, this.eventCallback);
            log.send(logLevels.INFO, res);
            log.send(logLevels.INFO, makePayload(requestId, res));
            this.eventCallback(apiBridgeCmds.checkDiskSpaceCallBack, makePayload(requestId, res));
        });
    }

    public indexBatch(data: any): void {
        const { messages } = data;
        SwiftSearchAPI.indexBatch(messages, this.indexBatchCallback);
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