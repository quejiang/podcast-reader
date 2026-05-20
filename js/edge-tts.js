// edge-tts.js — Edge Read Aloud WebSocket TTS
(function(PR) {
  'use strict';

  PR.edgeTTS = {
    cachedVoices: null,
    ws: null,
    audioEl: null,
    msConv: null,
    onEnd: null,
    onError: null,
    onBlock: null
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
      cb(PR.edgeTTS.cachedVoices);
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
        cb(PR.edgeTTS.cachedVoices);
      })
      .catch(function() {
        PR.edgeTTS.cachedVoices = [];
        PR.edgeVoices = [];
        cb([]);
      });
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

  PR.edgeTTS.synthesize = function(text, voiceName, rate, opts) {
    opts = opts || {};
    if (!window.MediaSource) {
      if (opts.onError) opts.onError(new Error('浏览器不支持 MediaSource'));
      return null;
    }
    var ms = new MediaSource();
    var audio = new Audio();
    audio.src = URL.createObjectURL(ms);
    var sourceBuffer = null;
    var queue = [];
    var ended = false;
    var firstChunk = true;

    var flushQueue = function() {
      if (!sourceBuffer || sourceBuffer.updating || !queue.length) return;
      var buf = queue.shift();
      try {
        sourceBuffer.appendBuffer(buf);
      } catch(e) {
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
    // Also check fallback list
    if (voiceEdgeName === voiceName && PR.edgeVoices) {
      var fm = PR.edgeVoices.find(function(v) { return v.id === voiceName; });
      if (fm && fm.id) voiceEdgeName = fm.id;
    }

    var wsUrl = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&ConnectionId=' + Date.now();
    var ws = new WebSocket(wsUrl);
    PR.edgeTTS.ws = ws;
    PR.edgeTTS.audioEl = audio;

    ws.addEventListener('open', function() {
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
          // Strip header: "Path:audio\r\n"
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
      if (!ended && opts.onEnd) opts.onEnd();
    });

    audio.addEventListener('error', function(err) {
      if (opts.onError) opts.onError(err);
    });

    var api = {
      pause: function() { audio.pause(); },
      resume: function() { audio.play(); },
      stop: function() {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close();
        audio.pause();
        if (opts.onEnd) opts.onEnd();
      },
      getAudio: function() { return audio; }
    };

    setTimeout(function() { audio.play().catch(function() {}); }, 100);
    return api;
  };

  // ---- AB loop support in edge playback ----
  PR.edgeTTS.speakChunk = function(text, voice, rate, onEnd, onBlock) {
    return PR.edgeTTS.synthesize(text, voice, rate, {
      onEnd: onEnd,
      onBlock: onBlock
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
        onBlock: function(data) {
          chunks.push(new Uint8Array(data));
        },
        onEnd: function() {
          if (chunks.length === 0) {
            // Empty audio — create minimal silent blob
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

})(window.PR);
