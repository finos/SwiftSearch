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

/**
 * Entities
 */
interface Entities {
    hashtags: any[];
    cashtags: any[];
    userMentions: any[];
}

/**
 * Messages
 */
export interface Message {
    messageId: string;
    text: string;
    senderId: string;
    threadId: string;
    ingestionDate: string;
    chatType: string;
    isPublic: string;
    sendingApp: string;
    senderAvatar: string;
    senderName: string;
    senderType: string;
    entities: Entities;
    tags: string;
    attachments: any[];
    attachmentNames: string;
}

/**
 * SearchResponse
 */
export interface SearchResponse {
    messages: Message[];
    more: number;
    returned: number;
    total: number;
}
