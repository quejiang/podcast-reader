// bookmarks.js — Bookmark system
(function(PR) {
  'use strict';

  PR.addBookmark = function(label) {
    if (!PR.totalChars) return;
    var id = Date.now().toString(36);
    PR.bookmarks.push({ charPos: PR.charProgress, label: label || '', id: id });
    PR.bookmarks.sort(function(a, b) { return a.charPos - b.charPos; });
    PR.renderBookmarkDots();
    PR.saveDraft();
    PR.toast('已添加书签');
  };

  PR.removeBookmark = function(id) {
    PR.bookmarks = PR.bookmarks.filter(function(b) { return b.id !== id; });
    PR.renderBookmarkDots();
    PR.saveDraft();
  };

  PR.jumpToBookmark = function(id) {
    var bm = PR.bookmarks.find(function(b) { return b.id === id; });
    if (!bm) return;
    PR.seekToChar(bm.charPos);
    PR.elBmPanel.classList.remove('show');
  };

  PR.renderBookmarkDots = function() {
    var c = PR.$('#bookmark-dots');
    c.innerHTML = '';
    if (!PR.totalChars) return;
    PR.bookmarks.forEach(function(bm) {
      var d = document.createElement('div');
      d.style.cssText = 'position:absolute;left:' + (bm.charPos / PR.totalChars * 100) + '%;top:50%;transform:translate(-50%,-50%);width:7px;height:7px;border-radius:50%;background:var(--play);pointer-events:auto;cursor:pointer;z-index:2';
      d.title = bm.label || '书签';
      d.addEventListener('click', function(e) { e.stopPropagation(); PR.seekToChar(bm.charPos); });
      c.appendChild(d);
    });
  };

  PR.showBookmarkPanel = function() {
    PR.elBmPanel.innerHTML = '';
    if (!PR.bookmarks.length) {
      PR.elBmPanel.innerHTML = '<div class="bm-empty">暂无书签<br>播放中按 b 添加</div>';
    } else {
      PR.bookmarks.forEach(function(bm) {
        var pre = (PR.elText.textContent || '').slice(Math.max(0, bm.charPos - 10), bm.charPos + 15).trim();
        var item = document.createElement('div');
        item.className = 'bm-item';
        item.innerHTML = '<span>' + PR.esc(bm.label || pre || '(空)') + '</span><span class="bm-del" data-id="' + bm.id + '">&times;</span>';
        item.addEventListener('click', function(e) {
          if (e.target.classList.contains('bm-del')) {
            PR.removeBookmark(bm.id);
            PR.showBookmarkPanel();
          } else {
            PR.jumpToBookmark(bm.id);
          }
        });
        PR.elBmPanel.appendChild(item);
      });
    }
    PR.elBmPanel.classList.toggle('show');
  };

})(window.PR);
