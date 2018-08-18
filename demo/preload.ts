import { remote } from 'electron';

declare global {
    interface Window { ssf: any; }
}

let Search;

try {
    Search = remote.require('../lib/index').Search;
} catch (e) {
    Search = null;
    console.warn('Failed to initialize');
}

let SearchUtils;

try {
    SearchUtils = remote.require('../lib/index').SearchUtils;
} catch (e) {
    SearchUtils = null;
    console.warn('Failed to initialize');
}

window.ssf = {
    Search,
    SearchUtils,
};
