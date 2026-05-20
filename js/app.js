// app.js — DOM references, event bindings, and initialization
(function(PR) {
  'use strict';

  // ---- DOM references ----
  PR.elTitle = PR.$('#title-input');
  PR.elText = PR.$('#text-display');
  PR.elDropOverlay = PR.$('#drop-overlay');
  PR.elVoiceSel = PR.$('#voice-select');
  PR.elBtnPlay = PR.$('#btn-play');
  PR.elBtnRew = PR.$('#btn-rew');
  PR.elBtnFwd = PR.$('#btn-fwd');
  PR.elBtnSave = PR.$('#btn-save');
  PR.elBtnNew = PR.$('#btn-new-ep');
  PR.elBtnAutoNext = PR.$('#btn-auto-next');
  PR.elBtnSortEp = PR.$('#btn-sort-ep');
  PR.elBtnTagEp = PR.$('#btn-tag-ep');
  PR.elEpSearch = PR.$('#ep-search');
  PR.elEpSortWrap = PR.$('#ep-sort-wrap');
  PR.elProgressBar = PR.$('#progress-bar');
  PR.elBtnToggle = PR.$('#btn-toggle-sidebar');
  PR.elBtnMode = PR.$('#btn-mode');
  PR.elBtnSettings = PR.$('#btn-settings');
  PR.elBtnSleep = PR.$('#btn-sleep');
  PR.elBtnFeatures = PR.$('#btn-features');
  PR.elBtnBookmark = PR.$('#btn-bookmark');
  PR.elBtnAnnotate = PR.$('#btn-annotate');
  PR.elBtnFocus = PR.$('#btn-focus');
  PR.elBtnKaraoke = PR.$('#btn-karaoke');
  PR.elBtnSmartSpeed = PR.$('#btn-smart-speed');
  PR.elBtnExportMp3 = PR.$('#btn-export-mp3');
  PR.elBtnImportFile = PR.$('#btn-import-file');
  PR.elFileInput = PR.$('#file-input');
  PR.elBtnInstall = PR.$('#btn-install');
  PR.elSleepBadge = PR.$('#sleep-badge');
  PR.elSidebar = PR.$('#sidebar');
  PR.elEpList = PR.$('#episode-list');
  PR.elProgressFill = PR.$('#progress-fill');
  PR.elTimeDisplay = PR.$('#time-display');
  PR.elToast = PR.$('#toast');
  PR.elModalOverlay = PR.$('#modal-overlay');
  PR.elModal = PR.$('#modal');
  PR.elBmPanel = PR.$('#bookmark-panel');
  PR.elAnnTooltip = PR.$('#ann-tooltip');
  PR.elAnnToolbar = PR.$('#ann-toolbar');
  PR.elStatsPanel = PR.$('#stats-panel');
  PR.elStatsClose = PR.$('#stats-close');
  PR.elKaraokeLine = PR.$('#karaoke-line');

  // ---- Event Bindings ----
  PR.elBtnPlay.addEventListener('click', function() {
    PR.isPlaying ? PR.pausePlayback() : PR.startPlayback();
  });

  PR.elBtnRew.addEventListener('click', function() {
    PR.seekByChars(-Math.round(15 * 4 * PR.getSpeed()));
  });

  PR.elBtnFwd.addEventListener('click', function() {
    PR.seekByChars(Math.round(15 * 4 * PR.getSpeed()));
  });

  PR.elBtnSave.addEventListener('click', PR.saveCurrentEpisode);
  PR.elBtnNew.addEventListener('click', PR.newEpisode);

  PR.elBtnToggle.addEventListener('click', function() {
    PR.elSidebar.classList.toggle('collapsed');
  });

  PR.$('#btn-close-sidebar').addEventListener('click', function() {
    PR.elSidebar.classList.add('collapsed');
  });

  PR.elBtnMode.addEventListener('click', function() {
    document.body.classList.toggle('light');
    PR.saveSettings();
  });

  PR.elBtnSettings.addEventListener('click', PR.showSettings);
  PR.elBtnFeatures.addEventListener('click', PR.showFeatures);
  PR.elBtnSleep.addEventListener('click', PR.showSleepMenu);

  // ---- Sidebar search & sort ----
  if (PR.elEpSearch) {
    PR.elEpSearch.addEventListener('input', function() {
      PR.filterEpisodes(PR.elEpSearch.value);
    });
    PR.elEpSearch.addEventListener('focus', function() {
      if (window.innerWidth <= 700) PR.elSidebar.classList.remove('collapsed');
    });
  }

  if (PR.elBtnSortEp) {
    PR.elBtnSortEp.addEventListener('click', function() {
      PR.elEpSortWrap.style.display = PR.elEpSortWrap.style.display === 'none' ? 'block' : 'none';
    });
    // Toggle sort display
    PR.elEpSortWrap = PR.elEpSortWrap || document.createElement('div');
  }

  PR.$$('.ep-sort-opt').forEach(function(o) {
    o.addEventListener('click', function() {
      PR.$$('.ep-sort-opt').forEach(function(x) { x.style.color = 'var(--text-dim)'; });
      o.style.color = 'var(--accent)';
      PR.sortEpisodes(o.dataset.sort);
    });
  });

  // ---- Tag editor ----
  if (PR.elBtnTagEp) {
    PR.elBtnTagEp.addEventListener('click', function() {
      PR.showTagEditor();
    });
  }

  PR.elBtnBookmark.addEventListener('click', function() {
    if (!PR.totalChars) return;
    var l = prompt('书签备注：');
    PR.addBookmark(l || '');
    PR.showBookmarkPanel();
  });

  PR.elBtnAnnotate.addEventListener('click', function() {
    var note = prompt('批注内容：');
    if (note) PR.addAnnotation(note);
  });

  PR.elBtnFocus.addEventListener('click', PR.toggleFocusMode);
  PR.elBtnKaraoke.addEventListener('click', PR.toggleKaraokeMode);

  PR.elBtnSmartSpeed.addEventListener('click', function() {
    PR.smartSpeed = !PR.smartSpeed;
    PR.elBtnSmartSpeed.classList.toggle('active', PR.smartSpeed);
    PR.saveSettings();
    PR.toast(PR.smartSpeed ? '已开启紧凑模式' : '已关闭紧凑模式');
  });

  PR.elBtnExportMp3.addEventListener('click', PR.exportMp3);

  PR.elBtnImportFile.addEventListener('click', function() { PR.elFileInput.click(); });
  PR.elFileInput.addEventListener('change', function() {
    if (PR.elFileInput.files.length) {
      PR.handleFile(PR.elFileInput.files[0]);
      PR.elFileInput.value = '';
    }
  });

  // PWA Install button — works across all browsers
  if (PR.elBtnInstall) {
    PR.elBtnInstall.addEventListener('click', function() {
      console.log('[install] button clicked, _pwa=', !!window._pwa);
      PR.showInstallGuide();
      if (window._pwa) {
        try {
          window._pwa.prompt();
          window._pwa.userChoice.then(function(r) {
            if (r.outcome === 'accepted') {
              PR.elBtnInstall.style.display = 'none';
              PR.toast('安装成功！');
              if (PR.elModalOverlay) PR.elModalOverlay.classList.remove('show');
            }
          }).catch(function() {});
        } catch(e) {}
      }
    });
  }

  PR.elBtnAutoNext.addEventListener('click', function() {
    PR.autoNext = !PR.autoNext;
    PR.elBtnAutoNext.classList.toggle('active', PR.autoNext);
    PR.saveSettings();
    PR.toast(PR.autoNext ? '已开启连续播放' : '已关闭连续播放');
  });

  // Speed presets
  PR.$$('#speed-presets .speed-preset').forEach(function(b) {
    b.addEventListener('click', function() {
      PR.$$('#speed-presets .speed-preset').forEach(function(x) { x.classList.remove('active'); });
      b.classList.add('active');
      PR.saveSettings();
      // Update aria-checked
      PR.$$('#speed-presets .speed-preset').forEach(function(x) { x.setAttribute('aria-checked', 'false'); });
      b.setAttribute('aria-checked', 'true');
      if (PR.currentUtterance && PR.isPlaying && !PR.aiMode) {
        var idx = PR.wordIndex;
        speechSynthesis.cancel();
        PR.currentUtterance = null;
        PR.isPlaying = true;
        setTimeout(function() { PR.speakWord(idx); }, 30);
      }
    });
  });

  // Progress bar click-to-seek
  PR.elProgressBar.addEventListener('click', function(e) {
    if (!PR.totalChars) return;
    var r = e.currentTarget.getBoundingClientRect();
    PR.seekToChar(Math.round((e.clientX - r.left) / r.width * PR.totalChars));
  });

  PR.elVoiceSel.addEventListener('change', PR.saveSettings);

  // Draft auto-save
  var draftSaveTO;
  PR.elTitle.addEventListener('input', function() {
    clearTimeout(draftSaveTO);
    draftSaveTO = setTimeout(PR.saveDraft, 500);
  });

  PR.elText.addEventListener('input', function() {
    clearTimeout(draftSaveTO);
    draftSaveTO = setTimeout(function() {
      PR.saveDraft();
      PR.resetWords();
      PR.updateProgressUI();
      PR.renderBookmarkDots();
      PR.renderAnnotationMarks();
    }, 500);
  });

  PR.elText.addEventListener('focus', function() {
    if (!PR.focusMode) PR.clearHighlight();
  });

  // Text selection for annotation
  PR.elText.addEventListener('mouseup', function() {
    var sel = window.getSelection();
    if (!sel || !sel.toString().trim()) { PR.elAnnToolbar.style.display = 'none'; return; }
    var range = sel.getRangeAt(0);
    if (!PR.elText.contains(range.commonAncestorContainer)) { PR.elAnnToolbar.style.display = 'none'; return; }
    var rect = range.getBoundingClientRect();
    PR.elAnnToolbar.style.display = 'block';
    PR.elAnnToolbar.style.left = (rect.left + rect.width / 2 - 40) + 'px';
    PR.elAnnToolbar.style.top = (rect.top - 30) + 'px';
    PR.elAnnToolbar.onclick = function() {
      var note = prompt('批注内容：');
      if (note) { PR.addAnnotation(note); PR.elAnnToolbar.style.display = 'none'; }
    };
  });

  document.addEventListener('click', function(e) {
    if (e.target !== PR.elAnnToolbar && !PR.elAnnToolbar.contains(e.target))
      PR.elAnnToolbar.style.display = 'none';
  });

  // ---- AB Loop ----
  PR._setABLoopStart = function() {
    if (!PR.totalChars) return;
    if (!PR.loopAB) PR.loopAB = { charStart: PR.charProgress, charEnd: PR.totalChars };
    else PR.loopAB.charStart = PR.charProgress;
    PR.toast('A-B 循环起点已设置');
  };

  PR._setABLoopEnd = function() {
    if (!PR.totalChars) return;
    if (!PR.loopAB) PR.loopAB = { charStart: 0, charEnd: PR.charProgress };
    else PR.loopAB.charEnd = PR.charProgress;
    PR.toast('A-B 循环终点已设置（按 \\ 取消）');
  };

  PR._clearABLoop = function() {
    PR.loopAB = null;
    PR.toast('A-B 循环已取消');
  };

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // Don't handle shortcuts when typing in input/textarea fields
    var tag = (document.activeElement || {}).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (document.activeElement === PR.elText || document.activeElement === PR.elTitle) return;
    switch (e.key) {
      case ' ': e.preventDefault(); PR.isPlaying ? PR.pausePlayback() : PR.startPlayback(); break;
      case 'ArrowLeft': e.preventDefault(); PR.elBtnRew.click(); break;
      case 'ArrowRight': e.preventDefault(); PR.elBtnFwd.click(); break;
      case '[': e.preventDefault(); PR._setABLoopStart(); break;
      case ']': e.preventDefault(); PR._setABLoopEnd(); break;
      case '\\': e.preventDefault(); PR._clearABLoop(); break;
      case 'Escape': PR.stopPlayback(); PR.elAnnToolbar.style.display = 'none'; break;
      case 'b': e.preventDefault(); PR.addBookmark(''); break;
      case 'f': e.preventDefault(); PR.toggleFocusMode(); break;
      case 'k': e.preventDefault(); PR.toggleKaraokeMode(); break;
      case 'h': e.preventDefault(); if (typeof PR.showTutorial === 'function') PR.showTutorial(0); break;
    }
  });

  // Modal overlay click-outside
  PR.elModalOverlay.addEventListener('click', function(e) {
    if (e.target === PR.elModalOverlay) PR.elModalOverlay.classList.remove('show');
  });

  PR.elStatsClose.addEventListener('click', function() { PR.elStatsPanel.classList.remove('show'); });

  // Close panels on outside click
  document.addEventListener('click', function(e) {
    if (!PR.elBmPanel.contains(e.target) && e.target !== PR.elBtnBookmark)
      PR.elBmPanel.classList.remove('show');
    if (!PR.elAnnTooltip.contains(e.target))
      PR.elAnnTooltip.classList.remove('show');
  });

  // Drag & drop
  document.addEventListener('dragover', function(e) {
    e.preventDefault();
    PR.elDropOverlay.classList.add('show');
  });
  document.addEventListener('dragleave', function(e) {
    if (e.target === document.body) PR.elDropOverlay.classList.remove('show');
  });
  document.addEventListener('drop', PR.handleDrop);

  // Paste files
  document.addEventListener('paste', PR.handlePaste);

  // PWA install prompt
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    window._pwa = e;
    setTimeout(function() { if (window._pwa) PR.toast('点击 ⬇ 安装到桌面'); }, 3000);
  });

  // Share Target: 接收 service worker 发来的分享数据
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', async function(evt) {
      if (evt.data && evt.data.type === 'share-target') {
        var shared = evt.data.data;
        if (shared.text && shared.text.trim()) {
          PR.elText.textContent = shared.text.trim();
          if (shared.title) PR.elTitle.value = shared.title;
          PR.stopPlayback();
          PR.currentEpId = null;
          PR.bookmarks = [];
          PR.annotations = [];
          PR.resetWords();
          PR.updateProgressUI();
          PR.renderBookmarkDots();
          PR.toast('已导入分享内容', 3000);
        }
        if (shared.hasFile) {
          var mc = new MessageChannel();
          mc.port1.onmessage = function(e) {
            if (e.data.file) PR.handleFile(e.data.file);
          };
          navigator.serviceWorker.controller.postMessage({ type: 'get-shared-file' }, [mc.port2]);
        }
      }
    });
  }

  // Voice list
  speechSynthesis.addEventListener('voiceschanged', PR.populateVoices);

  // Wake lock
  PR.elBtnPlay.addEventListener('click', async function() {
    try { if ('wakeLock' in navigator) await navigator.wakeLock.request('screen'); } catch(e) {}
  }, { once: true });

  window.addEventListener('beforeunload', PR.saveDraft);

  // URL params (bookmarklet + share target + PWA shortcuts)
  (function() {
    var p = new URLSearchParams(location.search);
    var action = p.get('action');
    var text = p.get('text'), title = p.get('title');

    if (action === 'new') { PR.newEpisode(); return; }
    if (action === 'resume') {
      if (PR.currentEpId && PR.episodes.some(function(e) { return e.id === PR.currentEpId; })) {
        PR.loadEpisode(PR.currentEpId);
      }
      return;
    }
    if (action === 'shared') {
      if (text) {
        PR.elText.textContent = decodeURIComponent(text);
        if (title) PR.elTitle.value = decodeURIComponent(title);
        PR.stopPlayback();
        PR.currentEpId = null;
        PR.bookmarks = [];
        PR.annotations = [];
        PR.resetWords();
        PR.updateProgressUI();
        PR.renderBookmarkDots();
        PR.toast('已导入分享内容', 3000);
      }
      return;
    }
    if (text && !action) {
      PR.elText.textContent = decodeURIComponent(text);
      if (title) PR.elTitle.value = decodeURIComponent(title);
      PR.resetWords();
      PR.updateProgressUI();
      PR.toast('已导入网页内容', 3000);
    }
  })();

  // ---- Initialization ----
  PR.populateVoices();
  PR.loadEpisodes();
  PR.loadDraft();
  PR.loadSettings();
  PR.renderEpisodeList();
  PR.resetWords();
  PR.updateProgressUI();
  PR.renderBookmarkDots();
  PR.renderAnnotationMarks();
  PR.updatePlayButton();

  // Analytics (opt-in, does nothing unless configured)
  if (typeof PR.initAnalytics === 'function') PR.initAnalytics();

  if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
    navigator.serviceWorker.register('sw.js').catch(function() {});
  }

  // Hide install button if already installed as PWA
  if (window.matchMedia('(display-mode: standalone)').matches) {
    PR.elBtnInstall.style.display = 'none';
  }
  window.addEventListener('appinstalled', function() {
    PR.elBtnInstall.style.display = 'none';
  });

  // Tutorial
  if (typeof PR.initTutorial === 'function') PR.initTutorial();

  // Help button
  var elHelpBtn = document.createElement('button');
  elHelpBtn.id = 'help-btn';
  elHelpBtn.title = '使用帮助';
  elHelpBtn.textContent = '?';
  elHelpBtn.setAttribute('aria-label', '使用帮助');
  elHelpBtn.addEventListener('click', function() { PR.showTutorial(0); });
  document.body.appendChild(elHelpBtn);

  // ---- ARIA progress update ----
  var _origUpdateProgress = PR.updateProgressUI;
  PR.updateProgressUI = function() {
    _origUpdateProgress();
    if (!PR.elProgressBar || !PR.totalChars) return;
    var pct = Math.min(100, Math.round(PR.charProgress / PR.totalChars * 100));
    PR.elProgressBar.setAttribute('aria-valuenow', pct);
  };

  // Initial tutorial
  if (!PR.episodes.length && !PR.elText.textContent.trim()) {
    if (typeof PR.showTutorial === 'function') setTimeout(function() { PR.showTutorial(0); }, 500);
  }

  if (!PR.elText.textContent.trim() && !PR.episodes.length) setTimeout(function() { PR.elText.focus(); }, 300);

  console.log('🎧 磨耳朵 v3.3 已就绪');
  console.log('  显示设置 | 发音词典 | 全文搜索 | 标签 | AB循环 | 回退续播 | 撤销删除');
  console.log('  WebDAV同步 | ARIA无障碍 | OpenDyslexic | 阅读进度');

})(window.PR);
