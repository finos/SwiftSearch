'use strict';
/**
 * Search Utils return types interface
 */
export interface Std {
    stderr: string;
    stdout: string;
}

/**
 * Search User Config interface
 */
export interface UserConfig {
    rotationId: number;
    language: string;
    version: number;
    indexVersion: string;
}

/**
 * FileInterface
 */
interface FileInterface {
    file: string;
    level: string;
    format: string;
    maxSize: number;
    appName: string;
}

/**
 * TransportsInterface
 */
interface TransportsInterface {
    file: FileInterface;
}

/**
 * ElectronLogInterface
 */
export interface ElectronLogInterface {
    transports: TransportsInterface;
    error(message: string): void;
    warn(message: string): void;
    info(message: string): void;
    debug(message: string): void;
}

/**
 * LogWindow
 */
export interface LogWindow {
    send(id: string, message: object): void;
}
