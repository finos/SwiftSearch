import * as electron from 'electron';
import * as path from 'path';
import { isDevEnv, isMac } from './utils/misc';

const app = electron.app;
const userData = path.join(app.getPath('userData'));
const execPath = path.dirname(app.getPath('exe'));

const winLibraryPath = isDevEnv ? path.join(__dirname, '..', 'library') : path.join(execPath, 'library');
const macLibraryPath = isDevEnv ? path.join(__dirname, '..', 'library') : path.join(execPath, '..', 'library');

const arch = process.arch === 'ia32';

const winLZ4ArchPath = arch ? 'lz4-win-x86.exe' : 'lz4-win-x64.exe';
const lz4Path = path.join(winLibraryPath, winLZ4ArchPath);

const indexFolderPath = isDevEnv ? './' : userData;

const winSearchLibArchPath = arch ? 'libsymphonysearch-x86.dll' : 'libsymphonysearch-x64.dll';
const libraryPath = isMac ? path.join(macLibraryPath, 'libsymphonysearch.dylib') : path.join(winLibraryPath, winSearchLibArchPath);

const userConfigFileName = 'search_users_config.json';
const userConfigFile = isDevEnv ? path.join(__dirname, '..', userConfigFileName) : path.join(userData, userConfigFileName);

const libraryFolderPath = isMac ? macLibraryPath : winLibraryPath;

const pathToUtils = isDevEnv ? path.join(__dirname, '../../node_modules/electron-utils') : winLibraryPath;
const freeDiskSpace = path.join(pathToUtils, isDevEnv ? 'FreeDiskSpace/bin/Release/FreeDiskSpace.exe' : 'FreeDiskSpace.exe');

const libraryPaths = {
    FREE_DISK_SPACE: freeDiskSpace,
    LIBRARY_FOLDER_PATH: libraryFolderPath,
    LZ4_PATH: lz4Path,
    MAC_LIBRARY_FOLDER: macLibraryPath,
    SEARCH_LIBRARY_PATH: libraryPath,
    WIN_LIBRARY_FOLDER: winLibraryPath,
};

const folderPaths = {
    EXEC_PATH: execPath,
    INDEX_PATH: indexFolderPath,
    MAIN_INDEX: 'mainindex',
    PREFIX_NAME: 'search_index',
    USER_CONFIG_FILE: userConfigFile,
    USER_DATA_PATH: userData,
};

const searchConfig = {
    DISK_NOT_FOUND: 'DISK_NOT_FOUND',
    DISK_NOT_READY: 'NOT_READY',
    FOLDERS_CONSTANTS: folderPaths,
    INDEX_VERSION: 'v3',
    KEY_ENCODING: 'base64',
    KEY_LENGTH: 32,
    LIBRARY_CONSTANTS: libraryPaths,
    MAC_PATH_ERROR: 'No such file or directory',
    MAXIMUM_DATE: '9999999999999',
    MINIMUM_DATE: '0000000000000',
    MINIMUM_DISK_SPACE: 300000000, // in bytes
    REAL_TIME_INDEXING_TIME: 60000,
    SEARCH_PERIOD_SUBTRACTOR: 3 * 31 * 24 * 60 * 60 * 1000,
    SORT_BY_DATE: 1,
    SORT_BY_SCORE: 0,
    TAR_LZ4_EXT: '.tar.lz4',
};

export { searchConfig };
