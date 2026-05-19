// annotations.js — Annotation system
(function(PR) {
  'use strict';

  PR.addAnnotation = function(note) {
    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.toString().trim()) return;
    var range = sel.getRangeAt(0);
    if (!PR.elText.contains(range.commonAncestorContainer)) return;
    // Calculate char offsets
    var pre = document.createRange();
    pre.setStart(PR.elText, 0);
    pre.setEnd(range.startContainer, range.startOffset);
    var charStart = pre.toString().length;
    var charEnd = charStart + range.toString().length;
    PR.annotations.push({ charStart: charStart, charEnd: charEnd, note: note, id: Date.now().toString(36) });
    PR.annotations.sort(function(a, b) { return a.charStart - b.charStart; });
    sel.removeAllRanges();
    PR.renderAnnotationMarks();
    PR.saveDraft();
    PR.toast('已添加批注');
  };

  PR.removeAnnotation = function(id) {
    PR.annotations = PR.annotations.filter(function(a) { return a.id !== id; });
    PR.renderAnnotationMarks();
    PR.saveDraft();
  };

  PR.showAnnotationTooltip = function(ann, e) {
    PR.elAnnTooltip.innerHTML = '<div class="ann-note">' + PR.esc(ann.note) + '</div><button data-id="' + ann.id + '">删除批注</button>';
    PR.elAnnTooltip.style.left = e.pageX + 'px';
    PR.elAnnTooltip.style.top = (e.pageY + 10) + 'px';
    PR.elAnnTooltip.classList.add('show');
    PR.elAnnTooltip.querySelector('button').addEventListener('click', function() {
      PR.removeAnnotation(ann.id);
      PR.elAnnTooltip.classList.remove('show');
    });
  };

  PR.renderAnnotationMarks = function() {
    // Remove existing annotation marks
    PR.elText.querySelectorAll('.ann-mark').forEach(function(m) {
      var p = m.parentNode;
      p.replaceChild(document.createTextNode(m.textContent), m);
      p.normalize();
    });
    if (!PR.annotations.length || !PR.totalChars) return;

    PR.annotations.forEach(function(ann) {
      if (ann.charStart >= PR.totalChars || ann.charEnd > PR.totalChars) return;
      var w = document.createTreeWalker(PR.elText, NodeFilter.SHOW_TEXT, null, false);
      var cp = 0;
      while (w.nextNode()) {
        var n = w.currentNode;
        var l = n.textContent.length;
        var ns = cp, ne = cp + l;
        if (ne > ann.charStart && ns < ann.charEnd) {
          var rs = Math.max(0, ann.charStart - ns);
          var re2 = Math.min(ne - ns, ann.charEnd - ns);
          var b = n.textContent.slice(0, rs);
          var mid = n.textContent.slice(rs, re2);
          var a = n.textContent.slice(re2);
          var f = document.createDocumentFragment();
          if (b) f.appendChild(document.createTextNode(b));
          var sp = document.createElement('span');
          sp.className = 'ann-mark';
          sp.textContent = mid;
          sp.title = ann.note;
          sp.addEventListener('click', function(e) { e.stopPropagation(); PR.showAnnotationTooltip(ann, e); });
          f.appendChild(sp);
          if (a) f.appendChild(document.createTextNode(a));
          n.parentNode.replaceChild(f, n);
          break;
        }
        cp = ne;
        if (cp >= ann.charEnd) break;
      }
    });
  };

})(window.PR);
