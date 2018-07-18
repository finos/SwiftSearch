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
