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

    var cfg = PR.loadAiConfig();
    PR.aiMode = cfg.mode || null;
    if (PR.aiMode) {
      PR.aiAudioBlobs = [];
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
    PR.updatePlayButton();
  };

  PR.stopPlayback = function() {
    PR.isPlaying = false;
    speechSynthesis.cancel();
    PR.currentUtterance = null;
    if (PR.aiAudio) { PR.aiAudio.pause(); PR.aiAudio = null; }
    if ('mediaSession' in navigator) { navigator.mediaSession.playbackState = 'none'; navigator.mediaSession.metadata = null; }
    PR.aiAudioBlobs = [];
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
    if (PR.isPlaying) { speechSynthesis.cancel(); PR.currentUtterance = null; }
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
      setTimeout(function() {
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
    PR.episodes.forEach(function(ep) {
      var c = document.createElement('div');
      c.className = 'ep-card' + (ep.id === PR.currentEpId ? ' active' : '');
      c.innerHTML = '<div class="ep-info"><div class="ep-title">' + PR.esc(ep.title || '未命名') + '</div>' +
        '<div class="ep-meta">' + PR.esc(ep.createdAt || '') + ' · ' + PR.charCount(ep.content) + '</div></div>' +
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
    // Auto-close sidebar on mobile
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
      }
    } else {
      var ep = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        title: title, content: content,
        bookmarks: PR.bookmarks, annotations: PR.annotations,
        createdAt: new Date().toLocaleString('zh-CN'),
        updatedAt: new Date().toLocaleString('zh-CN')
      };
      PR.episodes.unshift(ep);
      PR.currentEpId = ep.id;
    }
    PR.saveEpisodes();
    PR.renderEpisodeList();
    PR.saveDraft();
    PR.toast('已保存');
  };

  PR.deleteEpisode = function(id) {
    if (!confirm('确定删除？')) return;
    PR.stopPlayback();
    PR.episodes = PR.episodes.filter(function(e) { return e.id !== id; });
    if (PR.currentEpId === id) {
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
    PR.toast('已删除');
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

})(window.PR);
