import * as util from 'util';
import * as childProcess from 'child_process';
import { isMac } from './misc';
import { searchConfig } from '../searchConfig';

const exec = util.promisify(childProcess.exec);

async function checkDiskSpace(): Promise<boolean> {
    let userDataPath: string = searchConfig.FOLDERS_CONSTANTS.USER_DATA_PATH;
    if (!isMac) {
        try {
            userDataPath = userDataPath.substring(0, 1);
        } catch (e) {
            return false;
        }
    }

    if (!userDataPath) {
        return false;
    }

    if (isMac) {
        let response: any;
        try {
            // This is temporary until we have a fix for https://github.com/electron/electron/issues/13458 issue
            response = await exec("df -k '" + userDataPath.replace(/'/g, "'\\''") + "'");
            if (response) {

                const data = response.trim().split('\n');

                const diskInfoStr = data[data.length - 1].replace( /[\s\n\r]+/g, ' ');
                const freeSpace: string[] = diskInfoStr.split(' ');
                const space: number = parseInt(freeSpace[ 3 ], 10) * 1024;
                console.log(space);
                return space >= searchConfig.MINIMUM_DISK_SPACE;
            }
            return false;
        } catch (e) {
            return false;
        }

    } else {
        let response: any;

        try {
            // This is temporary until we have a fix for https://github.com/electron/electron/issues/13458 issue
            response = await exec(`"${searchConfig.LIBRARY_CONSTANTS.FREE_DISK_SPACE}" ${userDataPath}`);
            if (response) {
                const data: string[] = response.trim().split(',');

                if (data[ 1 ] === searchConfig.DISK_NOT_READY) {
                    return false;
                }

                if (data[ 1 ] === searchConfig.DISK_NOT_FOUND) {
                    return false;
                }

                const diskInfoStr: number = parseInt(data[ 0 ], 10);
                return diskInfoStr >= searchConfig.MINIMUM_DISK_SPACE;
            }
            return false;
        } catch (e) {
            return false;
        }
    }
}

export  { checkDiskSpace };
