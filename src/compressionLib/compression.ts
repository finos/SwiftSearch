import * as childProcess from 'child_process';
import * as path from 'path';
import * as util from 'util';
import { log } from '../log/log';
import { logLevels } from '../log/logLevels';
import { searchConfig } from '../searchConfig';
import { isDevEnv, isMac} from '../utils/misc';

const exec = util.promisify(childProcess.exec);
const ROOT_PATH: string = isDevEnv ? path.join(__dirname, '..', '..') : searchConfig.FOLDERS_CONSTANTS.USER_DATA_PATH;

/**
 * Using the child process to execute the tar and lz4
 * compression and the final output of this function
 * will be compressed file with ext: .tar.lz4
 * @param pathToFolder
 * @param outputPath
 * @param callback
 */
async function compression(pathToFolder: string, outputPath: string, callback: (status: boolean) => void) {
    if (isMac) {
        try {
            const { stdout, stderr } = await exec(`cd "${ROOT_PATH}" && tar cf - "${pathToFolder}" | "${searchConfig.LIBRARY_CONSTANTS.MAC_LIBRARY_FOLDER}/lz4.exec" > "${outputPath}.tar.lz4"`);
            if (stderr) {
                log.send(logLevels.INFO, `compression stderr: ${stderr}`);
            }
            log.send(logLevels.INFO, `compression success stdout: ${stdout}`);
            return callback(true);
        } catch (e) {
            log.send(logLevels.INFO, `compression failed with error: ${e}`);
            return callback(false);
        }
    } else {
        try {
            const drive = ROOT_PATH.substring(0, 2);
            const { stdout, stderr } = await exec(`${drive} && cd "${ROOT_PATH}" && "${searchConfig.LIBRARY_CONSTANTS.WIN_LIBRARY_FOLDER}\\tar-win.exe" cf - "${pathToFolder}" | "${searchConfig.LIBRARY_CONSTANTS.LZ4_PATH}" > "${outputPath}.tar.lz4"`);
            if (stderr) {
                log.send(logLevels.INFO, `compression stderr: ${stderr}`);
            }
            log.send(logLevels.INFO, `compression success stdout: ${stdout}`);
            return callback(true);
        } catch (e) {
            log.send(logLevels.INFO, `compression failed with error: ${e}`);
            return callback(false);
        }
    }
}

/**
 * This function decompress the file
 * and the ext should be .tar.lz4
 * the output will be the user index folder
 * @param pathName
 * @param callback
 */
async function decompression(pathName: string, callback: (status: boolean) => void) {
    if (isMac) {
        try {
            const { stdout, stderr } = await exec(`cd "${ROOT_PATH}" && "${searchConfig.LIBRARY_CONSTANTS.MAC_LIBRARY_FOLDER}/lz4.exec" -d "${pathName}" | tar -xf - `);
            if (stderr) {
                log.send(logLevels.INFO, `decompression stderr: ${stderr}`);
            }
            log.send(logLevels.INFO, `decompression success stdout: ${stdout}`);
            return callback(true);
        } catch (e) {
            log.send(logLevels.INFO, `decompression failed with error: ${e}`);
            return callback(false);
        }
    } else {
        try {
            const drive = ROOT_PATH.substring(0, 2);
            const { stdout, stderr } = await exec(`${drive} && cd "${ROOT_PATH}" && "${searchConfig.LIBRARY_CONSTANTS.LZ4_PATH}" -d "${pathName}" | "${searchConfig.LIBRARY_CONSTANTS.WIN_LIBRARY_FOLDER}\\tar-win.exe" xf - `);
            if (stderr) {
                log.send(logLevels.INFO, `decompression stderr: ${stderr}`);
            }
            log.send(logLevels.INFO, `decompression success stdout: ${stdout}`);
            return callback(true);
        } catch (e) {
            log.send(logLevels.INFO, `decompression failed with error: ${e}`);
            return callback(false);
        }
    }
}

export { compression, decompression };
