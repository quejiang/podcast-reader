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
    var speakStart = w.charStart;

    utter.onstart = function() {
      PR.charProgress = speakStart;
      PR.highlightWordRange(speakStart, Math.min(speakStart + 5, speakEnd));
      PR.updateProgressUI();
      PR.updateKaraoke();
    };

    var lastBI = 0;
    utter.onboundary = function(evt) {
      if (evt.charIndex !== undefined && evt.charIndex > lastBI) {
        lastBI = evt.charIndex;
        for (var k = 0; k < wordsInGroup; k++) {
          var wi = index + k;
          if (wi < PR.words.length && evt.charIndex <= (k + 1) * (speakText.length / wordsInGroup)) {
            PR.charProgress = PR.words[wi].charStart;
            PR.highlightWordRange(PR.words[wi].charStart, PR.words[wi].charEnd);
            PR.updateProgressUI();
            PR.updateKaraoke();
            break;
          }
        }
      }
    };

    utter.onend = function() {
      var lwi = index + wordsInGroup - 1;
      PR.charProgress = lwi < PR.words.length ? PR.words[lwi].charEnd : speakEnd;
      PR.updateProgressUI();
      if (PR.isPlaying) {
        var delay = PR.smartSpeed ? 20 : 120;
        setTimeout(function() { PR.speakWord(lwi + 1); }, delay);
      } else {
        PR.currentUtterance = null;
      }
    };

    utter.onerror = function(e) {
      if (e.error === 'canceled' || e.error === 'interrupted') {
        PR.currentUtterance = null;
        return;
      }
      PR.charProgress = speakEnd;
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
