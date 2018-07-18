import { remote } from 'electron';
const SwiftSearch = remote.require('../lib/index');

window['ssf'] = {
    Search: SwiftSearch.Search,
    SearchUtils: SwiftSearch.SearchUtils,
};
