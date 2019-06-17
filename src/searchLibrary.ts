import * as ffi from 'ffi';
import * as ref from 'ref';

import { searchConfig } from './searchConfig';

const symLucyIndexer = ref.types.void;
const symLucyIndexerPtr = ref.refType(symLucyIndexer);

/**
 * Initializing the C SymphonySearchEngine library
 * using the node-ffi
 */
const lib = ffi.Library(searchConfig.LIBRARY_CONSTANTS.SEARCH_LIBRARY_PATH, {

    symSE_RAM_index_search: ['char *', ['string', 'string', 'string', 'int', 'int', 'int']],
    symSE_clear_main_RAM_index: ['int', []],
    symSE_clear_realtime_RAM_index: ['int', []],
    symSE_clear_temp_index: ['int', ['string']],
    symSE_commit_index: ['int', [symLucyIndexerPtr, 'int']], // will be removed
    symSE_create_partial_index: ['int', ['string', 'string', 'string']],
    symSE_delete_messages: ['int', ['string', 'string', 'string', 'string']],
    symSE_delete_messages_from_RAM_index: ['int', ['string', 'string', 'string']],
    symSE_deserialize_main_index_from_encrypted_folders: ['int', ['string', 'string']],
    symSE_destroy: ['int', []],
    symSE_ensure_folder_exists: ['int', ['string']],
    symSE_ensure_index_exists: ['int', ['string']],
    symSE_free_results: ['int', ['char *']],
    symSE_get_indexer: [symLucyIndexerPtr, ['string']], // will be removed
    symSE_get_last_message_timestamp: ['char *', ['string']],
    symSE_index_main_RAM: ['int', ['string']],
    symSE_index_realtime: ['int', ['string', 'string']],
    symSE_index_realtime_RAM: ['int', ['string']],
    symSE_init: ['void', []],
    symSE_main_FS_index_to_RAM_index: ['int', ['string']],
    symSE_main_RAM_index_get_last_message_timestamp: ['char *', []],
    symSE_main_RAM_index_to_FS_index: ['int', ['string']],
    symSE_merge_partial_index: ['int', ['string', 'string']],
    symSE_merge_temp_index: ['int', ['string', 'string']],
    symSE_realtime_FS_index_to_RAM_index: ['int', ['string']],
    symSE_realtime_RAM_index_to_FS_index: ['int', ['string']],
    symSE_remove_folder: ['int', ['string']],
    symSE_search: ['char *', ['string', 'string', 'string', 'string', 'string', 'int', 'int', 'int']],
    symSE_serialize_main_index_to_encrypted_folders: ['int', ['string', 'string']],
});

