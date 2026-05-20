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

  // Apply pronunciation dictionary to a text string
  PR._applyPronDict = function(text) {
    if (!PR.pronDict || !Object.keys(PR.pronDict).length) return text;
    var result = text;
    var entries = Object.keys(PR.pronDict);
    // Sort by length descending so longer matches take priority
    entries.sort(function(a, b) { return b.length - a.length; });
    for (var i = 0; i < entries.length; i++) {
      var word = entries[i];
      var pron = PR.pronDict[word];
      if (!pron) continue;
      // Simple string replace — for TTS, just substitute the word
      var escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var re = new RegExp(escaped, 'g');
      result = result.replace(re, pron);
    }
    return result;
  };

  PR.speakWord = function(index) {
    if (index >= PR.words.length) {
      PR.stopPlayback();
      PR._saveResumePoint();
      PR.toast('播放完毕');
      PR.updateProgressUI();
      PR.updateStats();
      PR._saveProgress();
      if (PR.autoNext) setTimeout(PR.playNextEpisode, 500);
      return;
    }
    if (!PR.isPlaying && PR.currentUtterance === null) return;

    // AB loop: if we've passed loopEnd, jump back to loopStart
    if (PR.loopAB && PR.words[index] && PR.words[index].charStart >= PR.loopAB.charEnd) {
      var ls = PR.loopAB.charStart;
      var li = 0;
      for (var k = 0; k < PR.words.length; k++) {
        if (PR.words[k].charEnd > ls) { li = k; break; }
      }
      PR.charProgress = ls;
      PR.wordIndex = li;
      PR.seekToChar(ls);
      return;
    }

    PR.wordIndex = index;
    var w = PR.words[index];
    var speakText = PR._applyPronDict(w.text);
    var speakEnd = w.charEnd;
    var j = index + 1;
    var MAX_CHARS = 35;
    while (j < PR.words.length && speakText.length + PR.words[j].text.length <= MAX_CHARS) {
      var nextText = PR._applyPronDict(PR.words[j].text);
      speakText += nextText;
      speakEnd = PR.words[j].charEnd;
      j++;
      if (/[。！？\n]$/.test(PR.words[j-1].text)) break;
    }
    var wordsInGroup = j - index;
    var utter = new SpeechSynthesisUtterance(speakText);
    utter.voice = PR.getVoice();
    utter.rate = PR.getSpeed();
    utter.lang = utter.voice ? utter.voice.lang : 'zh-CN';

    var groupWords = [];
    for (var gi = 0; gi < wordsInGroup; gi++) {
      groupWords.push(PR.words[index + gi]);
    }

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
      PR.updateFocusMode();
    };

    utter.onstart = function() {
      var startTime = performance.now();
      highlightWord(0);

      highlightTimer = setInterval(function() {
        if (!PR.isPlaying) return;
        var elapsed = performance.now() - startTime;
        var fraction = Math.min(1, elapsed / estDurationMs);
        var targetIdx = Math.min(groupWords.length - 1, Math.floor(fraction * groupWords.length));
        highlightWord(targetIdx);
      }, 50);
    };

    utter.onend = function() {
      if (highlightTimer) { clearInterval(highlightTimer); highlightTimer = null; }
      var lw = groupWords[groupWords.length - 1];
      PR.charProgress = lw.charEnd;
      PR.updateProgressUI();
      PR._saveProgress();
      if (PR.isPlaying) {
        var delay = PR.smartSpeed ? 5 : 30;
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
        setTimeout(function() { PR.speakWord(index + wordsInGroup); }, 30);
      } else {
        PR.currentUtterance = null;
      }
    };

    PR.currentUtterance = utter;
    speechSynthesis.speak(utter);
  };

})(window.PR);
