'use strict';

import * as ffi from 'ffi-napi';
import * as ref from 'ref-napi';

import { searchConfig } from './searchConfig';

const symLucyIndexer = ref.types.void;
const symLucyIndexerPtr = ref.refType(symLucyIndexer);

/**
 * Initializing the C SymphonySearchEngine library
 * using the node-ffi
 */
const lib = ffi.Library(searchConfig.LIBRARY_CONSTANTS.SEARCH_LIBRARY_PATH, {

    // New Memory Indexing API
    symSE_index_main_RAM: ['int', ['string']],
    symSE_index_realtime_RAM: ['int', ['string']],
    symSE_main_RAM_index_to_FS_index: ['int', ['string']],
    symSE_realtime_RAM_index_to_FS_index: ['int', ['string']],
    symSE_main_RAM_index_get_last_message_timestamp: ['char *', []],
    symSE_RAM_index_search: ['char *', ['string', 'string', 'string', 'int', 'int', 'int']],
    symSE_main_FS_index_to_RAM_index: ['int', ['string']],
    symSE_realtime_FS_index_to_RAM_index: ['int', ['string']],
    symSE_clear_realtime_RAM_index: ['int', []],
    symSE_clear_main_RAM_index: ['int', []],
    symSE_delete_messages_from_RAM_index: ['int', ['string', 'string', 'string']],
    symSE_destroy: ['int', []],

    // Serialization/Deserialization API
    symSE_serialize_main_index_to_encrypted_folders: ['int', ['string', 'string']],
    symSE_deserialize_main_index_from_encrypted_folders: ['int', ['string', 'string']],

    // init
    symSE_init: ['void', []],
    symSE_remove_folder: ['int', ['string']],
    symSE_ensure_index_exists: ['int', ['string']],
    symSE_ensure_folder_exists: ['int', ['string']],
    // first time indexing and delta indexing
    symSE_get_indexer: [symLucyIndexerPtr, ['string']], // will be removed
    symSE_create_partial_index: ['int', ['string', 'string', 'string']],
    symSE_merge_partial_index: ['int', ['string', 'string']],
    // real time indexing
    symSE_index_realtime: ['int', ['string', 'string']],
    symSE_merge_temp_index: ['int', ['string', 'string']],
    symSE_clear_temp_index: ['int', ['string']],
    // Search,
    symSE_search: ['char *', ['string', 'string', 'string', 'string', 'string', 'int', 'int', 'int']],
    // Deletion
    symSE_delete_messages: ['int', ['string', 'string', 'string', 'string']],
    // Index commit/optimize
    symSE_commit_index: ['int', [symLucyIndexerPtr, 'int']], // will be removed
    // freePointer
    symSE_free_results: ['int', ['char *']],

    // Latest messages timestamp
    symSE_get_last_message_timestamp: ['char *', ['string']],
});

