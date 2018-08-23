import * as fs from 'fs';
import { SearchUtilsInterface, UserConfig } from '../interface/interface';
import { log } from '../log/log';
import { logLevels } from '../log/logLevels';
import { searchConfig } from '../searchConfig';
import { checkDiskSpace } from './checkDiskSpace';

/**
 * Utils to validate users config data and
 * available disk space to enable electron search
 */
export default class SearchUtils implements SearchUtilsInterface {
    public readonly indexVersion: string;

    constructor() {
        this.indexVersion = searchConfig.INDEX_VERSION;
    }

    /**
     * This function returns true if the available disk space
     * is more than the constant MINIMUM_DISK_SPACE
     * @returns {Promise}
     */
    public checkFreeSpace(): Promise<boolean> {
        return checkDiskSpace();
    }

    /**
     * This function return the user search config
     * @param userId
     * @returns {Promise<object>}
     */
    public getSearchUserConfig(userId: string): Promise<UserConfig> {
        return new Promise((resolve, reject) => {
            readFile.call(this, userId, resolve, reject);
        });
    }

    /**
     * This function updates the user config file
     * with the provided data
     * @param userId
     * @param data
     * @returns {Promise<object>}
     */
    public updateUserConfig(userId: string, data: UserConfig): Promise<UserConfig> {
        return new Promise((resolve, reject) => {
            updateConfig.call(this, userId, data, resolve, reject);
        });
    }
}

/**
 * This function reads the search user config file and
 * return the object
 * @param userId
 * @param resolve
 * @param reject
 */
function readFile(this: SearchUtils, userId: string, resolve: any, reject: any) {
    if (fs.existsSync(`${searchConfig.FOLDERS_CONSTANTS.USER_CONFIG_FILE}`)) {
        fs.readFile(`${searchConfig.FOLDERS_CONSTANTS.USER_CONFIG_FILE}`, 'utf8', (err, data) => {
            if (err) {
                return reject('Error reading the UserConfig');
            }
            let usersConfig: UserConfig;
            try {
                usersConfig = JSON.parse(data);
            } catch (e) {
                createUserConfigFile.call(this, userId, undefined);
                return reject('can not parse user config file data: ' + data + ', error: ' + e);
            }
            if (!usersConfig[userId]) {
                createUser(userId, usersConfig);
                return reject(null);
            }
            return resolve(usersConfig[userId]);
        });
    } else {
        createUserConfigFile.call(this, userId, undefined);
        return resolve(null);
    }
}

/**
 * If the config has no object for the provided userId this function
 * creates an empty object with the key as the userId
 * @param userId
 * @param oldConfig
 */
function createUser(userId: string, oldConfig: UserConfig): void {
    const configPath = searchConfig.FOLDERS_CONSTANTS.USER_CONFIG_FILE;
    const newConfig = Object.assign({}, oldConfig);
    newConfig[userId] = {};

    const jsonNewConfig = JSON.stringify(newConfig, null, ' ');

    fs.writeFile(configPath, jsonNewConfig, 'utf8', (err) => {
        if (err) {
            log.send(logLevels.ERROR, 'Error creating new user');
        }
    });
}

/**
 * This function creates the config
 * file if not present
 * @param userId
 * @param data
 */
function createUserConfigFile(this: SearchUtils, userId: string, data: UserConfig): void {
    let userData: any = data;

    const createStream = fs.createWriteStream(searchConfig.FOLDERS_CONSTANTS.USER_CONFIG_FILE);
    if (userData) {
        if (!userData.indexVersion) {
            userData.indexVersion = this.indexVersion;
        }
        try {
            userData = JSON.stringify(userData);
            createStream.write(`{"${userId}": ${userData}}`);
        } catch (e) {
            createStream.write(`{"${userId}": {}}`);
        }
    } else {
        createStream.write(`{"${userId}": {}}`);
    }
    createStream.end();
}

/**
 * Function to update user config data
 * @param userId
 * @param data
 * @param resolve
 * @param reject
 * @returns {*}
 */
function updateConfig(this: SearchUtils, userId: string, data: UserConfig, resolve: any, reject: any) {
    const userData: UserConfig = data;

    if (userData && !userData.indexVersion) {
        userData.indexVersion = this.indexVersion;
    }

    const configPath = searchConfig.FOLDERS_CONSTANTS.USER_CONFIG_FILE;
    if (!fs.existsSync(configPath)) {
        createUserConfigFile.call(this, userId, userData);
        return reject(null);
    }

    let oldConfig;
    const oldData = fs.readFileSync(configPath, 'utf8');

    try {
        oldConfig = JSON.parse(oldData);
    } catch (e) {
        createUserConfigFile.call(this, userId, data);
        return reject('can not parse user config file data: ' + e);
    }

    const newConfig = Object.assign({}, oldConfig);
    newConfig[userId] = data;

    const jsonNewConfig = JSON.stringify(newConfig, null, ' ');

    fs.writeFileSync(configPath, jsonNewConfig, 'utf8');
    return resolve(newConfig[userId]);
}