const libSymphonySearch = {
    symSEClearMainRAMIndex: lib.symSE_clear_main_RAM_index,
    symSEClearMainRAMIndexAsync: lib.symSE_clear_main_RAM_index.async,
    symSEClearRealtimeRAMIndex: lib.symSE_clear_realtime_RAM_index,
    symSEClearRealtimeRAMIndexAsync: lib.symSE_clear_realtime_RAM_index.async,
    symSEClearTempIndex: lib.symSE_clear_temp_index,
    symSEClearTempIndexAsync: lib.symSE_clear_temp_index.async,
    symSECommitIndex: lib.symSE_commit_index,
    symSECommitIndexAsync: lib.symSE_commit_index.async,
    symSECreatePartialIndex: lib.symSE_create_partial_index,
    symSECreatePartialIndexAsync: lib.symSE_create_partial_index.async,
    symSEDeleteMessages: lib.symSE_delete_messages,
    symSEDeleteMessagesAsync: lib.symSE_delete_messages.async,
    symSEDeleteMessagesFromRAMIndex: lib.symSE_delete_messages_from_RAM_index,
    symSEDeleteMessagesFromRAMIndexAsync: lib.symSE_delete_messages_from_RAM_index.async,
    symSEDeserializeMainIndexToEncryptedFolders: lib.symSE_deserialize_main_index_from_encrypted_folders,
    symSEDeserializeMainIndexToEncryptedFoldersAsync: lib.symSE_deserialize_main_index_from_encrypted_folders.async,
    symSEDestroy: lib.symSE_destroy,
    symSEDestroyAsync: lib.symSE_destroy.async,
    symSEEnsureFolderExists: lib.symSE_ensure_folder_exists,
    symSEEnsureFolderExistsAsync: lib.symSE_ensure_folder_exists.async,
    symSEEnsureIndexExists: lib.symSE_ensure_index_exists,
    symSEEnsureIndexExistsAsync: lib.symSE_ensure_index_exists.async,
    symSEFreeResult: lib.symSE_free_results,
    symSEFreeResultAsync: lib.symSE_free_results.async,
    symSEGetIndexer: lib.symSE_get_indexer,
    symSEGetIndexerAsync: lib.symSE_get_indexer.async,
    symSEGetLastMessageTimestamp: lib.symSE_get_last_message_timestamp,
    symSEGetLastMessageTimestampAsync: lib.symSE_get_last_message_timestamp.async,
    symSEIndexMainRAM: lib.symSE_index_main_RAM,
    symSEIndexMainRAMAsync: lib.symSE_index_main_RAM.async,
    symSEIndexRealTime: lib.symSE_index_realtime,
    symSEIndexRealTimeAsync: lib.symSE_index_realtime.async,
    symSEIndexRealtimeRAM: lib.symSE_index_realtime_RAM,
    symSEIndexRealtimeRAMAsync: lib.symSE_index_realtime_RAM.async,
    symSEInit: lib.symSE_init,
    symSEInitAsync: lib.symSE_init.async,
    symSEMainFSIndexToRAMIndex: lib.symSE_main_FS_index_to_RAM_index,
    symSEMainFSIndexToRAMIndexAsync: lib.symSE_main_FS_index_to_RAM_index.async,
    symSEMainRAMIndexGetLastMessageTimestamp: lib.symSE_main_RAM_index_get_last_message_timestamp,
    symSEMainRAMIndexGetLastMessageTimestampAsync: lib.symSE_main_RAM_index_get_last_message_timestamp.async,
    symSEMainRAMIndexToFSIndex: lib.symSE_main_RAM_index_to_FS_index,
    symSEMainRAMIndexToFSIndexAsync: lib.symSE_main_RAM_index_to_FS_index.async,
    symSEMergePartialIndex: lib.symSE_merge_partial_index,
    symSEMergePartialIndexAsync: lib.symSE_merge_partial_index.async,
    symSEMergeTempIndex: lib.symSE_merge_temp_index,
    symSEMergeTempIndexAsync: lib.symSE_merge_temp_index.async,
    symSERAMIndexSearch: lib.symSE_RAM_index_search,
    symSERAMIndexSearchAsync: lib.symSE_RAM_index_search.async,
    symSERealtimeFSIndexToRAMIndex: lib.symSE_realtime_FS_index_to_RAM_index,
    symSERealtimeFSIndexToRAMIndexAsync: lib.symSE_realtime_FS_index_to_RAM_index.async,
    symSERealtimeRAMIndexToFSIndex: lib.symSE_realtime_RAM_index_to_FS_index,
    symSERealtimeRAMIndexToFSIndexAsync: lib.symSE_realtime_RAM_index_to_FS_index.async,
    symSERemoveFolder: lib.symSE_remove_folder,
    symSERemoveFolderAsync: lib.symSE_remove_folder.async,
    symSESearch: lib.symSE_search,
    symSESearchAsync: lib.symSE_search.async,
    symSESerializeMainIndexToEncryptedFolders: lib.symSE_serialize_main_index_to_encrypted_folders,
    symSESerializeMainIndexToEncryptedFoldersAsync: lib.symSE_serialize_main_index_to_encrypted_folders.async,
};

export { libSymphonySearch };