const libSymphonySearch = {
    // New Memory Indexing API
    symSEIndexMainRAM: lib.symSE_index_main_RAM,
    symSEIndexRealtimeRAM: lib.symSE_index_realtime_RAM,
    symSEMainRAMIndexToFSIndex: lib.symSE_main_RAM_index_to_FS_index,
    symSERealtimeRAMIndexToFSIndex: lib.symSE_realtime_RAM_index_to_FS_index,
    symSEMainRAMIndexGetLastMessageTimestamp: lib.symSE_main_RAM_index_get_last_message_timestamp,
    symSERAMIndexSearch: lib.symSE_RAM_index_search,
    symSEMainFSIndexToRAMIndex: lib.symSE_main_FS_index_to_RAM_index,
    symSERealtimeFSIndexToRAMIndex: lib.symSE_realtime_FS_index_to_RAM_index,
    symSEClearRealtimeRAMIndex: lib.symSE_clear_realtime_RAM_index,
    symSEClearMainRAMIndex: lib.symSE_clear_main_RAM_index,
    symSEDeleteMessagesFromRAMIndex: lib.symSE_delete_messages_from_RAM_index,
    symSEDestroy: lib.symSE_destroy,

    // Serialization/Deserialization API
    symSESerializeMainIndexToEncryptedFolders: lib.symSE_serialize_main_index_to_encrypted_folders,
    symSEDeserializeMainIndexToEncryptedFolders: lib.symSE_deserialize_main_index_from_encrypted_folders,
    symSESerializeMainIndexToEncryptedFoldersAsync: lib.symSE_serialize_main_index_to_encrypted_folders.async,
    symSEDeserializeMainIndexToEncryptedFoldersAsync: lib.symSE_deserialize_main_index_from_encrypted_folders.async,

    symSEIndexMainRAMAsync: lib.symSE_index_main_RAM.async,
    symSEIndexRealtimeRAMAsync: lib.symSE_index_realtime_RAM.async,
    symSEMainRAMIndexToFSIndexAsync: lib.symSE_main_RAM_index_to_FS_index.async,
    symSERealtimeRAMIndexToFSIndexAsync: lib.symSE_realtime_RAM_index_to_FS_index.async,
    symSEMainRAMIndexGetLastMessageTimestampAsync: lib.symSE_main_RAM_index_get_last_message_timestamp.async,
    symSERAMIndexSearchAsync: lib.symSE_RAM_index_search.async,
    symSEMainFSIndexToRAMIndexAsync: lib.symSE_main_FS_index_to_RAM_index.async,
    symSERealtimeFSIndexToRAMIndexAsync: lib.symSE_realtime_FS_index_to_RAM_index.async,
    symSEClearRealtimeRAMIndexAsync: lib.symSE_clear_realtime_RAM_index.async,
    symSEClearMainRAMIndexAsync: lib.symSE_clear_main_RAM_index.async,
    symSEDeleteMessagesFromRAMIndexAsync: lib.symSE_delete_messages_from_RAM_index.async,
    symSEDestroyAsync: lib.symSE_destroy.async,

    symSEInit: lib.symSE_init,
    symSERemoveFolder: lib.symSE_remove_folder,
    symSEEnsureIndexExists: lib.symSE_ensure_index_exists,
    symSEEnsureFolderExists: lib.symSE_ensure_folder_exists,
    symSEGetIndexer: lib.symSE_get_indexer,
    symSECreatePartialIndex: lib.symSE_create_partial_index,
    symSEMergePartialIndex: lib.symSE_merge_partial_index,
    symSEIndexRealTime: lib.symSE_index_realtime,
    symSEMergeTempIndex: lib.symSE_merge_temp_index,
    symSEClearTempIndex: lib.symSE_clear_temp_index,
    symSESearch: lib.symSE_search,
    symSEDeleteMessages: lib.symSE_delete_messages,
    symSECommitIndex: lib.symSE_commit_index,
    symSEFreeResult: lib.symSE_free_results,
    symSEGetLastMessageTimestamp: lib.symSE_get_last_message_timestamp,
    symSEInitAsync: lib.symSE_init.async,
    symSERemoveFolderAsync: lib.symSE_remove_folder.async,
    symSEEnsureIndexExistsAsync: lib.symSE_ensure_index_exists.async,
    symSEEnsureFolderExistsAsync: lib.symSE_ensure_folder_exists.async,
    symSEGetIndexerAsync: lib.symSE_get_indexer.async,
    symSECreatePartialIndexAsync: lib.symSE_create_partial_index.async,
    symSEMergePartialIndexAsync: lib.symSE_merge_partial_index.async,
    symSEIndexRealTimeAsync: lib.symSE_index_realtime.async,
    symSEMergeTempIndexAsync: lib.symSE_merge_temp_index.async,
    symSEClearTempIndexAsync: lib.symSE_clear_temp_index.async,
    symSESearchAsync: lib.symSE_search.async,
    symSEDeleteMessagesAsync: lib.symSE_delete_messages.async,
    symSECommitIndexAsync: lib.symSE_commit_index.async,
    symSEFreeResultAsync: lib.symSE_free_results.async,
    symSEGetLastMessageTimestampAsync: lib.symSE_get_last_message_timestamp.async,
};

export { libSymphonySearch };
