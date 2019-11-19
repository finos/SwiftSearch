import { libSymphonySearch } from '../searchLibrary';
import SearchUtils from '../utils/searchUtils';

const Utils = new SearchUtils();

export default {
    ...libSymphonySearch,
    SearchUtils: {
        checkFreeSpace: Utils.checkFreeSpace,
        getSearchUserConfig: Utils.getSearchUserConfig,
        updateUserConfig: Utils.updateUserConfig,
    },
};
