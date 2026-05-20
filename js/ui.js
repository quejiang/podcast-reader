// ui.js — UI: toast, modes (focus/karaoke), sleep timer, settings modal
(function(PR) {
  'use strict';

  // ---- Toast ----
  PR.toast = function(msg, d) {
    clearTimeout(PR.toastTimer);
    PR.elToast.textContent = msg;
    PR.elToast.classList.add('show');
    PR.toastTimer = setTimeout(function() { PR.elToast.classList.remove('show'); }, d || 2000);
  };

  // ---- Sleep Timer ----
  PR.showSleepMenu = function() {
    var opts = [
      { label: '关闭', m: 0 },
      { label: '15 分钟', m: 15 },
      { label: '30 分钟', m: 30 },
      { label: '45 分钟', m: 45 },
      { label: '60 分钟', m: 60 }
    ];
    PR.elModal.innerHTML = '<h3>定时关闭</h3>' +
      opts.map(function(o) {
        return '<button style="display:block;width:100%;margin-bottom:5px;" class="' +
          (PR.sleepSeconds === o.m * 60 ? '' : 'secondary') + '" data-m="' + o.m + '">' + o.label + '</button>';
      }).join('') +
      '<button class="secondary" style="margin-top:6px;width:100%;" id="btn-close-modal">取消</button>';
    PR.elModalOverlay.classList.add('show');
    PR.elModal.querySelectorAll('button[data-m]').forEach(function(b) {
      b.addEventListener('click', function() {
        PR.setSleepTimer(parseInt(b.dataset.m) * 60);
        PR.elModalOverlay.classList.remove('show');
      });
    });
    PR.$('#btn-close-modal').addEventListener('click', function() { PR.elModalOverlay.classList.remove('show'); });
  };

  PR.setSleepTimer = function(sec) {
    clearInterval(PR.sleepInterval);
    PR.sleepSeconds = sec;
    if (sec <= 0) {
      PR.elSleepBadge.classList.remove('show');
      PR.elSleepBadge.textContent = '';
      PR.toast('定时关闭已取消');
      return;
    }
    PR.updateSleepBadge();
    PR.elSleepBadge.classList.add('show');
    PR.sleepInterval = setInterval(function() {
      PR.sleepSeconds--;
      PR.updateSleepBadge();
      if (PR.sleepSeconds <= 0) {
        clearInterval(PR.sleepInterval);
        PR.stopPlayback();
        PR.elSleepBadge.classList.remove('show');
        PR.toast('定时关闭 - 已停止', 3000);
      }
    }, 1000);
    PR.toast('将于 ' + PR.formatTime(sec) + ' 后停止');
  };

  PR.updateSleepBadge = function() {
    var m = Math.floor(PR.sleepSeconds / 60);
    var s = PR.sleepSeconds % 60;
    PR.elSleepBadge.textContent = m + ':' + String(s).padStart(2, '0');
  };

  // ---- Focus Mode ----
  PR.toggleFocusMode = function() {
    PR.focusMode = !PR.focusMode;
    PR.elBtnFocus.classList.toggle('active', PR.focusMode);
    PR.elText.classList.toggle('focus-mode', PR.focusMode);
    if (PR.focusMode) {
      // Save original HTML before wrapping paragraphs
      PR._focusOriginalHTML = PR.elText.innerHTML;
      PR._focusOriginalText = PR.elText.textContent || '';
      PR.elText.contentEditable = 'false';
      var paras = PR._focusOriginalText.split(/\n+/);
      PR.elText.innerHTML = paras.map(function(p) { return '<span class="para">' + PR.esc(p) + '</span>'; }).join('<br>');
      PR.updateFocusMode();
    } else {
      PR.elText.contentEditable = 'true';
      // Restore original content
      if (PR._focusOriginalHTML) {
        PR.elText.innerHTML = PR._focusOriginalHTML;
        PR._focusOriginalHTML = null;
        PR._focusOriginalText = null;
      }
    }
  };

  PR.updateFocusMode = function() {
    if (!PR.focusMode || PR.wordIndex < 0 || PR.wordIndex >= PR.words.length) return;
    var w = PR.words[PR.wordIndex];
    var text = PR.elText.textContent || '';
    var paras = text.split(/\n+/);
    var pos = 0;
    PR.elText.querySelectorAll('.para').forEach(function(p) { p.classList.remove('active'); });
    for (var pi = 0; pi < paras.length; pi++) {
      var p = paras[pi];
      var pe = pos + p.length;
      if (w.charStart >= pos && w.charStart < pe + 1) {
        var paraEls = PR.elText.querySelectorAll('.para');
        if (paraEls[pi]) paraEls[pi].classList.add('active');
        break;
      }
      pos = pe + 1;
    }
  };

  // ---- Karaoke Mode ----
  PR.toggleKaraokeMode = function() {
    PR.karaokeMode = !PR.karaokeMode;
    PR.elBtnKaraoke.classList.toggle('active', PR.karaokeMode);
    PR.elText.style.display = PR.karaokeMode ? 'none' : '';
    PR.elKaraokeLine.style.display = PR.karaokeMode ? 'block' : 'none';
    if (PR.karaokeMode) {
      PR.elText.contentEditable = 'false';
      PR.updateKaraoke();
    } else {
      PR.elText.contentEditable = 'true';
    }
  };

  PR.updateKaraoke = function() {
    if (!PR.karaokeMode) return;
    var t = PR.elText.textContent || '';
    var paras = t.split(/\n+/);
    var pos = 0;
    for (var pi = 0; pi < paras.length; pi++) {
      var p = paras[pi];
      var pe = pos + p.length;
      if (PR.charProgress >= pos && PR.charProgress < pe + 1) {
        PR.elKaraokeLine.textContent = p.trim();
        break;
      }
      pos = pe + 1;
    }
  };

  // ---- Feature Overview ----
  PR.showFeatures = function() {
    var features = [
      { cat: '🎙 语音引擎', icon: '🎤', items: [
        '系统 TTS — 浏览器自带语音，免费，离线可用',
        'Edge TTS — 微软免费神经语音，26 种中文音色，无需 API Key',
        'ElevenLabs — 顶级 AI 音质，接近真人',
        'OpenAI TTS — 可选语音，按量付费',
        'MP3 导出 — AI 模式下播放后导出音频文件'
      ]},
      { cat: '📥 内容导入', icon: '📥', items: [
        '粘贴文字 / TXT / Markdown / JSON / CSV',
        'PDF — 基于 pdf.js 提取文字',
        'EPUB — 基于 JSZip 解析电子书',
        '图片 OCR — Tesseract.js，中文+英文扫描件转文字',
        '网页抓取 — 输入 URL 自动提取正文',
        'RSS 订阅 — 输入 RSS 地址拉取文章列表',
        'Google Drive — 输入分享链接导入文件',
        '拖拽文件 / 剪贴板粘贴 / Share Target 分享导入',
        'Bookmarklet — 任意网页一键发送到磨耳朵'
      ]},
      { cat: '🎮 播放控制', icon: '▶', items: [
        '播放/暂停 — 空格键或点击按钮',
        '变速播放 — 0.75x / 1x / 1.25x / 1.5x / 2x',
        '紧凑模式 — 压缩句子间停顿',
        '前进/后退 15 秒 — 按钮或方向键',
        '进度条点击跳转',
        '连续播放 — 自动播放下一个播客集',
        '定时关闭 — 15/30/45/60 分钟',
        '锁屏控制 — 通知栏显示播放信息 + 控制'
      ]},
      { cat: '📺 显示模式', icon: '👁', items: [
        '聚焦模式 — 只高亮当前段落，沉浸跟读',
        '卡拉OK 模式 — 大字居中显示，适合学语言',
        '词级同步高亮 — 朗读时逐词橙色高亮',
        '暗色/浅色主题 — 自动或手动切换',
        '侧边栏折叠 — 隐藏播客集列表'
      ]},
      { cat: '🔖 标注系统', icon: '🏷', items: [
        '书签 — 任意位置打点，进度条上可视化显示',
        '书签面板 — 查看所有书签，一键跳转',
        '批注 — 选中文字添加笔记，绿色下划线',
        '批注悬停查看 — 鼠标悬停显示完整笔记'
      ]},
      { cat: '💾 数据管理', icon: '💿', items: [
        '播客集 — 保存多篇文章，侧边栏随时切换',
        '草稿自动保存 — 500ms 防抖持久化',
        'JSON 备份/恢复 — 导出导入全部数据',
        '使用统计 — 已听字数、时长、播放次数'
      ]},
      { cat: '📱 PWA 能力', icon: '📲', items: [
        '安装到桌面 — 独立窗口运行，像原生 App',
        '离线可用 — Service Worker 缓存所有资源',
        '快捷入口 — 长按图标「新建朗读」「继续上次」',
        'Share Target — 从任意 App 分享文本到磨耳朵'
      ]},
      { cat: '⌨ 快捷键', icon: '⌨', items: [
        '<kbd>Space</kbd> 播放/暂停 &nbsp; <kbd>←</kbd> 后退 &nbsp; <kbd>→</kbd> 前进',
        '<kbd>B</kbd> 书签 &nbsp; <kbd>F</kbd> 聚焦 &nbsp; <kbd>K</kbd> 卡拉OK',
        '<kbd>H</kbd> 教程 &nbsp; <kbd>Esc</kbd> 停止'
      ]}
    ];

    var html = '<h3 style="text-align:center;margin-bottom:4px">🌟 功能全览</h3>' +
      '<p style="text-align:center;color:var(--text-dim);font-size:12px;margin-bottom:12px">点击 ⚙ 进入详细设置</p>';

    features.forEach(function(f) {
      html += '<div style="margin-bottom:10px;padding:10px;background:var(--surface2);border-radius:var(--radius-sm)">' +
        '<h4 style="font-size:13px;color:var(--accent);margin-bottom:6px">' + f.cat + '</h4>' +
        f.items.map(function(item) {
          return '<div style="font-size:11px;color:var(--text-dim);line-height:1.7;padding-left:2px">· ' + item + '</div>';
        }).join('') +
        '</div>';
    });

    html += '<div class="row" style="margin-top:10px"><button class="secondary" id="btn-close-modal" style="flex:1">关闭</button></div>';

    PR.elModal.innerHTML = html;
    PR.elModalOverlay.classList.add('show');
    PR.$('#btn-close-modal').addEventListener('click', function() { PR.elModalOverlay.classList.remove('show'); });
  };

  // ---- Settings Modal ----
  PR.showSettings = function() {
    var cfg = PR.loadAiConfig();
    PR.elModal.innerHTML =
      '<div class="tabs">' +
        '<span class="tab-btn active" data-tab="ai">AI 语音</span>' +
        '<span class="tab-btn" data-tab="rss">导入</span>' +
        '<span class="tab-btn" data-tab="cloud">云盘</span>' +
        '<span class="tab-btn" data-tab="stats">统计</span>' +
        '<span class="tab-btn" data-tab="sync">同步</span>' +
        '<span class="tab-btn" data-tab="about">关于</span>' +
      '</div>' +
      '<div id="tab-ai">' +
        '<label>AI 引擎</label><select id="cfg-ai-mode">' +
          '<option value="">系统自带 TTS（免费）</option>' +
          '<option value="edge"' + (cfg.mode === 'edge' ? ' selected' : '') + '>Edge TTS（免费 · 推荐）</option>' +
          '<option value="elevenlabs"' + (cfg.mode === 'elevenlabs' ? ' selected' : '') + '>ElevenLabs</option>' +
          '<option value="openai"' + (cfg.mode === 'openai' ? ' selected' : '') + '>OpenAI TTS</option>' +
        '</select>' +
        '<div id="cfg-eg" style="display:none">' +
          '<small style="color:var(--text-dim)">微软免费语音，每月 50 万字符，无需 API Key。支持后台播放。</small>' +
          '<label>Edge 语音</label><select id="cfg-eg-voice">' +
            PR.edgeVoices.map(function(v) {
              return '<option value="' + v.id + '"' + (cfg.edgeVoice === v.id ? ' selected' : '') + '>' + v.name + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +
        '<div id="cfg-el" style="display:none">' +
          '<label>ElevenLabs API Key</label><input type="password" id="cfg-el-key" value="' + PR.esc(cfg.elevenLabsKey || '') + '">' +
          '<small style="color:var(--text-dim)"><a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" style="color:var(--accent)">点此获取 API Key</a> · 免费额度 ～1万字符/月</small>' +
          '<label>Voice ID</label><input type="text" id="cfg-el-voice" value="' + PR.esc(cfg.elevenLabsVoice || '21m00Tcm4TlvDq8ikWAM') + '">' +
          '<label>稳定性 (Stability)</label><input type="range" id="cfg-el-stab" min="0" max="1" step="0.05" value="' + (cfg.stability || 0.5) + '">' +
          '<label>相似度 (Similarity)</label><input type="range" id="cfg-el-sim" min="0" max="1" step="0.05" value="' + (cfg.similarity || 0.75) + '">' +
          '<label>风格 (Style Exaggeration)</label><input type="range" id="cfg-el-style" min="0" max="1" step="0.05" value="' + (cfg.style || 0) + '">' +
          '<small style="color:var(--text-dim)">Stability 越低越有情感，Similarity 越高越像原声</small>' +
        '</div>' +
        '<div id="cfg-oai" style="display:none">' +
          '<label>OpenAI API Key</label><input type="password" id="cfg-oai-key" value="' + PR.esc(cfg.openaiKey || '') + '">' +
          '<small style="color:var(--text-dim)"><a href="https://platform.openai.com/api-keys" target="_blank" style="color:var(--accent)">点此获取 API Key</a> · 按量付费</small>' +
          '<label>声音</label><select id="cfg-oai-voice">' +
            ['alloy','echo','fable','onyx','nova','shimmer'].map(function(v) {
              return '<option value="' + v + '"' + (cfg.openaiVoice === v ? ' selected' : '') + '>' + v + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +
      '</div>' +
      '<div id="tab-rss" style="display:none">' +
        '<label>RSS 订阅 URL</label><div class="row"><input type="url" id="cfg-rss" placeholder="https://example.com/feed.xml" style="flex:1"><button id="btn-fetch-rss">导入文章</button></div>' +
        '<small style="color:var(--text-dim)">输入 RSS 地址，自动抓取文章列表</small>' +
        '<label style="margin-top:8px">网页 URL</label><div class="row"><input type="url" id="cfg-url" placeholder="https://..." style="flex:1"><button id="btn-fetch-url">抓取正文</button></div>' +
      '</div>' +
      '<div id="tab-cloud" style="display:none">' +
        '<label>Google Drive 分享链接</label><div class="row"><input type="text" id="cfg-gdrive" placeholder="https://drive.google.com/file/d/..." style="flex:1"><button id="btn-fetch-gdrive">导入</button></div>' +
        '<small style="color:var(--text-dim)">文件需设为"知道链接的任何人可查看"</small>' +
      '</div>' +
      '<div id="tab-stats" style="display:none">' +
        '<div class="stat-row"><span>已听字数</span><strong>' + (PR.stats.totalCharsListened || 0).toLocaleString() + '</strong></div>' +
        '<div class="stat-row"><span>已听时长</span><strong>' + PR.formatTime(PR.stats.totalSeconds || 0) + '</strong></div>' +
        '<div class="stat-row"><span>播放次数</span><strong>' + (PR.stats.sessionCount || 0) + '</strong></div>' +
        '<div class="stat-row"><span>保存集数</span><strong>' + PR.episodes.length + '</strong></div>' +
        '<button id="btn-reset-stats" class="secondary" style="margin-top:8px;width:100%">重置统计</button>' +
      '</div>' +
      '<div id="tab-sync" style="display:none">' +
        '<label>导出所有数据 (JSON)</label><button id="btn-export-data" style="width:100%;margin-bottom:8px">下载备份文件</button>' +
        '<label>导入备份文件</label><input type="file" id="cfg-import-data" accept=".json" style="margin-bottom:8px">' +
        '<div class="divider"></div>' +
        '<label>浏览器书签脚本 (Bookmarklet)</label>' +
        '<p style="font-size:11px;color:var(--text-dim);margin-bottom:6px">拖到书签栏，任意网页点击即朗读</p>' +
        '<textarea readonly style="height:50px;font-size:10px;font-family:var(--mono);word-break:break-all">javascript:(function(){var t=document.body.innerText.replace(/\\\\n{3,}/g,\'\\\\n\\\\n\').trim();var u=\'https://quejiang.github.io/podcast-reader/?text=\'+encodeURIComponent(t)+\'&title=\'+encodeURIComponent(document.title);window.open(u,\'_blank\')})()</textarea>' +
      '</div>' +
      '<div id="tab-about" style="display:none">' +
        '<div style="text-align:center;padding:10px 0">' +
          '<div style="font-size:48px;margin-bottom:8px">🎧</div>' +
          '<h3 style="margin-bottom:4px">磨耳朵 · Podcast Reader</h3>' +
          '<p style="color:var(--text-dim);font-size:12px">v3.2</p>' +
        '</div>' +
        '<p style="font-size:12px;line-height:1.8;text-align:center;color:var(--text-dim)">' +
          '把文字变成播客，用 AI 语音朗读，像听播客一样磨耳朵。<br>' +
          '支持 PDF、EPUB、OCR 扫描、RSS 订阅等多种导入方式。' +
        '</p>' +
        '<div class="divider"></div>' +
        '<div class="stat-row"><span>作者</span><strong>quejiang</strong></div>' +
        '<div class="stat-row"><span>GitHub</span><strong><a href="https://github.com/quejiang/podcast-reader" target="_blank" style="color:var(--accent);text-decoration:none">quejiang/podcast-reader</a></strong></div>' +
        '<div class="stat-row"><span>技术栈</span><strong>Vanilla JS · PWA · Web Speech API</strong></div>' +
        '<div class="stat-row"><span>许可</span><strong>MIT</strong></div>' +
      '</div>' +
      '<div class="divider"></div>' +
      '<div id="about-analytics-config"></div>' +
      '<div class="row"><button id="btn-save-cfg" style="flex:1">保存设置</button><button class="secondary" id="btn-close-modal">取消</button></div>';

    PR.elModalOverlay.classList.add('show');

    // Render analytics config inside the about tab
    var ac = PR.$('#about-analytics-config');
    if (ac) PR.renderAnalyticsConfig(ac);

    // Tab switching
    PR.elModal.querySelectorAll('.tab-btn').forEach(function(b) {
      b.addEventListener('click', function() {
        PR.elModal.querySelectorAll('.tab-btn').forEach(function(x) { x.classList.remove('active'); });
        b.classList.add('active');
        PR.elModal.querySelectorAll('[id^="tab-"]').forEach(function(x) { x.style.display = 'none'; });
        var t = PR.$('#tab-' + b.dataset.tab);
        if (t) t.style.display = 'block';
      });
    });

    // AI fields toggle
    var cAiMode = PR.$('#cfg-ai-mode');
    var cEl = PR.$('#cfg-el');
    var cEg = PR.$('#cfg-eg');
    var cOai = PR.$('#cfg-oai');
    function upAi() {
      cEg.style.display = cAiMode.value === 'edge' ? 'block' : 'none';
      cEl.style.display = cAiMode.value === 'elevenlabs' ? 'block' : 'none';
      cOai.style.display = cAiMode.value === 'openai' ? 'block' : 'none';
    }
    upAi();
    cAiMode.addEventListener('change', upAi);

    // Save config
    PR.$('#btn-save-cfg').addEventListener('click', function() {
      var nc = {
        mode: cAiMode.value,
        edgeVoice: (PR.$('#cfg-eg-voice') ? PR.$('#cfg-eg-voice').value : '') || 'zh-CN-XiaoxiaoNeural',
        elevenLabsKey: (PR.$('#cfg-el-key') ? PR.$('#cfg-el-key').value.trim() : '') || '',
        elevenLabsVoice: (PR.$('#cfg-el-voice') ? PR.$('#cfg-el-voice').value.trim() : '') || '',
        stability: parseFloat((PR.$('#cfg-el-stab') ? PR.$('#cfg-el-stab').value : '') || 0.5),
        similarity: parseFloat((PR.$('#cfg-el-sim') ? PR.$('#cfg-el-sim').value : '') || 0.75),
        style: parseFloat((PR.$('#cfg-el-style') ? PR.$('#cfg-el-style').value : '') || 0),
        openaiKey: (PR.$('#cfg-oai-key') ? PR.$('#cfg-oai-key').value.trim() : '') || '',
        openaiVoice: (PR.$('#cfg-oai-voice') ? PR.$('#cfg-oai-voice').value : '') || 'alloy'
      };
      PR.saveAiConfig(nc);
      PR.elModalOverlay.classList.remove('show');
      PR.toast('设置已保存');
    });

    PR.$('#btn-close-modal').addEventListener('click', function() { PR.elModalOverlay.classList.remove('show'); });

    // RSS fetch
    var btnRss = PR.$('#btn-fetch-rss');
    if (btnRss) {
      btnRss.addEventListener('click', async function() {
        var url = PR.$('#cfg-rss').value.trim();
        if (!url) { PR.toast('请输入 RSS URL'); return; }
        try {
          var items = await PR.fetchRSS(url);
          if (!items.length) { PR.toast('未获取到文章'); return; }
          PR.elModal.innerHTML = '<h3>选择文章</h3>' +
            items.map(function(it, i) {
              return '<button style="display:block;width:100%;margin-bottom:4px;text-align:left;" data-idx="' + i + '">' +
                PR.esc(it.title || '无标题') + '<br><small style="color:var(--text-dim)">' + PR.esc(it.date || '') + '</small></button>';
            }).join('') +
            '<button class="secondary" style="width:100%;margin-top:6px;" id="btn-close-modal">取消</button>';
          PR.elModal.querySelectorAll('button[data-idx]').forEach(function(b) {
            b.addEventListener('click', function() {
              var it = items[parseInt(b.dataset.idx)];
              PR.elText.textContent = it.content || '';
              PR.elTitle.value = it.title || '';
              PR.stopPlayback();
              PR.currentEpId = null;
              PR.bookmarks = [];
              PR.annotations = [];
              PR.resetWords();
              PR.updateProgressUI();
              PR.renderBookmarkDots();
              PR.saveDraft();
              PR.elModalOverlay.classList.remove('show');
              PR.toast('已导入 RSS 文章');
            });
          });
          PR.$('#btn-close-modal').addEventListener('click', function() { PR.elModalOverlay.classList.remove('show'); });
        } catch(e) {
          PR.toast(e.message, 3000);
        }
      });
    }

    // URL fetch
    var btnUrl = PR.$('#btn-fetch-url');
    if (btnUrl) {
      btnUrl.addEventListener('click', async function() {
        var url = PR.$('#cfg-url').value.trim();
        if (!url) { PR.toast('请输入 URL'); return; }
        try {
          PR.toast('抓取中…', 5000);
          var resp;
          try {
            resp = await fetch(url, { mode: 'cors' });
          } catch(e) {
            resp = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(url));
          }
          var html = await resp.text();
          var d = document.createElement('div');
          d.innerHTML = html;
          d.querySelectorAll('script,style,nav,header,footer,aside,.sidebar,.nav,.menu,.ad,iframe').forEach(function(el) { el.remove(); });
          var text = (d.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
          if (text.length < 100) { PR.toast('内容太少，可能受跨域限制'); return; }
          PR.elText.textContent = text;
          if (!PR.elTitle.value.trim()) {
            var t = d.querySelector('title');
            PR.elTitle.value = t ? t.textContent.trim() : new URL(url).hostname;
          }
          PR.stopPlayback();
          PR.currentEpId = null;
          PR.bookmarks = [];
          PR.annotations = [];
          PR.resetWords();
          PR.updateProgressUI();
          PR.renderBookmarkDots();
          PR.saveDraft();
          PR.elModalOverlay.classList.remove('show');
          PR.toast('已导入网页');
        } catch(e) {
          PR.toast('抓取失败：' + e.message + '（受跨域限制，可尝试粘贴文字）', 3000);
        }
      });
    }

    // Google Drive
    var btnGdrive = PR.$('#btn-fetch-gdrive');
    if (btnGdrive) {
      btnGdrive.addEventListener('click', async function() {
        var url = PR.$('#cfg-gdrive').value.trim();
        if (!url) { PR.toast('请输入 Google Drive 链接'); return; }
        try {
          await PR.fetchGoogleDrive(url);
          PR.elModalOverlay.classList.remove('show');
        } catch(e) {
          PR.toast(e.message, 3000);
        }
      });
    }

    // Stats reset
    var btnReset = PR.$('#btn-reset-stats');
    if (btnReset) {
      btnReset.addEventListener('click', function() {
        PR.stats = { totalCharsListened: 0, totalSeconds: 0, sessionCount: 0 };
        PR.saveSettings();
        PR.showSettings();
        PR.toast('统计已重置');
      });
    }

    // Export/Import data
    var btnExport = PR.$('#btn-export-data');
    if (btnExport) {
      btnExport.addEventListener('click', function() {
        var data = {
          episodes: PR.episodes,
          bookmarks: PR.bookmarks,
          annotations: PR.annotations,
          stats: PR.stats,
          version: 3,
          exported: new Date().toISOString()
        };
        var b = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = '磨耳朵-备份-' + new Date().toISOString().slice(0, 10) + '.json';
        a.click();
        PR.toast('备份已下载');
      });
    }

    var importInput = PR.$('#cfg-import-data');
    if (importInput) {
      importInput.addEventListener('change', function(e) {
        var f = e.target.files[0];
        if (!f) return;
        var r = new FileReader();
        r.onload = function() {
          try {
            var d = JSON.parse(r.result);
            if (d.episodes) {
              if (confirm('导入 ' + d.episodes.length + ' 个播客集？将合并到现有数据。')) {
                PR.episodes = d.episodes.concat(PR.episodes);
                PR.saveEpisodes();
                PR.renderEpisodeList();
              }
            }
            if (d.stats) { PR.stats = Object.assign({}, PR.stats, d.stats); PR.saveSettings(); }
            if (d.bookmarks) { PR.bookmarks = d.bookmarks.concat(PR.bookmarks); PR.renderBookmarkDots(); }
            PR.toast('数据已导入');
            PR.elModalOverlay.classList.remove('show');
          } catch(e) {
            PR.toast('备份文件无效');
          }
        };
        r.readAsText(f);
      });
    }
  };

  // ---- PWA Install Guide (cross-browser) ----
  PR.showInstallGuide = function() {
    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|OPiOS|mercury/.test(navigator.userAgent);
    var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    var isEdge = /Edg/.test(navigator.userAgent);
    var isFirefox = /Firefox/.test(navigator.userAgent);
    var isAndroid = /Android/.test(navigator.userAgent);

    var steps = '';
    if (isIOS) {
      steps =
        '<div style="text-align:center;font-size:40px;margin-bottom:8px">📱 + 🍎</div>' +
        '<h3 style="text-align:center">iPhone / iPad 安装教程</h3>' +
        '<div style="font-size:13px;line-height:2;margin:12px 0;color:var(--text)">' +
          '<strong>第 1 步：</strong>点底部中间 <strong>⎋ 分享按钮</strong>（方框+箭头）<br>' +
          '<strong>第 2 步：</strong>往下滑菜单，找到<br><strong>「添加到主屏幕」</strong><br>' +
          '<strong>第 3 步：</strong>点右上角 <strong>「添加」</strong><br>' +
          '<strong>第 4 步：</strong>回到桌面，点 🎧 图标打开<br><br>' +
          '<small style="color:var(--text-dim)">⚠️ 必须用 Safari 打开这个网页<br>微信/QQ 内置浏览器不支持安装</small>' +
        '</div>';
    } else if (isAndroid && (isChrome || isEdge)) {
      steps =
        '<div style="text-align:center;font-size:40px;margin-bottom:8px">📱 + 🤖</div>' +
        '<h3 style="text-align:center">Android 安装教程</h3>' +
        '<div style="font-size:13px;line-height:2;margin:12px 0;color:var(--text)">' +
          '<strong>方法一：</strong>地址栏下方弹窗 → 点 <strong>「安装」</strong><br><br>' +
          '<strong>方法二：</strong>点右上角 <strong>⋮</strong> →<br><strong>「添加到主屏幕」</strong><br><br>' +
          '<small style="color:var(--text-dim)">安装后长按桌面图标可快捷新建朗读</small>' +
        '</div>';
    } else {
      steps =
        '<div style="text-align:center;font-size:40px;margin-bottom:8px">📲</div>' +
        '<h3 style="text-align:center">安装到桌面</h3>' +
        '<div style="font-size:13px;line-height:2;margin:12px 0;color:var(--text)">' +
          '<strong>iPhone：</strong>Safari → 分享 ⎋ → 添加到主屏幕<br><br>' +
          '<strong>Android：</strong>Chrome → ⋮ → 添加到主屏幕<br><br>' +
          '<strong>电脑：</strong>Chrome/Edge 地址栏右侧点安装图标<br><br>' +
          '<small style="color:var(--text-dim)">安装后可离线使用，锁屏播放不中断</small>' +
        '</div>';
    }

    PR.elModal.innerHTML =
      steps +
      '<button class="secondary" id="btn-close-modal" style="width:100%;margin-top:8px">关闭</button>';
    PR.elModalOverlay.classList.add('show');
    PR.$('#btn-close-modal').addEventListener('click', function() { PR.elModalOverlay.classList.remove('show'); });
  };

})(window.PR);
