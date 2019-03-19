import { apiBridgeCmds, SSAPIBridgeInterface } from './interface/interface';
import { log } from './log/log';
import { logLevels } from './log/logLevels';
import Search from './search';

let SwiftSearchAPI: any;

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

    constructor() {
        log.send(logLevels.INFO, 'Swift-Search Api Bridge Created');
    }

    public handleMessageEvents(data: any, eventCallback: () => void): void {
        const { method, message } = data;
        this.eventCallback = eventCallback;
        if (!SSAPIBridge.isLibInit() && method !== apiBridgeCmds.initialSearch) {
            return;
        }

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
            default:
                break;
        }
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