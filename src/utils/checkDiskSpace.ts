import * as DiskUsage from 'diskusage';
import { logger } from '../log/logger';
import { searchConfig } from '../searchConfig';
import { isMac } from './misc';

async function checkDiskSpace(): Promise<boolean> {
    let userDataPath: string = searchConfig.FOLDERS_CONSTANTS.USER_DATA_PATH;
    if (!isMac) {
        try {
            userDataPath = userDataPath.substring(0, 2);
        } catch (e) {
            logger.info(`checkDiskSpace: userDataPath substring failed`);
            return false;
        }
    }

    if (!userDataPath) {
        return false;
    }

    try {
        const { free } = await DiskUsage.check(userDataPath);

        logger.info(`checkDiskSpace: response from diskusage`, free);

        if (!free) {
            logger.error(`checkDiskSpace: Error retrieving available disk space`, free);
            return false;
        }

        return free >= searchConfig.MINIMUM_DISK_SPACE;
    } catch (e) {
        logger.error(`checkDiskSpace: Error diskusage`, e);
        return false;
    }
}

export  { checkDiskSpace };
