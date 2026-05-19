// state.js — Global namespace, shared helpers, and all state variables
window.PR = window.PR || {};

(function(PR) {
  'use strict';

  // ---- DOM helpers ----
  PR.$ = function(s) { return document.querySelector(s); };
  PR.$$ = function(s) { return document.querySelectorAll(s); };

  // ---- State ----
  PR.episodes = [];
  PR.currentEpId = null;
  PR.isPlaying = false;
  PR.words = [];
  PR.wordIndex = -1;
  PR.charProgress = 0;
  PR.totalChars = 0;
  PR.currentUtterance = null;
  PR.voices = [];
  PR.toastTimer = null;
  PR.bookmarks = [];
  PR.annotations = [];       // {charStart, charEnd, note, id}
  PR.autoNext = false;
  PR.sleepSeconds = 0;
  PR.sleepInterval = null;
  PR.aiMode = null;
  PR.aiAudio = null;
  PR.aiAudioBlobs = [];
  PR.smartSpeed = true;
  PR.focusMode = false;
  PR.karaokeMode = false;
  PR.stats = { totalCharsListened: 0, totalSeconds: 0, sessionCount: 0 };

  // ---- DOM references (populated by app.js) ----
  // Will be set by app.js init to avoid coupling

  // ---- Utility helpers ----
  PR.esc = function(s) {
    var d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  };

  PR.charCount = function(s) {
    var l = (s || '').replace(/\s/g, '').length;
    if (l < 500) return l + ' 字';
    if (l < 10000) return (l / 1000).toFixed(1) + 'k 字';
    return (l / 10000).toFixed(1) + 'w 字';
  };

  PR.formatTime = function(sec) {
    if (!isFinite(sec) || sec < 0) return '--:--';
    var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  };

  // ---- Speed helper ----
  PR.getSpeed = function() {
    var a = PR.$('#speed-presets .speed-preset.active');
    return a ? parseFloat(a.dataset.rate) : 1;
  };

  PR.getVoice = function() {
    return PR.voices.find(function(v) { return v.voiceURI === PR.elVoiceSel.value; }) || null;
  };

})(window.PR);
