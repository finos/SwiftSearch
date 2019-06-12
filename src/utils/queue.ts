import { Message } from '../interface/interface';
import { logger } from '../log/logger';

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
            logger.info(`queue: status`, { status, response });
        } else {
            logger.error(`queue: error`, response);
        }

    }

    function flush(this: any, queue: Message[]): void {
        clearTimeout(timer);
        timer = null;
        resetQueue();
        if (queue) {
            logger.info(`queue: flush length`, queue.length);
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
