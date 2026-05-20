// tts.js — Web Speech API TTS engine
(function(PR) {
  'use strict';

  PR.populateVoices = function() {
    PR.voices = speechSynthesis.getVoices();
    PR.elVoiceSel.innerHTML = '';
    var zh = PR.voices.filter(function(v) { return v.lang.startsWith('zh'); });
    var other = PR.voices.filter(function(v) { return !v.lang.startsWith('zh'); });
    var groups = [{ label: '中文', voices: zh }, { label: '其他', voices: other }];
    for (var gi = 0; gi < groups.length; gi++) {
      var g = groups[gi];
      if (!g.voices.length) continue;
      var og = document.createElement('optgroup');
      og.label = g.label;
      for (var vi = 0; vi < g.voices.length; vi++) {
        var v = g.voices[vi];
        var o = document.createElement('option');
        o.value = v.voiceURI;
        o.textContent = v.name.split(' ').slice(0, 2).join(' ');
        og.appendChild(o);
      }
      PR.elVoiceSel.appendChild(og);
    }
    PR.loadSettings();
    if (!PR.elVoiceSel.value && zh.length) PR.elVoiceSel.value = zh[0].voiceURI;
  };

  PR.speakWord = function(index) {
    if (index >= PR.words.length) {
      PR.stopPlayback();
      PR.toast('播放完毕');
      PR.updateProgressUI();
      PR.updateStats();
      if (PR.autoNext) setTimeout(PR.playNextEpisode, 500);
      return;
    }
    if (!PR.isPlaying && PR.currentUtterance === null) return;

    PR.wordIndex = index;
    var w = PR.words[index];
    var speakText = w.text;
    var speakEnd = w.charEnd;
    var j = index + 1;
    // Group consecutive short words for smoother TTS
    while (j < PR.words.length &&
      (PR.words[j].text.match(/^[\u4e00-\u9fff]+$/) ? PR.words[j].text.length <= 5 : PR.words[j].text.length <= 5) &&
      j - index < 4) {
      speakText += PR.words[j].text;
      speakEnd = PR.words[j].charEnd;
      j++;
    }
    var wordsInGroup = j - index;
    var utter = new SpeechSynthesisUtterance(speakText);
    utter.voice = PR.getVoice();
    utter.rate = PR.getSpeed();
    utter.lang = utter.voice ? utter.voice.lang : 'zh-CN';

    // Collect the words in this group for timer-based highlighting
    var groupWords = [];
    for (var gi = 0; gi < wordsInGroup; gi++) {
      groupWords.push(PR.words[index + gi]);
    }

    // Estimate utterance duration: ~5 chars/sec at 1x for Chinese
    var cps = PR.getSpeed() * 5;
    var estDurationMs = Math.max(200, speakText.length / cps * 1000);
    var highlightTimer = null;
    var lastHighlightedIdx = -1;

    var highlightWord = function(wordIdx) {
      if (wordIdx < 0 || wordIdx >= groupWords.length) return;
      if (wordIdx === lastHighlightedIdx) return;
      lastHighlightedIdx = wordIdx;
      var tw = groupWords[wordIdx];
      PR.charProgress = tw.charStart;
      PR.highlightWordRange(tw.charStart, tw.charEnd);
      PR.updateProgressUI();
      PR.updateKaraoke();
    };

    utter.onstart = function() {
      var startTime = performance.now();
      highlightWord(0);

      highlightTimer = setInterval(function() {
        if (!PR.isPlaying) return;
        var elapsed = performance.now() - startTime;
        var fraction = Math.min(1, elapsed / estDurationMs);
        // Map fraction to word index
        var targetIdx = Math.min(groupWords.length - 1, Math.floor(fraction * groupWords.length));
        highlightWord(targetIdx);
      }, 50);
    };

    // Use onboundary only as a timing recalibration hint (not for highlight)
    utter.onboundary = function(evt) {
      if (!highlightTimer || evt.charIndex === undefined) return;
      // Recalibrate: speech engine reached charIndex within the utterance
      // Adjust the effective start time so the timer tracks reality
    };

    utter.onend = function() {
      if (highlightTimer) { clearInterval(highlightTimer); highlightTimer = null; }
      var lw = groupWords[groupWords.length - 1];
      PR.charProgress = lw.charEnd;
      PR.updateProgressUI();
      if (PR.isPlaying) {
        var delay = PR.smartSpeed ? 20 : 120;
        setTimeout(function() { PR.speakWord(index + wordsInGroup); }, delay);
      } else {
        PR.currentUtterance = null;
      }
    };

    utter.onerror = function(e) {
      if (highlightTimer) { clearInterval(highlightTimer); highlightTimer = null; }
      if (e.error === 'canceled' || e.error === 'interrupted') {
        PR.currentUtterance = null;
        return;
      }
      PR.charProgress = groupWords[groupWords.length - 1].charEnd;
      PR.updateProgressUI();
      if (PR.isPlaying) {
        setTimeout(function() { PR.speakWord(index + wordsInGroup); }, 100);
      } else {
        PR.currentUtterance = null;
      }
    };

    PR.currentUtterance = utter;
    speechSynthesis.speak(utter);
  };

})(window.PR);
