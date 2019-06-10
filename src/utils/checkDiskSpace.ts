import * as childProcess from 'child_process';
import * as util from 'util';
import { logger } from '../log/logger';
import { searchConfig } from '../searchConfig';
import { isMac } from './misc';

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
        try {
            const { stdout, stderr } = await exec("df -k '" + userDataPath.replace(/'/g, "'\\''") + "'");
            if (stderr) {
                logger.error(`checkDiskSpace: Error retrieving available disk space ${stderr}`);
                return false;
            }
            const data = stdout.trim().split('\n');

            const diskInfoStr = data[ data.length - 1 ].replace(/[\s\n\r]+/g, ' ');
            const freeSpace: string[] = diskInfoStr.split(' ');
            const space: number = parseInt(freeSpace[ 3 ], 10) * 1024;
            return space >= searchConfig.MINIMUM_DISK_SPACE;
        } catch (e) {
            logger.error(`checkDiskSpace: Error child_process error ${e}`);
            return false;
        }

    } else {
        try {
            const { stdout, stderr } = await exec(`"${searchConfig.LIBRARY_CONSTANTS.FREE_DISK_SPACE}" ${userDataPath}`);
            if (stderr) {
                logger.error(`checkDiskSpace: Error retrieving available disk space ${stderr}`);
                return false;
            }
            const data: string[] = stdout.trim().split(',');

            if (data[ 1 ] === searchConfig.DISK_NOT_READY) {
                return false;
            }

            if (data[ 1 ] === searchConfig.DISK_NOT_FOUND) {
                return false;
            }

            const diskInfoStr: number = parseInt(data[ 0 ], 10);
            return diskInfoStr >= searchConfig.MINIMUM_DISK_SPACE;
        } catch (e) {
            logger.error(`checkDiskSpace: Error child_process error ${e}`);
            return false;
        }
    }
}

export  { checkDiskSpace };
