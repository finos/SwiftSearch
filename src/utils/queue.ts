import { log } from '../log/log';
import { logLevels } from '../log/logLevels';
import { Message } from '../interface/interface';

let messagesData: Message[] = [];

const makeBoundTimedCollector = (isIndexing: any, timeout: any, callback: any) => {
    let timer: any;

    return (...args: Message[]) => {
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

    function handleRealTimeResponse(status: boolean, response: string): void {
        if (status) {
            log.send(logLevels.INFO, response);
        } else {
            log.send(logLevels.ERROR, response);
        }

    }

    function flush(this: any, queue: Message[]): void {
        clearTimeout(timer);
        timer = null;
        resetQueue();
        if (queue) {
            callback(JSON.stringify(queue), handleRealTimeResponse.bind(this));
        }
    }

    function getQueue(): Message[] {
        return messagesData;
    }

    function resetQueue(): void {
        messagesData = [];
    }
};

export { makeBoundTimedCollector };
