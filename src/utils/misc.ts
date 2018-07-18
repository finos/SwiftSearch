'use strict';
import * as os from 'os';

const isDevEnv: boolean = process.env.ELECTRON_DEV ?
    process.env.ELECTRON_DEV.trim().toLowerCase() === 'true' : false;

const isMac: boolean = (process.platform === 'darwin');
const isWindowsOS: boolean = (process.platform === 'win32');

const isNodeEnv: boolean = !!process.env.NODE_ENV;

function isWindows10(): boolean {
    const [ major ] = os.release().split('.').map((part) => parseInt(part, 10));
    return isWindowsOS && major >= 10;
}

export {
    isDevEnv,
    isMac,
    isWindowsOS,
    isNodeEnv,
    isWindows10,
};
