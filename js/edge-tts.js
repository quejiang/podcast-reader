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
    { id: 'zh-CN-XiaoxiaoMultilingualNeural', name: '晓晓 多语言 (Xiaoxiao) · 女声' },
    { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓 (Xiaoxiao) · 女声' },
    { id: 'zh-CN-YunxiMultilingualNeural', name: '云希 多语言 (Yunxi) · 男声' },
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
    var url = 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=' + PR.edgeTTS.token;
    fetch(url).then(function(r) {
        if (r.status === 401 || r.status === 403) {
          PR.edgeTTS.tokenValid = false;
          throw new Error('token_invalid');
        }
        return r.json();
      })
      .then(function(data) {
        PR.edgeTTS.tokenValid = true;
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
        PR.edgeTTS.tokenValid = false;
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
    var voiceEdgeName = voiceName || 'zh-CN-XiaoxiaoMultilingualNeural';
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

    // Auto-upgrade to Multilingual variant when available (richer training data, more natural)
    if (PR.edgeTTS.cachedVoices && !voiceEdgeName.includes('Multilingual')) {
      var mlName = voiceEdgeName.replace('Neural', 'MultilingualNeural');
      var mlMatch = PR.edgeTTS.cachedVoices.find(function(v) {
        return v.edgeName === mlName || v.id === mlName;
      });
      if (mlMatch && mlMatch.edgeName) voiceEdgeName = mlMatch.edgeName;
    }
    // Also check fallback list for multilingual
    if (!voiceEdgeName.includes('Multilingual') && PR.edgeVoices) {
      var mlName2 = voiceEdgeName.replace('Neural', 'MultilingualNeural');
      var mlFallback = PR.edgeVoices.find(function(v) {
        return v.id === mlName2;
      });
      if (mlFallback && mlFallback.id) voiceEdgeName = mlFallback.id;
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

      // ── 1. 停顿：句末让引擎自主决定，逗号按时间+抖动 ──
      // strength="medium" — engine picks optimal pause for sentence boundaries
      ssmlText = ssmlText.replace(/([。！？；])/g, '$1<break strength="medium"/>');
      ssmlText = ssmlText.replace(/([.!?;])\s+/g, '$1 <break strength="medium"/>');
      // Comma pauses use jittered timing for subtle, non-repetitive feel
      var jitter = function(base, pct) {
        return Math.round(base * (1 + (Math.random() - 0.5) * 2 * pct));
      };
      ssmlText = ssmlText.replace(/([，,、])/g, function(m, p) {
        return p + '<break time="' + jitter(100, 0.2) + 'ms"/>';
      });

      // ── 2. 逐句音调曲线：句首上扬 → 句尾自然下降 ──
      var parts = ssmlText.split(/([。！？；.!?;])/);
      var shapedText = '';
      for (var i = 0; i < parts.length; i += 2) {
        var body = parts[i];
        var punct = parts[i + 1] || '';
        if (body && body.trim()) {
          shapedText += '<prosody contour="(0%,+12%)(35%,+5%)(70%,+0%)(100%,-4%)">' + body + punct + '</prosody>';
        } else if (punct) {
          shapedText += punct;
        }
      }
      if (shapedText.indexOf('<prosody contour=') === -1 && ssmlText.trim()) {
        shapedText = '<prosody contour="(0%,+12%)(35%,+5%)(70%,+0%)(100%,-4%)">' + ssmlText + '</prosody>';
      }

      // ── 3. 语音风格 + 角色 + 强度 ──
      var voiceStyle = (opts && opts.style) || 'chat';
      var styleDegree = (opts && opts.styleDegree != null) ? opts.styleDegree : 1.8;
      var expressWrap = '';
      if (voiceStyle && voiceStyle !== 'general' && voiceStyle !== 'default') {
        expressWrap = '<mstts:express-as style="' + PR.esc(voiceStyle) + '" styledegree="' + styleDegree + '" role="Girl">';
      }

      // ── 4. 组装 SSML ──
      var ssml = 'X-RequestId:' + Date.now() + '\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:' + new Date().toISOString() + '\r\nPath:ssml\r\n\r\n' +
        '<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="zh-CN">' +
        '<voice name="' + PR.esc(voiceEdgeName) + '">' +
        '<mstts:silence type="Lead" value="200ms"/>' +
        expressWrap +
        '<prosody rate="' + (+rate).toFixed(1) + '" pitch="+8%">' +
        shapedText +
        '</prosody>' +
        (expressWrap ? '</mstts:express-as>' : '') +
        '</voice></speak>';
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
  PR.edgeTTS.speakChunk = function(text, voice, rate, onEnd, onBlock, style) {
    var cfg = PR.loadAiConfig();
    var vs = style || (cfg && cfg.edgeVoiceStyle) || 'chat';
    return PR.edgeTTS.synthesize(text, voice, rate, {
      style: vs,
      styleDegree: vs === 'general' || vs === 'default' ? 1.0 : 1.8,
      autoPlay: true,
      onEnd: onEnd,
      onBlock: onBlock
    });
  };

  // ---- Fetch Edge TTS audio as a Blob (for MP3 export / AI chunk playback) ----
  PR.fetchEdgeAudio = function(text) {
    return new Promise(function(resolve, reject) {
      var chunks = [];
      var cfg = PR.loadAiConfig();
      var voice = cfg.edgeVoice || 'zh-CN-XiaoxiaoMultilingualNeural';
      var rate = PR.getSpeed();
      var style = cfg.edgeVoiceStyle || 'chat';
      var styleDegree = (style === 'general' || style === 'default') ? 1.0 : 1.8;

      PR.edgeTTS.synthesize(text, voice, rate, {
        autoPlay: false,  // Don't auto-play; we'll play the Blob ourselves
        style: style,
        styleDegree: styleDegree,
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
