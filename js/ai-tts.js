// ai-tts.js — AI TTS (ElevenLabs / OpenAI) + MP3 export
(function(PR) {
  'use strict';

  PR.fetchAiAudio = async function(text) {
    var cfg = PR.loadAiConfig();
    if (cfg.mode === 'elevenlabs') {
      if (!cfg.elevenLabsKey) throw new Error('请配置 ElevenLabs API Key');
      var resp = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + (cfg.elevenLabsVoice || '21m00Tcm4TlvDq8ikWAM'), {
        method: 'POST',
        headers: { 'xi-api-key': cfg.elevenLabsKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: cfg.stability || 0.5,
            similarity_boost: cfg.similarity || 0.75,
            style: cfg.style || 0,
            speed: PR.getSpeed()
          }
        })
      });
      if (!resp.ok) throw new Error('ElevenLabs: ' + resp.status);
      return await resp.blob();
    } else if (cfg.mode === 'openai') {
      if (!cfg.openaiKey) throw new Error('请配置 OpenAI API Key');
      var resp2 = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + cfg.openaiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: cfg.openaiVoice || 'alloy',
          speed: PR.getSpeed()
        })
      });
      if (!resp2.ok) throw new Error('OpenAI: ' + resp2.status);
      return await resp2.blob();
    } else if (cfg.mode === 'edge') {
      return await PR.fetchEdgeAudio(text);
    }
    throw new Error('未配置 AI 引擎');
  };

  // Speak a chunk of words in AI mode.
  // Uses PR._chunkSeq (incremented by startPlayback and seekByChars) to discard
  // stale callbacks when the user seeks or stops during fetch.
  PR.speakAiChunk = function(index) {
    if (index >= PR.words.length) {
      PR.stopPlayback();
      PR.toast('播放完毕');
      PR.updateStats();
      if (PR.autoNext) setTimeout(PR.playNextEpisode, 500);
      return;
    }
    if (!PR.isPlaying) return;

    // Capture the sequence ID at the moment this chunk was dispatched.
    // Any callback whose seq !== this seq is stale and must be ignored.
    var seq = PR._chunkSeq || 0;

    PR.wordIndex = index;
    var w = PR.words[index];
    PR.highlightWordRange(w.charStart, w.charEnd);
    PR.charProgress = w.charStart;
    PR.updateProgressUI();
    PR.updateKaraoke();
    PR.updateFocusMode();

    var batchText = w.text;
    var batchEnd = w.charEnd;
    var j = index + 1;
    while (j < PR.words.length && batchText.length < 300 && j - index < 10) {
      batchText += PR.words[j].text;
      batchEnd = PR.words[j].charEnd;
      j++;
    }
    var wib = j - index;

    PR.fetchAiAudio(batchText).then(function(blob) {
      // Guard: discard if playback stopped, started a new session, or sought away
      if (!PR.isPlaying) return;
      if (PR._chunkSeq !== seq) return;

      // Limit memory: keep at most 30 blobs
      PR.aiAudioBlobs.push(blob);
      if (PR.aiAudioBlobs.length > 30) {
        PR.aiAudioBlobs = PR.aiAudioBlobs.slice(-30);
      }

      var url = URL.createObjectURL(blob);
      PR.aiAudio = new Audio(url);
      PR.aiAudio.playbackRate = PR.getSpeed();

      var totalDuration = 0;
      PR.aiAudio.addEventListener('timeupdate', function() {
        if (!PR.isPlaying || !PR.aiAudio || PR._chunkSeq !== seq) return;
        if (PR.aiAudio.paused) return;
        var currentTime = PR.aiAudio.currentTime;
        if (!isFinite(totalDuration) || totalDuration <= 0) {
          totalDuration = PR.aiAudio.duration;
          if (!isFinite(totalDuration) || totalDuration <= 0) {
            totalDuration = batchText.length / 3.5 / PR.getSpeed();
          }
        }
        var progress = Math.min(1, currentTime / totalDuration);
        var wi = index + Math.floor(progress * wib);
        if (wi < PR.words.length) {
          PR.wordIndex = wi;
          PR.charProgress = PR.words[wi].charStart;
          PR.highlightWordRange(PR.words[wi].charStart, PR.words[wi].charEnd);
          PR.updateProgressUI();
          PR.updateKaraoke();
          PR.updateFocusMode();
        }
      });

      PR.aiAudio.onended = function() {
        URL.revokeObjectURL(url);
        if (PR._chunkSeq !== seq) return;
        PR.charProgress = batchEnd;
        PR.updateProgressUI();
        if (PR.isPlaying) {
          var d = PR.smartSpeed ? 20 : 150;
          setTimeout(function() {
            if (PR._chunkSeq !== seq) return;
            PR.speakAiChunk(index + wib);
          }, d);
        }
      };

      PR.aiAudio.onerror = function() {
        URL.revokeObjectURL(url);
        if (PR._chunkSeq !== seq) return;
        PR.charProgress = batchEnd;
        PR.updateProgressUI();
        if (PR.isPlaying) {
          setTimeout(function() {
            if (PR._chunkSeq !== seq) return;
            PR.speakAiChunk(index + wib);
          }, 200);
        }
      };

      PR.aiAudio.play().catch(function() {});
    }).catch(function(err) {
      // Guard: ignore if started a new session
      if (PR._chunkSeq !== seq) return;
      PR.toast('AI TTS 失败：' + err.message, 3000);
      PR.aiMode = null;
      PR.isPlaying = false;
      PR.updatePlayButton();
    });
  };

  // MP3 Export — supports AI blobs, Edge TTS background synthesis, and system fallback
  PR.exportMp3 = async function() {
    // If already have AI blobs from playback, export them directly
    if (PR.aiAudioBlobs && PR.aiAudioBlobs.length) {
      var blob = new Blob(PR.aiAudioBlobs, { type: 'audio/mpeg' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = (PR.elTitle.value.trim() || '播客导出') + '.mp3';
      a.click();
      URL.revokeObjectURL(url);
      PR.toast('MP3 已导出（已播放部分）');
      return;
    }

    // Edge TTS: synthesize entire text in the background (free, no API key needed)
    var cfg = PR.loadAiConfig();
    if (cfg.mode === 'edge') {
      var text = PR.elText.textContent || '';
      if (!text.trim()) { PR.toast('请先输入文字内容'); return; }

      PR.toast('正在合成音频…（可能需要几分钟）', 60000);
      if (typeof PR.showLoading === 'function') PR.showLoading('正在后台合成音频…');
      try {
        var exportBlob = await PR.fetchEdgeAudio(text);
        if (typeof PR.hideLoading === 'function') PR.hideLoading();
        var url2 = URL.createObjectURL(exportBlob);
        var a2 = document.createElement('a');
        a2.href = url2;
        a2.download = (PR.elTitle.value.trim() || '播客导出') + '.mp3';
        a2.click();
        URL.revokeObjectURL(url2);
        PR.toast('MP3 已导出');
      } catch(e) {
        if (typeof PR.hideLoading === 'function') PR.hideLoading();
        PR.toast('导出失败: ' + e.message, 4000);
      }
      return;
    }

    // Non-AI and non-Edge: cannot export directly
    if (!PR.aiMode) {
      PR.toast('MP3 导出需要 AI 语音模式。请在设置中切换。');
      return;
    }
    if (!PR.aiAudioBlobs.length && !PR.isPlaying) {
      PR.toast('请先播放一段内容');
      return;
    }
    if (PR.isPlaying) {
      PR.pausePlayback();
      PR.toast('已暂停，正在导出已播放部分…');
    }
    var blob2 = new Blob(PR.aiAudioBlobs, { type: 'audio/mpeg' });
    var url3 = URL.createObjectURL(blob2);
    var a3 = document.createElement('a');
    a3.href = url3;
    a3.download = (PR.elTitle.value.trim() || '播客导出') + '.mp3';
    a3.click();
    URL.revokeObjectURL(url3);
    PR.toast('MP3 已导出');
  };

})(window.PR);
