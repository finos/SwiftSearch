import { log } from '../log/log';
import { logLevels } from '../log/logLevels';

let messagesData: any[] = [];

const makeBoundTimedCollector = (isIndexing: any, timeout: any, callback: any) => {
    let timer: any;

    return (...args: any[]) => {
        if (!timer) {
            timer = setTimeout(() => {
                if (!isIndexing()) {
                    flush(getQueue());
                }
            }, timeout);
        }

        const queue = getQueue();
        queue.push(args[0]);

        if (!isIndexing()) {
            flush(queue);
        }
    };

    function handleRealTimeResponse(status: any, response: any): void {
        if (status) {
            log.send(logLevels.INFO, response);
        } else {
            log.send(logLevels.ERROR, response);
        }

    }

    function flush(this: any, queue: any) {
        clearTimeout(timer);
        timer = null;
        resetQueue();
        if (queue) {
            callback(JSON.stringify(queue), handleRealTimeResponse.bind(this));
        }
    }

    function getQueue() {
        return messagesData;
    }

    function resetQueue() {
        messagesData = [];
    }
};

export { makeBoundTimedCollector };
