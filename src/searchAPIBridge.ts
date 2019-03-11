import { apiBridgeCmds } from './interface/interface';
import { log } from './log/log';
import { logLevels } from './log/logLevels';
import Search from './search';

let SwiftSearchAPI: any;

export default class SSAPIBridge {
    private eventCallback: any;

    constructor() {
        log.send(logLevels.INFO, 'Swift-Search Api Bridge Created');
    }

    public handleMessageEvents = (data: any, eventCallback: () => void) => {
        const { method, message } = data;
        this.eventCallback = eventCallback;
        if (!this.isLibInit() && method !== apiBridgeCmds.initialSearch) {
            return;
        }

        switch (method) {
            case apiBridgeCmds.initialSearch:
                this.initSearch(message);
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

    private initSearch = (data: any) => {
        const { userId, key } = data;
        SwiftSearchAPI = new Search(userId, key);
    }

    private isLibInit = () => {
        return SwiftSearchAPI && SwiftSearchAPI.isLibInit();
    }

    private indexBatch = (data: any) => {
        const { messages } = data;
        SwiftSearchAPI.indexBatch(messages, this.indexBatchCallback);
    }

    private search = (data: any) => {
        const { query,
            senderIds,
            threadIds,
            fileType,
            startDat,
            endDat,
            limit,
            offset,
            sortOrder} = data;
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

    private indexBatchCallback = (data: {status: boolean, message: string}) => {
        this.eventCallback(apiBridgeCmds.indexBatchCallback, data);
    }

    private searchCallback = (data: any) => {
        this.eventCallback(apiBridgeCmds.searchCallback, data);
    }
}