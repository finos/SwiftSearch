import { apiBridgeCmds } from './interface/interface';
import Search from './search';

let SwiftSearchAPI: any;

export default class SSAPIBridge {

    constructor() {}

    private initSearch = (data: any) => {
        const { userId, key } = data;
        /* tslint:disable */
        SwiftSearchAPI = new Search(userId, key);
    };

    private isLibInit = () => {
        return SwiftSearchAPI && SwiftSearchAPI.isLibInit();
    };

    private indexBatch = (data: any) => {
        const { messages } = data;
        SwiftSearchAPI.indexBatch(messages)
    };

    public handleSSAPIBridgeEvents = (data: any) => {
        const { method, message } = data;

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
            default:
                console.log('default-break');
                /* tslint:enable */
                break;
        }
    }
}