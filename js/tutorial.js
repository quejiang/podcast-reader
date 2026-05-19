// tutorial.js — 9-step onboarding tutorial
(function(PR) {
  'use strict';

  var TUT_KEY = 'pr-tutorial-done';
  var TUT_STEP_KEY = 'pr-tutorial-step';

  PR.initTutorial = function() {
    var tutDone = localStorage.getItem(TUT_KEY);
    window.showTutorial = function(step) {
      renderTutorial(step !== undefined ? step : 0);
    };

    PR.showTutorial = window.showTutorial;

    function renderTutorial(step) {
      var steps = [
        { icon: '&#127911;', title: '欢迎使用磨耳朵', body: '把文字变成播客，像平时听播客一样<strong>磨耳朵</strong>。<br><br>支持 <kbd>txt</kbd> <kbd>md</kbd> <kbd>pdf</kbd> <kbd>epub</kbd> <kbd>图片</kbd> <kbd>RSS</kbd> <kbd>网页</kbd> 等多种导入方式。<br><br>准备好了吗？跟着指引快速上手 👇' },
        { icon: '&#9997;', title: '第 1 步：导入内容', body: '<strong>三种方式导入文字：</strong><br><br>1️⃣ 直接<strong>粘贴</strong>文字到中间区域<br>2️⃣ <strong>拖入</strong> txt / pdf / epub / 图片文件<br>3️⃣ 点击顶部 <kbd>&#9881; 设置</kbd> → 输入网页 URL 或 RSS 地址<br><br>试试看：任意网页按 <kbd>F12</kbd> 打开控制台，粘贴前面提供的 Bookmarklet 脚本即可一键导入当前网页。' },
        { icon: '&#9654;', title: '第 2 步：开始播放', body: '点击底部<strong>播放按钮</strong>或按<strong>空格键</strong>开始朗读。<br><br>朗读时：<br>&#8226; 当前词会<strong>高亮显示</strong>，自动跟随<br>&#8226; 顶部可切换 <kbd>0.75x</kbd> ~ <kbd>2x</kbd> 语速<br>&#8226; 按 <kbd>&#9664;&#9664;</kbd> <kbd>&#9654;&#9654;</kbd> 或 <kbd>←</kbd> <kbd>→</kbd> 快退/快进 15 秒' },
        { icon: '&#128278;', title: '第 3 步：书签 & 批注', body: '<strong>随时标记，随时回顾：</strong><br><br>&#8226; 按 <kbd>b</kbd> 或点击右上 <kbd>&#128278;</kbd> 添加<strong>书签</strong><br>&#8226; 进度条上的绿点就是书签，点击可跳转<br>&#8226; 选中文字后弹出批注工具，添加<strong>批注</strong><br>&#8226; 批注文字会有下划线，点击可查看' },
        { icon: '&#128190;', title: '第 4 步：保存播客集', body: '点击右上 <kbd>&#128190; 保存</kbd> 存入侧边栏。<br><br>&#8226; 所有播客集自动保存到<strong>浏览器本地</strong><br>&#8226; 点击左侧 <kbd>&#9776;</kbd> 打开侧边栏管理<br>&#8226; 开启连续播放 &#128257; 可<strong>自动播下一集</strong><br>&#8226; 设置 → 同步 → 可导出/导入备份' },
        { icon: '&#128241;', title: '第 5 步：安装到手机', body: '<strong>把磨耳朵变成手机 App：</strong><br><br><strong>iPhone（Safari）：</strong><br>打开网址 → 点底部 <kbd>⎋ 分享</kbd> → <strong>「添加到主屏幕」</strong><br><br><strong>Android（Chrome）：</strong><br>打开网址 → 地址栏下方出现横幅 → 点<strong>「安装」</strong><br>或右上 <kbd>⋮</kbd> → 添加到主屏幕<br><br>安装后：<br>&#8226; 桌面点图标打开，全屏无地址栏<br>&#8226; 离线也能用（飞行模式下打开）<br>&#8226; 长按图标 → 快捷入口「新建朗读」<br>&#8226; 微信文章 → 分享到 → 选择「磨耳朵」<br><br><small style="color:var(--text-dim)">提示：锁屏播放选 Edge TTS，后台不中断</small>' },
        { icon: '&#9889;', title: '第 6 步：高级功能', body: '<strong>更多实用功能：</strong><br><br>&#8226; <kbd>&#9878; 聚焦模式</kbd> — 只高亮当前段落<br>&#8226; <kbd>&#9655; 卡拉OK</kbd> — 当前行居中大字显示<br>&#8226; <kbd>&#9889; 紧凑模式</kbd> — 去掉朗读间的停顿<br>&#8226; <kbd>&#9201; 定时关闭</kbd> — 睡前自动停<br>&#8226; <kbd>&#9788; 浅色主题</kbd> — 白天看更舒服<br>&#8226; <kbd>MP3 导出</kbd> — 需配置 AI 语音引擎' },
        { icon: '&#129302;', title: '第 7 步：AI 语音（可选）', body: '系统自带 TTS 免费，但音质机械。<br><br>想听<strong>接近真人</strong>的声音？<br><br>点击 <kbd>&#9881; 设置</kbd> → AI 语音 → 选择 <strong>Edge TTS</strong>（免费，推荐）、<strong>ElevenLabs</strong> 或 <strong>OpenAI TTS</strong>。<br><br>Edge TTS 无需 API Key，每月免费 50 万字符，26 种中文语音。<br><br>配置后即可启用 <strong>MP3 导出</strong>、情感参数调节等。' },
        { icon: '&#127881;', title: '全部掌握！', body: '你已经学会了所有核心功能 🎉<br><br>&#8226; 底部 <kbd>?</kbd> 按钮可随时重新查看教程<br>&#8226; 遇到问题？右下角 <kbd>?</kbd> 点击即可<br><br>享受你的播客时光吧 ☕' }
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

      if (btnPrev) btnPrev.addEventListener('click', function() { renderTutorial(step - 1); });
      if (btnNext) btnNext.addEventListener('click', function() { renderTutorial(step + 1); });
      if (btnFinish) btnFinish.addEventListener('click', finishTutorial);
      if (btnSkip) btnSkip.addEventListener('click', finishTutorial);

      showContextualTip(step);
      localStorage.setItem(TUT_STEP_KEY, step);
    }

    function showContextualTip(step) {
      var elTip = PR.$('#feature-tip');
      elTip.classList.remove('show');

      var highlights = {
        1: { el: '#text-display', msg: '👆 在这里粘贴文字或拖入文件', pos: 'bottom' },
        2: { el: '#btn-play', msg: '👆 点击播放或按空格键', pos: 'top' },
        3: { el: '#btn-bookmark', msg: '👆 添加书签标记当前位置', pos: 'bottom' },
        4: { el: '#btn-save', msg: '👆 保存为播客集', pos: 'bottom' },
        5: { el: null, msg: '', pos: 'bottom' },
        6: { el: '#btn-smart-speed', msg: '高级功能在这里', pos: 'top' },
        7: { el: '#btn-settings', msg: '👆 点击设置配置 AI 语音', pos: 'bottom' }
      };

      var h = highlights[step];
      if (!h) {
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
      PR.toast('已加载演示内容，点击播放试试吧');

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
