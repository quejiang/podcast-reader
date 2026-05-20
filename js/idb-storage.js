// idb-storage.js — IndexedDB persistence for large data (episodes), with localStorage fallback
(function(PR) {
  'use strict';

  var DB_NAME = 'pr-db';
  var DB_VERSION = 1;
  var STORE = 'episodes';
  var MIGRATED_KEY = 'pr-idb-migrated';

  var _db = null; // cached open db

  function openDB() {
    if (_db) return Promise.resolve(_db);
    return new Promise(function(resolve, reject) {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function(e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = function(e) {
        _db = e.target.result;
        _db.onclose = function() { _db = null; };
        resolve(_db);
      };
      req.onerror = function(e) { reject(e.target.error); };
      req.onblocked = function() { console.warn('[磨耳朵] IDB blocked — another tab may be open'); };
    });
  }

  // Save episodes to IndexedDB, with localStorage fallback
  PR.saveEpisodesIDB = function() {
    // Always keep localStorage as fallback backup
    try { localStorage.setItem('pr-episodes', JSON.stringify(PR.episodes)); } catch(e) {}

    openDB().then(function(db) {
      var tx = db.transaction(STORE, 'readwrite');
      var store = tx.objectStore(STORE);
      // Clear and re-insert all
      store.clear();
      PR.episodes.forEach(function(ep) { store.put(ep); });
    }).catch(function(e) {
      console.warn('[磨耳朵] IndexedDB save failed, using localStorage only', e);
    });
  };

  // Load episodes from IndexedDB, falling back to localStorage
  PR.loadEpisodesIDB = function() {
    return openDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(STORE, 'readonly');
        var store = tx.objectStore(STORE);
        var req = store.getAll();
        req.onsuccess = function() {
          if (req.result && req.result.length > 0) {
            PR.episodes = req.result;
            resolve();
          } else {
            reject(new Error('empty'));
          }
        };
        req.onerror = function() { reject(req.error); };
      });
    }).catch(function() {
      // Fallback to localStorage
      try { PR.episodes = JSON.parse(localStorage.getItem('pr-episodes') || '[]'); }
      catch(e) { PR.episodes = []; }
    });
  };

  // Migrate from pure localStorage to IndexedDB, keeping localStorage as backup
  PR.migrateToIDB = function() {
    if (localStorage.getItem(MIGRATED_KEY)) return;
    try {
      var old = JSON.parse(localStorage.getItem('pr-episodes') || '[]');
      if (!old.length) { localStorage.setItem(MIGRATED_KEY, '1'); return; }
      openDB().then(function(db) {
        var tx = db.transaction(STORE, 'readwrite');
        var store = tx.objectStore(STORE);
        old.forEach(function(ep) { store.put(ep); });
        tx.oncomplete = function() {
          localStorage.setItem(MIGRATED_KEY, '1');
          if (typeof PR.toast === 'function') {
            PR.toast(PR.t('idbMigrated'), 3000);
          }
        };
      });
    } catch(e) {
      console.warn('[磨耳朵] IDB migration failed, staying on localStorage', e);
    }
  };

  // Check available storage space and warn if low
  PR.checkStorageQuota = function() {
    if ('storage' in navigator && navigator.storage.estimate) {
      navigator.storage.estimate().then(function(est) {
        if (est.usage && est.quota && est.usage / est.quota > 0.85) {
          if (typeof PR.toast === 'function') {
            PR.toast('存储空间即将用尽，建议导出备份或清理旧播客集', 5000);
          }
        }
      }).catch(function() {});
    }
  };
})(window.PR);
