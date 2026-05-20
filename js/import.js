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
      PR.toast('正在解析 PDF…', 60000);
      try {
        var arr = await file.arrayBuffer();
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        var pdf = await pdfjsLib.getDocument({ data: arr.slice(0) }).promise;
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
        PR.toast('PDF 无文本层，正在 OCR 识别每一页…', 60000);
        PR.ocrPdf(file, name);
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
      PR.ocrImage(file, name);
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

  // OCR a single image file using Tesseract.js
  PR.ocrImage = async function(file, name) {
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

  // OCR a scanned PDF: render each page to canvas, then OCR each page image
  PR.ocrPdf = async function(file, name) {
    try {
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
      var arr = await file.arrayBuffer();
      var pdf = await pdfjsLib.getDocument({ data: arr.slice(0) }).promise;
      var totalPages = pdf.numPages;
      var allText = [];

      // Create a single Tesseract worker for all pages (v5 API)
      var worker = await Tesseract.createWorker('chi_sim+eng');

      for (var i = 1; i <= totalPages; i++) {
        PR.toast('OCR 第 ' + i + ' / ' + totalPages + ' 页…', 60000);
        var page = await pdf.getPage(i);
        // Render at 2x scale for better OCR accuracy
        var viewport = page.getViewport({ scale: 2 });
        var canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        var ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport: viewport }).promise;

        var ret = await worker.recognize(canvas);
        var pageText = ret.data.text || '';
        if (pageText.trim()) allText.push(pageText.trim());
      }

      await worker.terminate();

      if (!allText.length) {
        PR.toast('OCR 未能识别出文字，PDF 可能为空白页', 3000);
        return;
      }
      PR.setText(allText.join('\n\n'), name);
    } catch(e) {
      PR.toast('PDF OCR 失败: ' + e.message, 3000);
    }
  };

  // OCR using Tesseract.js (legacy, kept for image files)
  PR.ocrFile = async function(file, name) {
    PR.ocrImage(file, name);
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

  // URL text extraction via CORS proxy
  PR.fetchUrl = async function(url) {
    PR.toast('正在抓取网页正文…', 10000);
    if (typeof PR.showLoading === 'function') PR.showLoading('正在抓取网页正文…');
    try {
      var resp;
      try {
        resp = await fetch(url, { mode: 'cors' });
      } catch(e) {
        resp = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(url));
      }
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      var html = await resp.text();

      var div = document.createElement('div');
      div.innerHTML = html;
      div.querySelectorAll('script,style,nav,header,footer,aside,iframe,noscript,svg,.sidebar,.nav,.menu,.ad').forEach(function(el) { el.remove(); });

      var content = div.querySelector('article') || div.querySelector('main') || div.querySelector('[role="main"]') || div.body || div;
      var text = (content.textContent || '').replace(/\n{3,}/g, '\n\n').trim();

      if (text.length < 100) throw new Error('正文太短，可能抓取失败');

      if (typeof PR.hideLoading === 'function') PR.hideLoading();
      PR.setText(text, url.split('/').pop() || '网页抓取');
      if (!PR.elTitle.value.trim()) {
        var t = div.querySelector('title');
        PR.elTitle.value = t ? t.textContent.trim() : new URL(url).hostname;
      }
      PR.elModalOverlay.classList.remove('show');
    } catch(e) {
      if (typeof PR.hideLoading === 'function') PR.hideLoading();
      PR.toast('抓取失败: ' + e.message + '（可尝试复制文字直接粘贴）', 4000);
    }
  };

})(window.PR);