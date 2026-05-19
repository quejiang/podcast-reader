// import.js — File/URL/RSS/OCR import pipeline
(function(PR) {
  'use strict';

  // Generic set text from import
  PR.setText = function(text, filename) {
    PR.stopPlayback();
    PR.currentEpId = null;
    PR.bookmarks = [];
    PR.annotations = [];
    PR.elText.textContent = text;
    if (filename && !PR.elTitle.value.trim()) PR.elTitle.value = filename;
    PR.resetWords();
    PR.updateProgressUI();
    PR.renderBookmarkDots();
    PR.renderAnnotationMarks();
    PR.saveDraft();
    PR.toast('已导入');
  };

  // File handler (called by drop/paste)
  PR.handleFile = async function(file) {
    var name = file.name || '';
    var ext = name.split('.').pop().toLowerCase();

    if (ext === 'txt' || ext === 'md' || ext === 'csv' || ext === 'json') {
      var text = await file.text();
      PR.setText(text, name);
    } else if (ext === 'pdf') {
      PR.toast('正在解析 PDF…', 5000);
      try {
        var arr = await file.arrayBuffer();
        var pdf = await pdfjsLib.getDocument({ data: arr }).promise;
        var pages = [];
        for (var i = 1; i <= pdf.numPages; i++) {
          var page = await pdf.getPage(i);
          var content = await page.getTextContent();
          var pageText = content.items.map(function(item) { return item.str; }).join(' ');
          pages.push(pageText);
        }
        var fullText = pages.join('\n\n');
        if (fullText.trim().length < 20) throw new Error('empty');
        PR.setText(fullText, name);
      } catch(e) {
        PR.toast('PDF 文本层为空，尝试 OCR…', 5000);
        PR.ocrFile(file, name);
      }
    } else if (ext === 'epub') {
      PR.toast('正在解析 EPUB…', 5000);
      try {
        var zip = await JSZip.loadAsync(file);
        var htmlFiles = [];
        zip.forEach(function(relativePath, zipEntry) {
          if (relativePath.endsWith('.html') || relativePath.endsWith('.xhtml') || relativePath.endsWith('.htm')) {
            htmlFiles.push(relativePath);
          }
        });
        htmlFiles.sort();
        var texts = [];
        for (var fi = 0; fi < htmlFiles.length; fi++) {
          var html = await zip.file(htmlFiles[fi]).async('string');
          var div = document.createElement('div');
          div.innerHTML = html;
          texts.push(div.textContent || '');
        }
        PR.setText(texts.join('\n\n'), name);
      } catch(e) {
        PR.toast('EPUB 解析失败: ' + e.message, 3000);
      }
    } else if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].indexOf(ext) >= 0) {
      PR.toast('正在 OCR 识别…', 10000);
      PR.ocrFile(file, name);
    } else {
      // Try as text
      try {
        var t = await file.text();
        PR.setText(t, name);
      } catch(e) {
        PR.toast('不支持的文件格式', 3000);
      }
    }
  };

  // OCR using Tesseract.js
  PR.ocrFile = async function(file, name) {
    try {
      var result = await Tesseract.recognize(file, 'chi_sim+eng', {
        logger: function(m) {
          if (m.status === 'recognizing text') {
            PR.toast('OCR 识别中… ' + Math.round(m.progress * 100) + '%', 3000);
          }
        }
      });
      PR.setText(result.data.text, name || 'ocr-result.txt');
    } catch(e) {
      PR.toast('OCR 失败: ' + e.message, 3000);
    }
  };

  // RSS fetch
  PR.fetchRSS = async function(url) {
    var resp = await fetch('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(url));
    var data = await resp.json();
    if (data.status !== 'ok') throw new Error('RSS 解析失败');
    return data.items.map(function(it) {
      var div = document.createElement('div');
      div.innerHTML = it.description || it.content || '';
      return {
        title: it.title,
        content: (div.textContent || '').replace(/\n{3,}/g, '\n\n').trim(),
        date: it.pubDate
      };
    });
  };

  // Google Drive fetch
  PR.fetchGoogleDrive = async function(url) {
    var match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) throw new Error('无效的 Google Drive 链接');
    var fileId = match[1];
    var resp = await fetch('https://drive.google.com/uc?export=download&id=' + fileId);
    if (!resp.ok) throw new Error('下载失败: ' + resp.status);
    var text = await resp.text();
    if (text.length < 50) throw new Error('内容为空或需要登录');
    PR.setText(text, 'google-drive.txt');
    PR.elModalOverlay.classList.remove('show');
  };

  // Handle paste event (for files)
  PR.handlePaste = function(e) {
    var items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (var i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        e.preventDefault();
        PR.handleFile(items[i].getAsFile());
        return;
      }
    }
  };

  // Handle drop event
  PR.handleDrop = function(e) {
    e.preventDefault();
    PR.elDropOverlay.classList.remove('show');
    var files = e.dataTransfer.files;
    if (files.length) PR.handleFile(files[0]);
  };

})(window.PR);
