// tutorial.js — Mobile-first 8-step onboarding + desktop supplement
(function(PR) {
  'use strict';

  var TUT_KEY = 'pr-tutorial-done';
  var TUT_STEP_KEY = 'pr-tutorial-step';

  // Detect touch device for contextual phrasing
  var isTouchDevice = ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  PR.initTutorial = function() {
    var tutDone = localStorage.getItem(TUT_KEY);

    window.showTutorial = function(step) {
      renderTutorial(step !== undefined ? step : 0);
    };
    PR.showTutorial = window.showTutorial;

    function renderTutorial(step) {
      // Mobile-first tutorial steps. Each step has a mobile section
      // followed by an optional desktop note.
      var steps = [
        {
          icon: '&#127911;',
          title: '欢迎使用磨耳朵',
          body: '把文字变成播客，像听播客一样<strong>磨耳朵</strong>。<br><br>支持 <kbd>txt</kbd> <kbd>md</kbd> <kbd>pdf</kbd> <kbd>epub</kbd> <kbd>图片</kbd> <kbd>RSS</kbd> <kbd>网页</kbd> 等多种导入方式。<br><br>准备好了吗？跟着指引快速上手 👇',
          tip: null
        },
        {
          icon: '&#128193;',
          title: '第1步：导入文字内容',
          body: isTouchDevice ?
            '<strong>📱 手机上三种导入方式：</strong><br><br>' +
            '1️⃣ 复制文字 → <strong>长按中间空白区域</strong> → 粘贴<br>' +
            '2️⃣ 点击顶栏 <kbd>&#128193; 导入文件</kbd> 按钮 → 选择文件<br>' +
            '3️⃣ 点击 <kbd>&#9881; 设置</kbd> → 导入 → 输入网页 URL<br><br>' +
            '<small style="color:var(--text-dim)">📄 支持 PDF / EPUB / 图片 OCR / TXT / Markdown</small>' :
            '<strong>三种导入方式：</strong><br><br>' +
            '1️⃣ 直接<strong>粘贴</strong>文字到中间区域 (Ctrl+V)<br>' +
            '2️⃣ 点击顶栏 <kbd>&#128193; 导入文件</kbd> 或<strong>拖入</strong>文件<br>' +
            '3️⃣ 点击 <kbd>&#9881; 设置</kbd> → 导入 → 输入网页 URL<br><br>' +
            '<small style="color:var(--text-dim)">📄 支持 PDF / EPUB / 图片 OCR / TXT / Markdown</small>',
          tip: { el: '#text-display', msg: '👆 长按这里粘贴文字，或点顶栏 📁 导入文件', pos: 'bottom' }
        },
        {
          icon: '&#9654;',
          title: '第2步：开始播放',
          body: isTouchDevice ?
            '<strong>📱 手机操作：</strong><br><br>' +
            '&#8226; 点击底部橙色 <strong>▶ 播放按钮</strong> 开始朗读<br>' +
            '&#8226; 朗读时文字会<strong>逐词高亮</strong>，自动跟随<br>' +
            '&#8226; 顶栏可切换 <kbd>0.75x</kbd> ~ <kbd>2x</kbd> 语速<br>' +
            '&#8226; 点击底部 <kbd>&#9664;&#9664;</kbd> <kbd>&#9654;&#9654;</kbd> 后退/前进<br>' +
            '&#8226; 点击进度条可<strong>跳转到任意位置</strong><br><br>' +
            '<small style="color:var(--text-dim)">💡 锁屏后继续播放：设置 → AI 语音 → Edge TTS</small>' :
            '<strong>开始播放：</strong><br><br>' +
            '&#8226; 点击底部 <strong>▶ 播放按钮</strong> 或按 <strong>空格键</strong><br>' +
            '&#8226; 朗读时文字会<strong>逐词高亮</strong>，自动跟随<br>' +
            '&#8226; 顶栏切换 <kbd>0.75x</kbd> ~ <kbd>2x</kbd> 语速<br>' +
            '&#8226; 按 <kbd>←</kbd> <kbd>→</kbd> 方向键快退/快进<br>' +
            '&#8226; 点击进度条跳转到任意位置',
          tip: { el: '#btn-play', msg: '👆 点击这里开始播放', pos: 'top' }
        },
        {
          icon: '&#128278;',
          title: '第3步：书签 & 批注',
          body: isTouchDevice ?
            '<strong>📱 随时标记重点：</strong><br><br>' +
            '&#8226; 点击右上 <kbd>&#128278; 书签</kbd> 按钮 → 输入备注<br>' +
            '&#8226; 进度条上的<strong>绿点</strong>就是书签，点击跳转<br>' +
            '&#8226; <strong>选中文字</strong> → 点弹出的 <kbd>+批注</kbd> 添加笔记<br>' +
            '&#8226; 批注文字有<strong>绿色下划线</strong>，点击可查看' :
            '<strong>随时标记：</strong><br><br>' +
            '&#8226; 按 <kbd>B</kbd> 或点右上 <kbd>&#128278; 书签</kbd> 添加书签<br>' +
            '&#8226; 进度条上的<strong>绿点</strong>就是书签，点击跳转<br>' +
            '&#8226; <strong>选中文字</strong> → 点弹出的 <kbd>+批注</kbd> 添加笔记<br>' +
            '&#8226; 批注文字有<strong>绿色下划线</strong>，悬停查看',
          tip: { el: '#btn-bookmark', msg: '👆 标记当前位置，方便回顾', pos: 'bottom' }
        },
        {
          icon: '&#128190;',
          title: '第4步：保存播客集',
          body: isTouchDevice ?
            '<strong>📱 管理你的播客：</strong><br><br>' +
            '&#8226; 点右上橙色的 <kbd>&#128190; 保存</kbd> 存入播客集<br>' +
            '&#8226; 点左上 <kbd>&#9776;</kbd> 打开侧边栏查看所有播客<br>' +
            '&#8226; 点播客标题即可<strong>切换播放</strong><br>' +
            '&#8226; 开启 &#128257; 连续播放 → 自动播下一集<br>' +
            '&#8226; 点 ✕ 或向左滑<strong>关闭侧边栏</strong>回到主页<br><br>' +
            '<small style="color:var(--text-dim)">💡 数据保存在浏览器本地，不会丢失</small>' :
            '<strong>管理播客集：</strong><br><br>' +
            '&#8226; 点右上橙色 <kbd>&#128190; 保存</kbd> 存入播客集<br>' +
            '&#8226; 点左上 <kbd>&#9776;</kbd> 或按 <kbd>H</kbd> 打开侧边栏<br>' +
            '&#8226; 点播客标题即可切换播放<br>' +
            '&#8226; 开启 &#128257; 连续播放 → 自动播下一集',
          tip: { el: '#btn-save', msg: '👆 保存当前内容为播客集', pos: 'bottom' }
        },
        {
          icon: '&#128241;',
          title: '第5步：安装到手机桌面',
          body: isTouchDevice ?
            '<strong>把网页变成手机 App：</strong><br><br>' +
            '<strong>🍎 iPhone (Safari)：</strong><br>' +
            '点底部 <kbd>⎋ 分享</kbd> → 向下滑 → <strong>「添加到主屏幕」</strong><br><br>' +
            '<strong>🤖 Android (Chrome)：</strong><br>' +
            '点右上 <kbd>⋮</kbd> → <strong>「添加到主屏幕」</strong> 或「安装应用」<br><br>' +
            '<strong>安装后的好处：</strong><br>' +
            '&#8226; 桌面点图标打开，<strong>全屏无地址栏</strong><br>' +
            '&#8226; <strong>离线也能用</strong>（飞行模式下打开）<br>' +
            '&#8226; 长按图标 → 「新建朗读」「继续上次」<br>' +
            '&#8226; 微信文章 → 分享 → 选择<strong>「磨耳朵」</strong>' :
            '<strong>把网页变成独立应用：</strong><br><br>' +
            '<strong>Chrome / Edge：</strong>地址栏右侧点安装图标<br>' +
            '<strong>Safari：</strong>文件 → 添加到 Dock<br><br>' +
            '安装后无需打开浏览器，独立窗口运行。',
          tip: { el: null, msg: '', pos: 'bottom' }
        },
        {
          icon: '&#9889;',
          title: '第6步：高级功能一览',
          body: isTouchDevice ?
            '<strong>📱 实用功能：</strong><br><br>' +
            '&#8226; <kbd>&#9878; 聚焦模式</kbd> — 只显示当前段落，沉浸阅读<br>' +
            '&#8226; <kbd>&#9655; 卡拉OK</kbd> — 当前行居中大字，适合跟读<br>' +
            '&#8226; <kbd>&#9889; 紧凑模式</kbd> — 去掉朗读间停顿，更高效<br>' +
            '&#8226; <kbd>&#9201; 定时关闭</kbd> — 睡前设 15/30/60 分钟自动停<br>' +
            '&#8226; <kbd>&#9788; 主题切换</kbd> — 暗色/浅色一键切换<br>' +
            '&#8226; <kbd>&#9733; 功能全览</kbd> — 随时查看所有功能<br>' +
            '&#8226; <kbd>MP3 导出</kbd> — AI 模式下导出音频文件' :
            '<strong>更多功能：</strong><br><br>' +
            '&#8226; <kbd>&#9878; 聚焦模式</kbd> (F) — 只高亮当前段落<br>' +
            '&#8226; <kbd>&#9655; 卡拉OK</kbd> (K) — 当前行居中大字<br>' +
            '&#8226; <kbd>&#9889; 紧凑模式</kbd> — 去掉朗读间停顿<br>' +
            '&#8226; <kbd>&#9201; 定时关闭</kbd> — 睡前自动停<br>' +
            '&#8226; <kbd>&#9788; 主题切换</kbd> — 暗色/浅色<br>' +
            '&#8226; <kbd>MP3 导出</kbd> — AI 模式下导出音频',
          tip: { el: '#btn-smart-speed', msg: '👆 点击探索更多功能', pos: 'top' }
        },
        {
          icon: '&#129302;',
          title: '第7步：AI 语音（可选）',
          body: isTouchDevice ?
            '<strong>想听更自然的人声？</strong><br><br>' +
            '点 <kbd>&#9881; 设置</kbd> → AI 语音 → 选择引擎：<br><br>' +
            '&#8226; <strong>Edge TTS</strong>（推荐⭐）— 免费，26种中文音色<br>' +
            '&#8226; ElevenLabs — 顶级音质，接近真人<br>' +
            '&#8226; OpenAI TTS — 按量付费，质量高<br><br>' +
            '<strong>Edge TTS 无需 API Key</strong>，每月免费 50 万字符，支持后台锁屏播放。<br><br>' +
            '<small style="color:var(--text-dim)">💡 选 Edge TTS 后就能锁屏听了！</small>' :
            '<strong>想听更自然的人声？</strong><br><br>' +
            '点 <kbd>&#9881; 设置</kbd> → AI 语音 → 选择引擎：<br><br>' +
            '&#8226; <strong>Edge TTS</strong>（推荐⭐）— 免费，26种中文音色<br>' +
            '&#8226; ElevenLabs / OpenAI TTS — 高级音质<br><br>' +
            'Edge TTS 无需 API Key，每月免费 50 万字符。',
          tip: { el: '#btn-settings', msg: '👆 点击设置配置 AI 语音引擎', pos: 'bottom' }
        },
        {
          icon: isTouchDevice ? '&#127881;' : '&#9000;',
          title: isTouchDevice ? '全部掌握！' : '补充：桌面快捷键',
          body: isTouchDevice ?
            '你已经学会了所有核心功能 🎉<br><br>' +
            '&#8226; 底部 <kbd>?</kbd> 按钮可随时重新查看教程<br>' +
            '&#8226; 遇到问题？点右下角 <kbd>?</kbd> 即可<br><br>' +
            '<strong>💻 电脑上使用？</strong><br>' +
            '支持键盘快捷键：<br>' +
            '<kbd>Space</kbd> 播放/暂停 &nbsp; <kbd>←→</kbd> 快退/快进<br>' +
            '<kbd>B</kbd> 书签 &nbsp; <kbd>F</kbd> 聚焦 &nbsp; <kbd>K</kbd> 卡拉OK<br>' +
            '<kbd>Esc</kbd> 停止 &nbsp; <kbd>H</kbd> 查看教程<br>' +
            '拖拽文件到窗口直接导入 📂<br><br>' +
            '享受你的播客时光吧 ☕' :
            '快捷键一览 ⌨<br><br>' +
            '<kbd>Space</kbd> 播放/暂停 &nbsp; <kbd>←→</kbd> 快退/快进<br>' +
            '<kbd>B</kbd> 书签 &nbsp; <kbd>F</kbd> 聚焦 &nbsp; <kbd>K</kbd> 卡拉OK<br>' +
            '<kbd>Esc</kbd> 停止 &nbsp; <kbd>H</kbd> 查看教程<br>' +
            '拖拽文件到窗口直接导入 📂<br><br>' +
            '📱 手机上也能用：<br>' +
            '添加主屏幕 → 独立 App，支持分享导入、锁屏播放。<br><br>' +
            '享受你的播客时光吧 ☕'
        }
      ];

      if (step >= steps.length) { finishTutorial(); return; }
      if (step < 0) step = 0;

      var elTip = PR.$('#feature-tip');
      elTip.classList.remove('show');

      var card = PR.$('#tutorial-card');
      card.innerHTML =
        '<span class="tut-icon">' + steps[step].icon + '</span>' +
        '<h2>' + steps[step].title + '</h2>' +
        '<div class="tut-step-dots">' + steps.map(function(_, i) { return '<div class="tut-step-dot' + (i === step ? ' active' : '') + '"></div>'; }).join('') + '</div>' +
        '<div class="tut-body">' + steps[step].body + '</div>' +
        '<div class="tut-buttons">' +
          (step > 0 ? '<button class="secondary" id="tut-prev">上一步</button>' : '') +
          (step < steps.length - 1 ? '<button id="tut-next">' + (step === 0 ? '开始' : '下一步') + '</button>' : '<button id="tut-finish">完成</button>') +
          '<button class="link" id="tut-skip">跳过教程</button>' +
        '</div>';

      PR.$('#tutorial-overlay').classList.add('show');

      var btnPrev = PR.$('#tut-prev');
      var btnNext = PR.$('#tut-next');
      var btnFinish = PR.$('#tut-finish');
      var btnSkip = PR.$('#tut-skip');

      // Clean up old listeners by replacing clones
      if (btnPrev) { var np = btnPrev.cloneNode(true); btnPrev.parentNode.replaceChild(np, btnPrev); np.addEventListener('click', function() { renderTutorial(step - 1); }); }
      if (btnNext) { var nn = btnNext.cloneNode(true); btnNext.parentNode.replaceChild(nn, btnNext); nn.addEventListener('click', function() { renderTutorial(step + 1); }); }
      if (btnFinish) { var nf = btnFinish.cloneNode(true); btnFinish.parentNode.replaceChild(nf, btnFinish); nf.addEventListener('click', finishTutorial); }
      if (btnSkip) { var ns = btnSkip.cloneNode(true); btnSkip.parentNode.replaceChild(ns, btnSkip); ns.addEventListener('click', finishTutorial); }

      showContextualTip(step);
      localStorage.setItem(TUT_STEP_KEY, step);
    }

    function showContextualTip(step) {
      var elTip = PR.$('#feature-tip');
      elTip.classList.remove('show');

      var highlights = {
        1: { el: '#text-display', msg: '👆 长按这里粘贴文字，或点顶栏 📁 导入文件', pos: 'bottom' },
        2: { el: '#btn-play', msg: '👆 点击这里开始播放', pos: 'top' },
        3: { el: '#btn-bookmark', msg: '👆 添加书签标记当前位置', pos: 'bottom' },
        4: { el: '#btn-save', msg: '👆 保存为播客集', pos: 'bottom' },
        5: { el: null, msg: '', pos: 'bottom' },
        6: { el: '#btn-smart-speed', msg: '高级功能在这里', pos: 'top' },
        7: { el: '#btn-settings', msg: '👆 点击设置配置 AI 语音', pos: 'bottom' }
      };

      var h = highlights[step];
      if (!h || !h.el) {
        var spot = document.createElement('div');
        spot.id = 'tut-spotlight-temp';
        spot.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.4);pointer-events:none;z-index:350;transition:opacity .3s';
        var old = PR.$('#tut-spotlight-temp');
        if (old) old.remove();
        document.body.appendChild(spot);
        return;
      }

      removeSpotlight();
      var target = PR.$(h.el);
      if (!target) return;

      var rect = target.getBoundingClientRect();
      var spot = document.createElement('div');
      spot.id = 'tut-spotlight-temp';
      spot.style.cssText =
        'position:fixed;left:' + (rect.left - 6) + 'px;top:' + (rect.top - 6) + 'px;' +
        'width:' + (rect.width + 12) + 'px;height:' + (rect.height + 12) + 'px;' +
        'border:2px solid var(--accent);border-radius:8px;' +
        'box-shadow:0 0 0 9999px rgba(0,0,0,.55);' +
        'pointer-events:none;z-index:350;transition:all .25s;';
      document.body.appendChild(spot);

      elTip.textContent = h.msg;
      elTip.className = 'feature-tip ' + (h.pos || 'top') + ' show';
      if (h.pos === 'bottom') {
        elTip.style.top = (rect.bottom + 12) + 'px';
      } else {
        elTip.style.bottom = (window.innerHeight - rect.top + 12) + 'px';
      }
      elTip.style.left = Math.max(10, rect.left + rect.width / 2 - 100) + 'px';
    }

    function removeSpotlight() {
      var el = PR.$('#tut-spotlight-temp');
      if (el) el.remove();
    }

    function finishTutorial() {
      PR.$('#tutorial-overlay').classList.remove('show');
      removeSpotlight();
      var elTip = PR.$('#feature-tip');
      elTip.classList.remove('show');
      localStorage.setItem(TUT_KEY, '1');
      localStorage.removeItem(TUT_STEP_KEY);

      if (!PR.episodes.length && !PR.elText.textContent.trim()) {
        loadDemoContent();
      }
    }

    function loadDemoContent() {
      var demoText = '人工智能正在深刻改变我们的生活方式。从智能手机上的语音助手，到自动驾驶汽车，再到医疗诊断中的影像分析，AI 已经渗透到了社会的方方面面。\n\n在语音技术领域，文本转语音（TTS）系统已经从早期的机械式发音，发展到了今天几乎可以以假乱真的自然语音合成。现代 TTS 不仅能准确读出文字，还能根据上下文调整语调、语速和情感表达。\n\n深度学习模型的突破是这一进步的关键。通过在海量语音数据上训练，AI 学会了人类说话时的微妙变化——什么时候停顿、什么时候重读、什么时候加快或放慢。\n\n对于学习语言的人来说，这意味着一场革命。你不再需要找人朗读给你听，也不需要反复听同一段录音。只需要把文字投喂给 AI，它就能像一位耐心的朗读者一样，用自然的语调为你读出每一个字。\n\n这就是"磨耳朵"的意义所在——通过反复聆听，让耳朵逐渐适应目标语言的节奏和语调。就像婴儿学说话一样，听多了，自然就会了。\n\n无论是准备雅思听力考试，还是想提高英语语感，或是单纯想用碎片时间多吸收一些信息，文字转语音都是你的得力助手。\n\n打开一本书，粘贴一段文字，点击播放，闭上眼静静听。知识就这样流进了耳朵里。';

      PR.elText.textContent = demoText;
      PR.elTitle.value = 'AI 与语音技术 · 演示播客';
      PR.resetWords();
      PR.updateProgressUI();
      PR.saveDraft();
      var badge = PR.$('#demo-badge');
      badge.style.display = 'block';
      badge.addEventListener('click', function() {
        badge.style.display = 'none';
        PR.elText.textContent = '';
        PR.elTitle.value = '';
        PR.resetWords();
        PR.updateProgressUI();
        PR.saveDraft();
      });
      PR.toast('已加载演示内容，点击 ▶ 播放试试吧');

      var check = function() {
        if (PR.isPlaying) {
          badge.style.display = 'none';
          PR.elBtnPlay.removeEventListener('click', check);
        }
      };
      PR.elBtnPlay.addEventListener('click', check);
    }

    // Resume tutorial if interrupted
    var savedStep = localStorage.getItem(TUT_STEP_KEY);
    if (savedStep !== null && !tutDone) {
      setTimeout(function() { renderTutorial(parseInt(savedStep)); }, 300);
    }
  };

})(window.PR);
