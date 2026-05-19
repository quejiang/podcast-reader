// highlight.js — Word-level chunking and highlight engine
(function(PR) {
  'use strict';

  // Build word array from text with character offsets
  PR.buildWords = function(text) {
    if (!text || !text.trim()) return [];
    var result = [];
    var pos = 0;
    var re = /([\u4e00-\u9fff\u3400-\u4dbf]+|[a-zA-Z0-9]+|[\u3000-\u303f\uff00-\uffef]|[^\S\n]+|[\n]+|[^\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9\s])/g;
    var m;
    while ((m = re.exec(text)) !== null) {
      var t = m[1];
      if (!t) continue;
      if (/^[\u4e00-\u9fff\u3400-\u4dbf]+$/.test(t) && t.length > 3) {
        for (var i = 0; i < t.length; i += 2) {
          var sub = t.slice(i, Math.min(i + 3, t.length));
          result.push({ text: sub, charStart: m.index + i, charEnd: m.index + i + sub.length });
        }
      } else {
        result.push({ text: t, charStart: m.index, charEnd: m.index + t.length });
      }
    }
    return result;
  };

  PR.resetWords = function() {
    var t = PR.elText.textContent || '';
    PR.words = PR.buildWords(t);
    PR.wordIndex = -1;
    PR.charProgress = 0;
    PR.totalChars = t.length;
  };

  // Clear all <mark> highlights, restoring plain text
  PR.clearHighlight = function() {
    PR.elText.querySelectorAll('mark').forEach(function(m) {
      var p = m.parentNode;
      p.replaceChild(document.createTextNode(m.textContent), m);
      p.normalize();
    });
  };

  // Highlight a character range with <mark> elements
  PR.highlightWordRange = function(cs, ce) {
    PR.clearHighlight();
    if (cs >= ce || !PR.totalChars) return;

    var w = document.createTreeWalker(PR.elText, NodeFilter.SHOW_TEXT, null, false);
    var cp = 0;
    var nodes = [];
    while (w.nextNode()) {
      var n = w.currentNode;
      var l = n.textContent.length;
      var ns = cp, ne = cp + l;
      if (ne > cs && ns < ce) nodes.push({ node: n, nodeStart: ns, nodeEnd: ne });
      cp = ne;
      if (cp >= ce) break;
    }

    for (var i = nodes.length - 1; i >= 0; i--) {
      var node = nodes[i].node;
      var nodeStart = nodes[i].nodeStart;
      var nodeEnd = nodes[i].nodeEnd;
      var rs = Math.max(0, cs - nodeStart);
      var re = Math.min(nodeEnd - nodeStart, ce - nodeStart);
      var b = node.textContent.slice(0, rs);
      var mid = node.textContent.slice(rs, re);
      var a = node.textContent.slice(re);
      var f = document.createDocumentFragment();
      if (b) f.appendChild(document.createTextNode(b));
      var mk = document.createElement('mark');
      mk.textContent = mid;
      f.appendChild(mk);
      if (a) f.appendChild(document.createTextNode(a));
      node.parentNode.replaceChild(f, node);
    }

    var fm = PR.elText.querySelector('mark');
    if (fm) fm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

})(window.PR);
