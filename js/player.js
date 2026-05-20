// player.js — Playback control: start, pause, stop, seek, progress, Media Session
(function(PR) {
  'use strict';

  // ---- Media Session API (锁屏/通知栏播放控制) ----
  PR._setupMediaSession = function() {
    if (!('mediaSession' in navigator)) return;
    var title = '';
    if (PR.currentEpId) {
      var ep = PR.episodes.find(function(e) { return e.id === PR.currentEpId; });
      title = ep ? ep.title : '';
    }
    title = title || PR.elTitle.value.trim() || '磨耳朵';

    navigator.mediaSession.metadata = new MediaMetadata({
      title: title,
      artist: '磨耳朵 · Podcast Reader',
      album: '播客集',
      artwork: [{ src: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="100" fill="#f08060"/><text x="256" y="340" text-anchor="middle" font-size="280" fill="white">🎧</text></svg>'), sizes: '512x512', type: 'image/svg+xml' }]
    });

    navigator.mediaSession.setActionHandler('play', function() { PR.startPlayback(); });
    navigator.mediaSession.setActionHandler('pause', function() { PR.pausePlayback(); });
    navigator.mediaSession.setActionHandler('previoustrack', function() { PR.seekByChars(-200); });
    navigator.mediaSession.setActionHandler('nexttrack', function() { PR.seekByChars(200); });
    navigator.mediaSession.setActionHandler('seekto', function(d) {
      if (d.seekTime != null && PR.totalChars) {
        var cps = 4 * PR.getSpeed();
        PR.seekToChar(Math.round(d.seekTime * cps));
      }
    });
  };

  PR.startPlayback = function() {
    if (PR.isPlaying) return;
    var text = PR.elText.textContent || '';
    if (!text.trim()) { PR.toast('请先输入文字内容'); return; }
    if (speechSynthesis.paused) {
      // Rewind on resume
      if (PR.rewindSeconds > 0) {
        var cps = 4 * PR.getSpeed();
        var rewindChars = Math.round(PR.rewindSeconds * cps);
        PR.charProgress = Math.max(0, PR.charProgress - rewindChars);
        // Adjust wordIndex
        for (var i = 0; i < PR.words.length; i++) {
          if (PR.words[i].charEnd > PR.charProgress) { PR.wordIndex = i; break; }
        }
      }
      speechSynthesis.resume();
      PR.isPlaying = true;
      PR.updatePlayButton();
      return;
    }
    if (PR.words.length === 0 || PR.totalChars !== text.length) PR.resetWords();
    if (!PR.words.length) { PR.toast('没有可朗读的内容'); return; }
    var si = 0;
    if (PR.charProgress > 0 && PR.charProgress < PR.totalChars) {
      for (var i = 0; i < PR.words.length; i++) {
        if (PR.words[i].charEnd > PR.charProgress) { si = i; break; }
      }
    }
    PR.isPlaying = true;
    PR.updatePlayButton();
    PR.stats.sessionCount++;
    PR.saveSettings();
    PR._clearResumePoint();

    var cfg = PR.loadAiConfig();
    PR.aiMode = cfg.mode || null;
    if (PR.aiMode) {
      PR.aiAudioBlobs = [];
      PR._chunkSeq = (PR._chunkSeq || 0) + 1; // increment sequence to invalidate stale chunks
      PR._setupMediaSession();
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
      PR.speakAiChunk(si);
    } else {
      PR._setupMediaSession();
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
      PR.speakWord(si);
    }
  };

  PR.pausePlayback = function() {
    PR.isPlaying = false;
    speechSynthesis.pause();
    if (PR.aiAudio) PR.aiAudio.pause();
    PR.updatePlayButton();
  };

  PR.stopPlayback = function() {
    PR.isPlaying = false;
    speechSynthesis.cancel();
    PR.currentUtterance = null;

    // Stop Edge TTS WebSocket properly
    if (PR.edgeTTS._api) { PR.edgeTTS._api.stop(); PR.edgeTTS._api = null; }
    if (PR.edgeTTS.ws) {
      try {
        if (PR.edgeTTS.ws.readyState === WebSocket.OPEN || PR.edgeTTS.ws.readyState === WebSocket.CONNECTING)
          PR.edgeTTS.ws.close();
      } catch(e) {}
      PR.edgeTTS.ws = null;
    }
    if (PR.edgeTTS.audioEl) { PR.edgeTTS.audioEl.pause(); PR.edgeTTS.audioEl = null; }

    if (PR.aiAudio) { PR.aiAudio.pause(); PR.aiAudio = null; }
    if ('mediaSession' in navigator) { navigator.mediaSession.playbackState = 'none'; navigator.mediaSession.metadata = null; }
    if (PR._sleepTimer) { clearTimeout(PR._sleepTimer); PR._sleepTimer = null; PR.elSleepBadge.style.display = 'none'; }
    if (PR._sleepRemaining) { clearInterval(PR._sleepRemaining); PR._sleepRemaining = null; }

    // Save resume point
    if (PR.totalChars && PR.charProgress > 0) PR._saveResumePoint();

    // Limit memory: keep only last 20 chunks
    if (PR.aiAudioBlobs && PR.aiAudioBlobs.length > 20) {
      PR.aiAudioBlobs = PR.aiAudioBlobs.slice(-20);
    }
    // Don't clear blobs on stop so export still works; user clears by starting new playback

    PR.updatePlayButton();
    PR.clearHighlight();
    PR.renderAnnotationMarks();
  };

  PR.seekToChar = function(tc) {
    PR.seekByChars(Math.max(0, Math.min(PR.totalChars, tc)) - PR.charProgress);
  };

  PR.seekByChars = function(dc) {
    if (!PR.words.length) { PR.resetWords(); if (!PR.words.length) return; }
    var wp = PR.isPlaying;
    if (PR.isPlaying) {
      speechSynthesis.cancel();
      PR.currentUtterance = null;
      // Stop Edge TTS if active
      if (PR.edgeTTS._api) { PR.edgeTTS._api.stop(); PR.edgeTTS._api = null; }
      if (PR.aiAudio) { PR.aiAudio.pause(); PR.aiAudio = null; }
    }
    PR.charProgress = Math.max(0, Math.min(PR.totalChars, PR.charProgress + dc));
    var ni = 0;
    for (var i = 0; i < PR.words.length; i++) {
      if (PR.words[i].charEnd > PR.charProgress) { ni = i; break; }
      ni = i;
    }
    PR.wordIndex = ni;
    PR.updateProgressUI();
    PR.updateKaraoke();
    if (PR.words[ni]) PR.highlightWordRange(PR.words[ni].charStart, PR.words[ni].charEnd);
    if (wp) {
      PR.isPlaying = true;
      // Invalidate any stale AI chunk
      PR._chunkSeq = (PR._chunkSeq || 0) + 1;
      setTimeout(function() {
        if (!PR.isPlaying) return;
        PR.aiMode ? PR.speakAiChunk(ni) : PR.speakWord(ni);
      }, 50);
    } else {
      PR.isPlaying = false;
      PR.updatePlayButton();
    }
  };

  PR.updatePlayButton = function() {
    PR.elBtnPlay.innerHTML = PR.isPlaying ? '&#10074;&#10074;' : '&#9654;';
  };

  PR.updateProgressUI = function() {
    if (!PR.totalChars) {
      PR.elProgressFill.style.width = '0%';
      PR.elTimeDisplay.textContent = '--:-- / --:--';
      return;
    }
    PR.elProgressFill.style.width = Math.min(100, Math.round(PR.charProgress / PR.totalChars * 100)) + '%';
    var cps = 4 * PR.getSpeed();
    PR.elTimeDisplay.textContent = PR.formatTime(PR.charProgress / cps) + ' / ' + PR.formatTime(PR.totalChars / cps);
  };

  PR.updateStats = function() {
    if (PR.totalChars) PR.stats.totalCharsListened += PR.charProgress;
    var cps = 4 * PR.getSpeed();
    if (PR.totalChars) PR.stats.totalSeconds += PR.charProgress / cps;
    PR.saveSettings();
  };

  // Episode management
  PR.renderEpisodeList = function() {
    PR.elEpList.innerHTML = '';
    if (!PR.episodes.length) {
      PR.elEpList.innerHTML = '<div id="no-episodes">还没有保存的播客集<br>粘贴文字或拖入文件后点击「保存」</div>';
      return;
    }

    // Filter by search query
    var query = (PR._epSearchQuery || '').toLowerCase();
    var filtered = PR.episodes;
    if (query) {
      filtered = PR.episodes.filter(function(ep) {
        return (ep.title || '').toLowerCase().indexOf(query) >= 0 ||
               (ep.content || '').toLowerCase().indexOf(query) >= 0 ||
               (ep.tags || []).some(function(t) { return t.toLowerCase().indexOf(query) >= 0; });
      });
    }

    // Sort
    var sortBy = PR._epSort || 'newest';
    if (sortBy === 'alpha') {
      filtered = filtered.slice().sort(function(a, b) { return (a.title || '').localeCompare(b.title || '', 'zh'); });
    } else if (sortBy === 'progress') {
      filtered = filtered.slice().sort(function(a, b) { return (b.progress || 0) - (a.progress || 0); });
    } else {
      // newest first (default)
    }

    if (filtered.length === 0 && query) {
      PR.elEpList.innerHTML = '<div class="bm-empty">没有匹配的播客集<br><small style="color:var(--text-dim)">试试其他关键词</small></div>';
      return;
    }

    filtered.forEach(function(ep) {
      var c = document.createElement('div');
      c.className = 'ep-card' + (ep.id === PR.currentEpId ? ' active' : '');
      var tagsHtml = '';
      if (ep.tags && ep.tags.length) {
        tagsHtml = ' <span class="ep-tags">' + ep.tags.map(function(t) { return '<span class="ep-tag">' + PR.esc(t) + '</span>'; }).join('') + '</span>';
      }
      var progHtml = '';
      if (ep.progress) {
        progHtml = ' <span class="ep-progress" title="已读 ' + ep.progress + '%">' + ep.progress + '%</span>';
      }
      c.innerHTML = '<div class="ep-info"><div class="ep-title">' + PR.esc(ep.title || '未命名') + tagsHtml + '</div>' +
        '<div class="ep-meta">' + PR.esc(ep.createdAt || '') + ' · ' + PR.charCount(ep.content) + progHtml + '</div></div>' +
        '<button class="ep-del" data-id="' + ep.id + '" title="删除">&times;</button>';
      c.addEventListener('click', function(e) {
        if (e.target.classList.contains('ep-del')) return;
        PR.loadEpisode(ep.id);
      });
      c.querySelector('.ep-del').addEventListener('click', function(e) {
        e.stopPropagation();
        PR.deleteEpisode(ep.id);
      });
      PR.elEpList.appendChild(c);
    });
  };

  // Save reading progress for current episode
  PR._saveProgress = function() {
    if (!PR.currentEpId || !PR.totalChars) return;
    var idx = PR.episodes.findIndex(function(e) { return e.id === PR.currentEpId; });
    if (idx >= 0) {
      PR.episodes[idx].progress = Math.round(PR.charProgress / PR.totalChars * 100);
      PR.saveEpisodes();
    }
  };

  // Save resume point for next session (auto-resume)
  PR._saveResumePoint = function() {
    if (!PR.totalChars || PR.charProgress === 0) return;
    localStorage.setItem('pr-resume', JSON.stringify({
      epId: PR.currentEpId,
      charProgress: PR.charProgress,
      title: PR.elTitle ? PR.elTitle.value.trim() : '',
      text: PR.elText ? (PR.elText.textContent || '').slice(0, 200) : ''
    }));
  };

  PR._clearResumePoint = function() {
    localStorage.removeItem('pr-resume');
  };

  PR.loadEpisode = function(id) {
    PR.stopPlayback();
    var ep = PR.episodes.find(function(e) { return e.id === id; });
    if (!ep) return;
    PR.currentEpId = ep.id;
    PR.elTitle.value = ep.title || '';
    PR.elText.textContent = ep.content || '';
    PR.bookmarks = ep.bookmarks || [];
    PR.annotations = ep.annotations || [];
    PR.renderEpisodeList();
    PR.resetWords();
    PR.updateProgressUI();
    PR.renderBookmarkDots();
    PR.renderAnnotationMarks();
    PR.applyReadingSettings();
    if (window.innerWidth <= 700) PR.elSidebar.classList.add('collapsed');
    PR.toast('已加载');
  };

  PR.saveCurrentEpisode = function() {
    var content = PR.elText.textContent || '';
    var title = PR.elTitle.value.trim() || '未命名';
    if (!content.trim()) { PR.toast('请先输入文字内容'); return; }
    if (PR.currentEpId !== null) {
      var idx = PR.episodes.findIndex(function(e) { return e.id === PR.currentEpId; });
      if (idx >= 0) {
        PR.episodes[idx].title = title;
        PR.episodes[idx].content = content;
        PR.episodes[idx].bookmarks = PR.bookmarks;
        PR.episodes[idx].annotations = PR.annotations;
        PR.episodes[idx].updatedAt = new Date().toLocaleString('zh-CN');
        if (PR.totalChars) PR.episodes[idx].progress = Math.round(PR.charProgress / PR.totalChars * 100);
      }
    } else {
      var ep = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        title: title, content: content,
        bookmarks: PR.bookmarks, annotations: PR.annotations,
        tags: [],
        createdAt: new Date().toLocaleString('zh-CN'),
        updatedAt: new Date().toLocaleString('zh-CN'),
        progress: 0
      };
      PR.episodes.unshift(ep);
      PR.currentEpId = ep.id;
    }
    PR.saveEpisodes();
    PR.renderEpisodeList();
    PR.saveDraft();
    PR.toast('已保存');
  };

  // ---- Undo delete ----
  PR.deleteEpisode = function(id) {
    var ep = PR.episodes.find(function(e) { return e.id === id; });
    if (!ep) return;
    var wasCurrent = PR.currentEpId === id;

    // Remove immediately but remember for undo
    PR.stopPlayback();
    PR.episodes = PR.episodes.filter(function(e) { return e.id !== id; });
    if (wasCurrent) {
      PR.currentEpId = null;
      PR.elTitle.value = '';
      PR.elText.textContent = '';
      PR.bookmarks = [];
      PR.annotations = [];
    }
    PR.saveEpisodes();
    PR.renderEpisodeList();
    PR.resetWords();
    PR.updateProgressUI();
    PR.renderBookmarkDots();

    // Undo toast
    PR.elToast.innerHTML = '已删除 <span id="undo-delete" style="color:var(--play);cursor:pointer;text-decoration:underline">撤销</span>';
    PR.elToast.classList.add('show');
    clearTimeout(PR.toastTimer);
    PR.$('#undo-delete').addEventListener('click', function() {
      PR.episodes.unshift(ep);
      if (wasCurrent) PR.currentEpId = ep.id;
      PR.saveEpisodes();
      PR.renderEpisodeList();
      if (wasCurrent) PR.loadEpisode(ep.id);
      PR.elToast.classList.remove('show');
    });
    PR.toastTimer = setTimeout(function() { PR.elToast.classList.remove('show'); }, 5000);
  };

  PR.newEpisode = function() {
    PR.stopPlayback();
    PR.currentEpId = null;
    PR.elTitle.value = '';
    PR.elText.textContent = '';
    PR.bookmarks = [];
    PR.annotations = [];
    PR.renderEpisodeList();
    PR.resetWords();
    PR.updateProgressUI();
    PR.renderBookmarkDots();
    PR.saveDraft();
    if (window.innerWidth <= 700) PR.elSidebar.classList.add('collapsed');
    PR.elText.focus();
  };

  PR.playNextEpisode = function() {
    if (!PR.autoNext || !PR.currentEpId) return;
    var idx = PR.episodes.findIndex(function(e) { return e.id === PR.currentEpId; });
    if (idx < 0 || idx >= PR.episodes.length - 1) return;
    PR.loadEpisode(PR.episodes[idx + 1].id);
    setTimeout(PR.startPlayback, 200);
    PR.toast('自动播放下一集');
  };

  // Play all episodes in sequence starting from the first (or sorted) episode
  PR.playAll = function() {
    if (!PR.episodes.length) { PR.toast('没有可播放的播客集'); return; }
    // Use current sort order
    var filtered = PR.episodes.slice();
    var sortBy = PR._epSort || 'newest';
    if (sortBy === 'alpha') {
      filtered.sort(function(a, b) { return (a.title || '').localeCompare(b.title || '', 'zh'); });
    } else if (sortBy === 'progress') {
      filtered.sort(function(a, b) { return (b.progress || 0) - (a.progress || 0); });
    }
    var first = filtered[0];
    if (!PR.autoNext) {
      PR.autoNext = true;
      PR.elBtnAutoNext.classList.add('active');
      PR.saveSettings();
    }
    PR.loadEpisode(first.id);
    setTimeout(PR.startPlayback, 300);
    PR.toast('全部播放 · 共 ' + filtered.length + ' 集');
  };

  // ---- Episode tags ----
  PR._epSearchQuery = '';
  PR._epSort = 'newest';

  PR.filterEpisodes = function(query) {
    PR._epSearchQuery = query || '';
    PR.renderEpisodeList();
  };

  PR.sortEpisodes = function(sortBy) {
    PR._epSort = sortBy;
    PR.renderEpisodeList();
  };

  PR.showTagEditor = function() {
    if (!PR.currentEpId) { PR.toast('请先保存播客集'); return; }
    var ep = PR.episodes.find(function(e) { return e.id === PR.currentEpId; });
    if (!ep) return;
    var currentTags = ep.tags || [];
    var allTagsHtml = PR.tags.map(function(t) {
      var active = currentTags.indexOf(t.name) >= 0;
      return '<span class="tag-chip' + (active ? ' active' : '') + '" data-tag="' + PR.esc(t.name) + '" style="background:' + (active ? t.color : 'var(--surface2)') + '">' + PR.esc(t.name) + '</span>';
    }).join('');

    PR.elModal.innerHTML =
      '<h3>标签管理</h3>' +
      '<div style="margin-bottom:8px"><input type="text" id="new-tag-input" placeholder="输入新标签…" style="width:100%"></div>' +
      '<div id="tag-chips" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">' + (allTagsHtml || '<small style="color:var(--text-dim)">还没有标签，在上方创建</small>') + '</div>' +
      '<div class="row"><button id="btn-save-tags" style="flex:1">保存</button><button class="secondary" id="btn-close-modal">取消</button></div>';
    PR.elModalOverlay.classList.add('show');

    // New tag input
    PR.$('#new-tag-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        var name = PR.$('#new-tag-input').value.trim();
        if (!name) return;
        if (!PR.tags.find(function(t) { return t.name === name; })) {
          var colors = ['#e0556a','#f08060','#60d0a0','#6090d0','#d0a060','#a060d0'];
          PR.tags.push({ id: Date.now().toString(36), name: name, color: colors[PR.tags.length % colors.length] });
        }
        if (currentTags.indexOf(name) < 0) currentTags.push(name);
        PR.saveSettings();
        PR.showTagEditor();
      }
    });

    // Toggle tags
    setTimeout(function() {
      PR.elModal.querySelectorAll('.tag-chip').forEach(function(chip) {
        chip.addEventListener('click', function() {
          var tn = chip.dataset.tag;
          var idx = currentTags.indexOf(tn);
          if (idx >= 0) currentTags.splice(idx, 1); else currentTags.push(tn);
          PR.showTagEditor();
        });
      });
    }, 50);

    PR.$('#btn-save-tags').addEventListener('click', function() {
      ep.tags = currentTags.slice();
      PR.saveEpisodes();
      PR.renderEpisodeList();
      PR.elModalOverlay.classList.remove('show');
      PR.toast('标签已更新');
    });
    PR.$('#btn-close-modal').addEventListener('click', function() { PR.elModalOverlay.classList.remove('show'); });
  };

})(window.PR);
