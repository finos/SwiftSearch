import { app } from 'electron';
import * as path from 'path';
import { getCmdLineArg } from '../utils/getCmdLineArg';
import { logLevels } from './logLevels';
import { ElectronLogInterface, LogWindow } from '../interface/interface';

const MAX_LOG_QUEUE_LENGTH = 100;

let electronLog: ElectronLogInterface;

export class Logger {
    private logQueue: any[];
    private logWindow: any;

    constructor() {
        // browser window that has registered a logger
        this.logWindow = null;

        // holds log messages received before logger has been registered.
        this.logQueue = [];

        // Initializes the local logger
        if (!process.env.ELECTRON_QA) {
            initializeLocalLogger();
        }
    }

    /**
     * Send log messages from main process to logger hosted by
     * renderer process. Allows main process to use logger
     * provided by JS.
     * @param  {enum} level      enum from ./enums/LogLevel.js
     * @param  {string} details  msg to be logged
     */
    public send(level: string, details: string): void {
        if (!level || !details) {
            return;
        }

        if (!process.env.ELECTRON_QA) {
            logLocally(level, details);
        }

        const logMsg = {
            level,
            details,
            startTime: Date.now(),
        };

        if (this.logWindow) {
            this.logWindow.send('log', {
                msgs: [ logMsg ],
            });
        } else {
            // store log msgs for later when (if) we get logger registered
            this.logQueue.push(logMsg);
            // don't store more than 100 msgs. keep most recent log msgs.
            if (this.logQueue.length > MAX_LOG_QUEUE_LENGTH) {
                this.logQueue.shift();
            }
        }
    }

    /**
     * Sets a window instance for the remote object
     * @param win
     */
    public setLogWindow(win: LogWindow): void {
        this.logWindow = win;

        if (this.logWindow) {
            const logMsg: any = {};

            if (Array.isArray(this.logQueue)) {
                logMsg.msgs = this.logQueue;
            }

            // configure desired log level and send pending log msgs
            const logLevel = getCmdLineArg(process.argv, '--logLevel=', false);
            if (logLevel) {
                const level = logLevel.split('=')[1];
                if (level) {
                    logMsg.logLevel = level;
                }
            }

            if (getCmdLineArg(process.argv, '--enableConsoleLogging', false)) {
                logMsg.showInConsole = true;
            }

            if (Object.keys(logMsg).length) {
                this.logWindow.send('log', logMsg);
            }

            this.logQueue = [];
        }
    }
}

const loggerInstance = new Logger();

/**
 * Initializes the electron logger for local logging
 */
function initializeLocalLogger() {
// eslint-disable-next-line global-require
    electronLog = require('electron-log');
    electronLog.transports.file.file = path.join(app.getPath('logs'), 'app.log');
    electronLog.transports.file.level = 'debug';
    electronLog.transports.file.format = '{h}:{i}:{s}:{ms} {text}';
    electronLog.transports.file.maxSize = 10 * 1024 * 1024;
    electronLog.transports.file.appName = 'Symphony';
}

/**
 * Logs locally using the electron-logger
 * @param level
 * @param message
 */
function logLocally(level: string, message: string): void {
    switch (level) {
        case logLevels.ERROR: electronLog.error(message); break;
        case logLevels.CONFLICT: electronLog.error(message); break;
        case logLevels.WARN: electronLog.warn(message); break;
        case logLevels.ACTION: electronLog.warn(message); break;
        case logLevels.INFO: electronLog.info(message); break;
        case logLevels.DEBUG: electronLog.debug(message); break;
        default: electronLog.debug(message);
    }
}

// Logger class is only exposed for testing purposes.
const log = {
    log: Logger,
    send: loggerInstance.send.bind(loggerInstance),
    setLogWindow: loggerInstance.setLogWindow.bind(loggerInstance),
};

export { log };
