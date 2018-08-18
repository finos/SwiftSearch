import keyMirror = require('keymirror');

/**
 * The different log levels
 * @type {Object}
 */
const logLevels = keyMirror({
    ACTION: null,
    CONFLICT: null,
    DEBUG: null,
    ERROR: null,
    INFO: null,
    WARN: null,
});

export { logLevels };
