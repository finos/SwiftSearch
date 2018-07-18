'use strict';

import * as keyMirror from 'keymirror';

/**
 * The different log levels
 * @type {Object}
 */
const logLevels = keyMirror({
    ERROR: null,
    CONFLICT: null,
    WARN: null,
    ACTION: null,
    INFO: null,
    DEBUG: null,
});

export { logLevels };
