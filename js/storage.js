// storage.js — localStorage persistence
(function(PR) {
  'use strict';

  // ---- Settings ----
  PR.loadSettings = function() {
    try {
      var s = JSON.parse(localStorage.getItem('pr-settings') || '{}');
      if (s.voice) PR.elVoiceSel.value = s.voice;
      if (s.rate) {
        PR.$$('#speed-presets .speed-preset').forEach(function(p) { p.classList.remove('active'); });
        var m = Array.from(PR.$$('#speed-presets .speed-preset')).find(function(p) { return p.dataset.rate === s.rate; });
        if (m) m.classList.add('active');
      }
      if (s.autoNext !== undefined) {
        PR.autoNext = s.autoNext;
        PR.elBtnAutoNext.classList.toggle('active', PR.autoNext);
      }
      if (s.theme === 'light') document.body.classList.add('light');
      if (s.smartSpeed !== undefined) {
        PR.smartSpeed = s.smartSpeed;
        PR.elBtnSmartSpeed.classList.toggle('active', PR.smartSpeed);
      }
      if (s.stats) PR.stats = s.stats;
      // New settings
      if (s.reading) PR.reading = Object.assign(PR.reading, s.reading);
      if (s.rewindSeconds !== undefined) PR.rewindSeconds = s.rewindSeconds;
      if (s.pronDict) PR.pronDict = s.pronDict;
      if (s.tags) PR.tags = s.tags;
      if (s.syncConfig) PR.syncConfig = s.syncConfig;
      PR.applyReadingSettings();
    } catch(e) {}
  };

  PR.saveSettings = function() {
    var s = {
      voice: PR.elVoiceSel.value,
      rate: PR.getSpeed().toFixed(2),
      autoNext: PR.autoNext,
      smartSpeed: PR.smartSpeed,
      theme: document.body.classList.contains('light') ? 'light' : 'dark',
      stats: PR.stats,
      reading: PR.reading,
      rewindSeconds: PR.rewindSeconds,
      pronDict: PR.pronDict,
      tags: PR.tags,
      syncConfig: PR.syncConfig || null
    };
    localStorage.setItem('pr-settings', JSON.stringify(s));
  };

  // ---- Episodes ----
  PR.loadEpisodes = function() {
    try { PR.episodes = JSON.parse(localStorage.getItem('pr-episodes') || '[]'); }
    catch(e) { PR.episodes = []; }
  };

  PR.saveEpisodes = function() {
    localStorage.setItem('pr-episodes', JSON.stringify(PR.episodes));
  };

  // ---- Draft ----
  PR.loadDraft = function() {
    var d = localStorage.getItem('pr-draft');
    if (!d) return;
    try {
      var o = JSON.parse(d);
      PR.elTitle.value = o.title || '';
      PR.elText.textContent = o.content || '';
      PR.currentEpId = o.epId || null;
      if (o.bookmarks) PR.bookmarks = o.bookmarks;
      if (o.annotations) PR.annotations = o.annotations || [];
    } catch(e) {}
  };

  PR.saveDraft = function() {
    localStorage.setItem('pr-draft', JSON.stringify({
      title: PR.elTitle.value,
      content: PR.elText.textContent || '',
      epId: PR.currentEpId,
      bookmarks: PR.bookmarks,
      annotations: PR.annotations
    }));
  };

  // ---- AI config ----
  PR.loadAiConfig = function() {
    try { return JSON.parse(localStorage.getItem('pr-ai') || '{}'); }
    catch(e) { return {}; }
  };

  PR.saveAiConfig = function(cfg) {
    localStorage.setItem('pr-ai', JSON.stringify(cfg));
    PR.aiMode = cfg.mode || null;
  };

})(window.PR);
