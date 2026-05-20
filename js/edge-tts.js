// edge-tts.js — Edge Read Aloud WebSocket TTS
(function(PR) {
  'use strict';

  PR.edgeTTS = {
    cachedVoices: null,
    ws: null,
    audioEl: null,
    _api: null,       // last synthesize() return value for stopPlayback
    _cleanup: null    // cleanup function for current session
  };

  // Default fallback voice list (used before async fetch completes)
  PR.edgeVoices = [
    { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓 (Xiaoxiao) · 女声' },
    { id: 'zh-CN-YunxiNeural', name: '云希 (Yunxi) · 男声' },
    { id: 'zh-CN-YunjianNeural', name: '云健 (Yunjian) · 男声' },
    { id: 'zh-CN-XiaoyiNeural', name: '晓伊 (Xiaoyi) · 女声' },
    { id: 'zh-CN-YunyangNeural', name: '云扬 (Yunyang) · 男声' },
    { id: 'zh-CN-XiaochenNeural', name: '晓辰 (Xiaochen) · 女声' },
    { id: 'zh-TW-HsiaoChenNeural', name: '曉臻 (HsiaoChen) · 女声 (台湾)' },
    { id: 'zh-HK-HiuMaanNeural', name: '曉曼 (HiuMaan) · 女声 (粤语)' }
  ];

  // SpeechSynthesis-style placeholder for edge voices
  PR.edgeTTS.placeholderVoice = function(name, idx) {
    return { name: name, voiceURI: 'edge-' + idx, lang: 'zh-CN', localService: false, default: idx === 0, edgeIndex: idx };
  };

  // Fetch available Edge voices (cached)
  PR.edgeTTS.fetchVoices = function(cb) {
    if (PR.edgeTTS.cachedVoices) {
      if (cb) cb(PR.edgeTTS.cachedVoices);
      return;
    }
    var url = 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4';
    fetch(url).then(function(r) { return r.json(); })
      .then(function(data) {
        PR.edgeTTS.cachedVoices = data.map(function(v, i) {
          return {
            name: v.FriendlyName + ' (' + v.Locale + ')',
            id: v.ShortName, voiceURI: 'edge-' + i, lang: v.Locale,
            localService: false, default: i === 0,
            edgeIndex: i, edgeName: v.ShortName
          };
        });
        PR.edgeVoices = PR.edgeTTS.cachedVoices;
        if (cb) cb(PR.edgeTTS.cachedVoices);
      })
      .catch(function() {
        // Restore fallback list - don't set to empty
        PR.edgeTTS.cachedVoices = PR.edgeVoices.slice();
        if (cb) cb(PR.edgeTTS.cachedVoices);
      });
  };

  // ---- Shared pronunciation dictionary core logic ----
  // Returns an array of {marker, start, end} to be applied by caller
  PR._buildPronReplacements = function(text) {
    if (!PR.pronDict || !Object.keys(PR.pronDict).length) return [];
    var entries = Object.keys(PR.pronDict);
    entries.sort(function(a, b) { return b.length - a.length; });
    var reps = [];
    for (var i = 0; i < entries.length; i++) {
      var word = entries[i];
      var pron = PR.pronDict[word];
      if (!pron) continue;
      var escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var re = new RegExp(escaped, 'g');
      var m;
      while ((m = re.exec(text)) !== null) {
        reps.push({ marker: word, replace: pron, start: m.index, end: m.index + word.length });
      }
    }
    return reps;
  };

  // Apply pronunciation dictionary as SSML substitutions
  PR.edgeTTS._applyPronDictSSML = function(text) {
    if (!PR.pronDict || !Object.keys(PR.pronDict).length) return PR.esc(text);
    var result = PR.esc(text);
    var entries = Object.keys(PR.pronDict);
    entries.sort(function(a, b) { return b.length - a.length; });
    for (var i = 0; i < entries.length; i++) {
      var word = entries[i];
      var pron = PR.pronDict[word];
      if (!pron) continue;
      var escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var re = new RegExp(escaped, 'g');
      result = result.replace(re, '<sub alias="' + PR.esc(pron) + '">' + PR.esc(word) + '</sub>');
    }
    return result;
  };

  // synthesize options: { onEnd, onBlock, onError, autoPlay (default true) }
  PR.edgeTTS.synthesize = function(text, voiceName, rate, opts) {
    opts = opts || {};
    var autoPlay = opts.autoPlay !== false;
    if (!window.MediaSource) {
      if (opts.onError) opts.onError(new Error('浏览器不支持 MediaSource'));
      return null;
    }
    var ms = new MediaSource();
    var audio = new Audio();
    var blobUrl = URL.createObjectURL(ms);
    audio.src = blobUrl;
    var sourceBuffer = null;
    var queue = [];
    var ended = false;

    var cleanup = function() {
      // Clean up event listeners by nulling callbacks
      ws.onopen = null; ws.onmessage = null; ws.onerror = null; ws.onclose = null;
      audio.onended = null; audio.onerror = null;
      if (sourceBuffer) {
        sourceBuffer.onupdateend = null;
        sourceBuffer.onerror = null;
      }
      ms.onsourceopen = null;
      // Revoke blob URL
      try { URL.revokeObjectURL(blobUrl); } catch(e) {}
      // Close WebSocket
      try {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close();
      } catch(e) {}
      // Stop audio
      try { audio.pause(); audio.src = ''; } catch(e) {}
      // Clear shared refs if this is still the active session
      if (PR.edgeTTS.ws === ws) { PR.edgeTTS.ws = null; PR.edgeTTS.audioEl = null; }
      if (PR.edgeTTS._api === api) { PR.edgeTTS._api = null; }
      clearTimeout(timeoutId);
    };

    var flushQueue = function() {
      if (!sourceBuffer || sourceBuffer.updating || !queue.length) return;
      var buf = queue.shift();
      try { sourceBuffer.appendBuffer(buf); } catch(e) {
        if (opts.onError) opts.onError(e);
      }
    };

    ms.addEventListener('sourceopen', function() {
      try {
        var mime = 'audio/mpeg; codecs="mp3"';
        if (!MediaSource.isTypeSupported(mime)) mime = 'audio/webm; codecs="opus"';
        sourceBuffer = ms.addSourceBuffer(mime);
        sourceBuffer.mode = 'sequence';
        sourceBuffer.addEventListener('updateend', flushQueue);
        sourceBuffer.addEventListener('error', function(e) { if (opts.onError) opts.onError(e); });
        flushQueue();
      } catch(e) {
        if (opts.onError) opts.onError(e);
      }
    });

    // Connect to Edge TTS WebSocket
    var voiceEdgeName = voiceName || 'zh-CN-XiaoxiaoNeural';
    // Resolve from cached voices if possible (match by id, edgeName, or voiceURI)
    if (PR.edgeTTS.cachedVoices) {
      var matched = PR.edgeTTS.cachedVoices.find(function(v) {
        return v.id === voiceName || v.edgeName === voiceName || v.voiceURI === voiceName;
      });
      if (matched && matched.edgeName) voiceEdgeName = matched.edgeName;
    }
    if (voiceEdgeName === voiceName && PR.edgeVoices) {
      var fm = PR.edgeVoices.find(function(v) { return v.id === voiceName; });
      if (fm && fm.id) voiceEdgeName = fm.id;
    }

    var wsUrl = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&ConnectionId=' + Date.now();
    var ws = new WebSocket(wsUrl);

    // WebSocket timeout — 10 seconds
    var timeoutId = setTimeout(function() {
      if (ws.readyState !== WebSocket.OPEN) {
        try { ws.close(); } catch(e) {}
        if (opts.onError) opts.onError(new Error('Edge TTS 连接超时，请检查网络'));
      }
    }, 10000);

    if (autoPlay) {
      PR.edgeTTS.ws = ws;
      PR.edgeTTS.audioEl = audio;
    }

    ws.addEventListener('open', function() {
      clearTimeout(timeoutId);
      var ssmlText = PR.edgeTTS._applyPronDictSSML(text);
      var ssml = 'X-RequestId:' + Date.now() + '\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:' + new Date().toISOString() + '\r\nPath:ssml\r\n\r\n' +
        '<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="zh-CN">' +
        '<voice name="' + PR.esc(voiceEdgeName) + '"><prosody rate="' + (+rate).toFixed(1) + '">' +
        ssmlText +
        '</prosody></voice></speak>';
      ws.send(ssml);
    });

    ws.addEventListener('message', function(e) {
      if (typeof e.data === 'string') {
        if (e.data.includes('Path:turn.end')) {
          if (ms.readyState === 'open') {
            try { ms.endOfStream(); } catch(ex) {}
          }
          ended = true;
          setTimeout(function() {
            if (opts.onEnd) opts.onEnd();
          }, 100);
        }
        return;
      }
      if (e.data instanceof ArrayBuffer || e.data instanceof Blob) {
        var reader = new FileReader();
        reader.onload = function() {
          var arr = new Uint8Array(reader.result);
          var headerEnd = -1;
          for (var i = 0; i < arr.length - 1; i++) {
            if (arr[i] === 13 && arr[i+1] === 10 && headerEnd >= 0) { headerEnd = i + 2; break; }
            if (headerEnd < 0 && arr[i] === 10) headerEnd = i + 1;
          }
          if (headerEnd < 0) headerEnd = 0;
          var audioData = arr.slice(headerEnd);
          queue.push(audioData.buffer);
          flushQueue();
          if (opts.onBlock && audioData.length > 0) opts.onBlock(audioData);
        };
        reader.readAsArrayBuffer(e.data instanceof Blob ? e.data : new Blob([e.data]));
      }
    });

    ws.addEventListener('error', function(err) {
      clearTimeout(timeoutId);
      if (opts.onError) opts.onError(err);
    });

    ws.addEventListener('close', function() {
      if (!ended && ms.readyState === 'open') {
        try { ms.endOfStream(); } catch(ex) {}
      }
    });

    audio.addEventListener('ended', function() {
      PR.edgeTTS.ws = null;
      PR.edgeTTS.audioEl = null;
      if (PR.edgeTTS._api === api) PR.edgeTTS._api = null;
      if (!ended && opts.onEnd) opts.onEnd();
      // Cleanup after playback ends naturally
      cleanup();
    });

    audio.addEventListener('error', function(err) {
      if (opts.onError) opts.onError(err);
    });

    var api = {
      pause: function() { audio.pause(); },
      resume: function() { audio.play(); },
      stop: function() {
        cleanupEnd();
        if (opts.onEnd) opts.onEnd();
      },
      getAudio: function() { return audio; },
      cleanup: cleanup
    };

    var cleanupEnd = function() {
      ended = true;
      cleanup();
    };

    PR.edgeTTS._api = api;
    PR.edgeTTS._cleanup = cleanup;

    if (autoPlay) {
      setTimeout(function() { audio.play().catch(function() {}); }, 100);
    }
    return api;
  };

  // ---- AB loop support in edge playback ----
  PR.edgeTTS.speakChunk = function(text, voice, rate, onEnd, onBlock) {
    return PR.edgeTTS.synthesize(text, voice, rate, {
      onEnd: onEnd,
      onBlock: onBlock,
      autoPlay: true
    });
  };

  // ---- Fetch Edge TTS audio as a Blob (for MP3 export / AI chunk playback) ----
  PR.fetchEdgeAudio = function(text) {
    return new Promise(function(resolve, reject) {
      var chunks = [];
      var cfg = PR.loadAiConfig();
      var voice = cfg.edgeVoice || 'zh-CN-XiaoxiaoNeural';
      var rate = PR.getSpeed();

      PR.edgeTTS.synthesize(text, voice, rate, {
        autoPlay: false,  // Don't auto-play; we'll play the Blob ourselves
        onBlock: function(data) {
          chunks.push(new Uint8Array(data));
        },
        onEnd: function() {
          if (chunks.length === 0) {
            resolve(new Blob([], { type: 'audio/mpeg' }));
          } else {
            var totalLen = 0;
            for (var i = 0; i < chunks.length; i++) totalLen += chunks[i].length;
            var merged = new Uint8Array(totalLen);
            var offset = 0;
            for (var j = 0; j < chunks.length; j++) {
              merged.set(chunks[j], offset);
              offset += chunks[j].length;
            }
            resolve(new Blob([merged], { type: 'audio/mpeg' }));
          }
        },
        onError: function(e) {
          reject(new Error('Edge TTS: ' + (e.message || 'unknown')));
        }
      });
    });
  };

  // ---- Start fetching the full voice list on load ----
  PR.edgeTTS.fetchVoices();

})(window.PR);
