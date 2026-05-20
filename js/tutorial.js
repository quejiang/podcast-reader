// tutorial.js — 14-step comprehensive onboarding covering all features
(function(PR) {
  'use strict';

  var TUT_KEY = 'pr-tutorial-v2';
  var TUT_STEP_KEY = 'pr-tutorial-step-v2';

  var isTouchDevice = ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // Shared body fragments to avoid repetition
  function mobileImportBody() {
    return '<strong>📱 四种导入方式：</strong><br><br>' +
      '1️⃣ <strong>复制文字</strong> → 长按中间空白区域 → 粘贴<br>' +
      '2️⃣ 点顶栏 <kbd>&#128193; 导入文件</kbd> → 选择文件<br>' +
      '3️⃣ 点 <kbd>&#9881; 设置</kbd> → 导入 → 粘贴网页 URL<br>' +
      '4️⃣ 从其他 App <strong>分享</strong> → 选择「磨耳朵」<br><br>' +
      '<small style="color:var(--text-dim)">📄 支持 PDF (含OCR) / EPUB / 图片OCR / TXT / Markdown / RSS</small>';
  }
  function desktopImportBody() {
    return '<strong>四种导入方式：</strong><br><br>' +
      '1️⃣ 直接<strong>粘贴</strong>文字到中间区域 (Ctrl+V)<br>' +
      '2️⃣ 点顶栏 <kbd>&#128193; 导入文件</kbd> 或<strong>拖入</strong>文件<br>' +
      '3️⃣ 点 <kbd>&#9881; 设置</kbd> → 导入 → 输入网页 URL<br>' +
      '4️⃣ <strong>拖拽文件</strong>到窗口直接导入<br><br>' +
      '<small style="color:var(--text-dim)">📄 支持 PDF (含OCR扫描件) / EPUB / 图片OCR / TXT / Markdown / RSS</small>';
  }

  function mobileSettingNote() {
    return '<br><small style="color:var(--text-dim)">💡 点 <kbd>&#9881; 设置</kbd> 有 7 个标签页可深度定制</small>';
  }
  function desktopSettingNote() {
    return '<br><small style="color:var(--text-dim)">💡 点 <kbd>&#9881; 设置</kbd> 进入 7 个标签页深度定制</small>';
  }

  PR.initTutorial = function() {
    window.showTutorial = function(step) {
      renderTutorial(step !== undefined ? step : 0);
    };
    PR.showTutorial = window.showTutorial;

    function renderTutorial(step) {
      var steps = [
        // Step 0: Welcome
        {
          icon: '&#127911;',
          title: '欢迎使用磨耳朵',
          body: '把文字变成播客，像听播客一样<strong>磨耳朵</strong>。<br><br>' +
            '支持 <kbd>txt</kbd> <kbd>md</kbd> <kbd>pdf</kbd> <kbd>epub</kbd> <kbd>图片</kbd> <kbd>RSS</kbd> <kbd>网页</kbd> 等多种导入方式。<br>' +
            '4 种 TTS 引擎 | 词级同步高亮 | 书签批注 | PWA 离线 | MP3 导出<br><br>' +
            '<strong>准备好了吗？跟着指引快速上手 👇</strong>',
          tip: null
        },
        // Step 1: Import
        {
          icon: '&#128193;',
          title: '第1步：导入文字内容',
          body: (isTouchDevice ? mobileImportBody() : desktopImportBody()),
          tip: { el: '#text-display', msg: '👆 长按这里粘贴文字，或点顶栏 📁 导入', pos: 'bottom' }
        },
        // Step 2: Playback basics
        {
          icon: '&#9654;',
          title: '第2步：开始播放',
          body: isTouchDevice ?
            '<strong>📱 手机操作：</strong><br><br>' +
            '&#8226; 点底部 <strong>▶ 播放</strong> 开始朗读<br>' +
            '&#8226; 朗读时文字<strong>逐词橙色高亮</strong>，自动跟随<br>' +
            '&#8226; 顶栏切换 <kbd>0.75x</kbd> ~ <kbd>2x</kbd> 语速<br>' +
            '&#8226; 点 <kbd>&#9664;&#9664;</kbd> <kbd>&#9654;&#9654;</kbd> 后退/前进 15 秒<br>' +
            '&#8226; <strong>拖拽进度条</strong>跳转到任意位置<br>' +
            '&#8226; 暂停后恢复自动回退几秒，不会跟丢' :
            '<strong>开始播放：</strong><br><br>' +
            '&#8226; 点底部 <strong>▶ 播放</strong> 或按 <strong>空格键</strong><br>' +
            '&#8226; 文字<strong>逐词橙色高亮</strong>，自动跟随<br>' +
            '&#8226; 顶栏切换 <kbd>0.75x</kbd> ~ <kbd>2x</kbd> 语速<br>' +
            '&#8226; 按 <kbd>←</kbd> <kbd>→</kbd> 方向键快退/快进<br>' +
            '&#8226; <strong>拖拽进度条</strong>任意跳转<br>' +
            '&#8226; 暂停后恢复自动回退几秒，不会跟丢',
          tip: { el: '#btn-play', msg: '👆 点击这里开始播放', pos: 'top' }
        },
        // Step 3: Bookmarks & annotations
        {
          icon: '&#128278;',
          title: '第3步：书签 & 批注',
          body: isTouchDevice ?
            '<strong>📱 随时标记重点：</strong><br><br>' +
            '&#8226; 点 <kbd>&#128278; 书签</kbd> 按钮 → 输入备注<br>' +
            '&#8226; 进度条上的<strong>绿点</strong>就是书签，点击跳转<br>' +
            '&#8226; <strong>选中文字</strong> → 点弹出的 <kbd>+批注</kbd> 添加笔记<br>' +
            '&#8226; 批注文字有<strong>绿色下划线</strong>，点击查看<br>' +
            '&#8226; 再次点 <kbd>&#128278;</kbd> 打开书签面板，一键跳转' :
            '<strong>随时标记：</strong><br><br>' +
            '&#8226; 按 <kbd>B</kbd> 或点 <kbd>&#128278; 书签</kbd> 添加书签<br>' +
            '&#8226; 进度条上的<strong>绿点</strong>就是书签，点击跳转<br>' +
            '&#8226; <strong>选中文字</strong> → 点弹出的 <kbd>+批注</kbd> 添加笔记<br>' +
            '&#8226; 批注文字有<strong>绿色下划线</strong>，悬停查看<br>' +
            '&#8226; 再次点 <kbd>&#128278;</kbd> 打开书签面板，一键跳转',
          tip: { el: '#btn-bookmark', msg: '👆 标记当前位置，方便回顾', pos: 'bottom' }
        },
        // Step 4: Save episodes & sidebar
        {
          icon: '&#128190;',
          title: '第4步：保存播客集',
          body: isTouchDevice ?
            '<strong>📱 管理你的播客：</strong><br><br>' +
            '&#8226; 点右上 <kbd>&#128190; 保存</kbd> 存入播客集<br>' +
            '&#8226; 点左上 <kbd>&#9776;</kbd> 打开侧边栏查看所有播客<br>' +
            '&#8226; 点播客标题<strong>切换播放</strong>（自动保存进度）<br>' +
            '&#8226; 开启 &#128257; <strong>连续播放</strong> → 播完自动下一集<br>' +
            '&#8226; 侧边栏顶部<strong>搜索框</strong>快速查找播客集<br>' +
            '&#8226; 删除可<strong>撤销</strong>（5 秒内点击撤销）<br><br>' +
            '<small style="color:var(--text-dim)">💡 数据存 IndexedDB，支持海量播客集</small>' :
            '<strong>管理播客集：</strong><br><br>' +
            '&#8226; 点右上 <kbd>&#128190; 保存</kbd> 存入播客集<br>' +
            '&#8226; 点左上 <kbd>&#9776;</kbd> 打开侧边栏<br>' +
            '&#8226; 点播客标题<strong>切换播放</strong>（自动保存进度）<br>' +
            '&#8226; 开启 &#128257; <strong>连续播放</strong> → 自动播下一集<br>' +
            '&#8226; 顶部搜索框<strong>全文搜索</strong>播客集<br>' +
            '&#8226; 删除可<strong>撤销</strong>（5 秒内点击撤销）<br><br>' +
            '<small style="color:var(--text-dim)">💡 数据存 IndexedDB，支持海量播客集</small>',
          tip: { el: '#btn-save', msg: '👆 保存当前内容为播客集', pos: 'bottom' }
        },
        // Step 5: Display modes
        {
          icon: '&#9878;',
          title: '第5步：显示模式',
          body: isTouchDevice ?
            '<strong>📱 三种显示模式：</strong><br><br>' +
            '&#8226; <kbd>&#9878; 聚焦模式</kbd> — 只高亮当前段落，沉浸阅读<br>' +
            '&#8226; <kbd>&#9655; 卡拉OK</kbd> — 当前行居中大字，适合跟读<br>' +
            '&#8226; <kbd>&#9889; 紧凑模式</kbd> — 压缩朗读停顿，更高效<br>' +
            '&#8226; <kbd>&#9788; 主题</kbd> — 暗色/浅色一键切换<br><br>' +
            '<strong>视觉定制：</strong><br>' +
            '&#8226; 设置 → 显示 → 字号 / 行高 / 边距 / 字体<br>' +
            '&#8226; 支持 <strong>OpenDyslexic</strong>（阅读障碍友好字体）<br>' +
            '&#8226; 支持霞鹜文楷 / Noto / 思源等中文排版字体<br>' +
            '&#8226; 朗读时自动平滑滚动' :
            '<strong>三种显示模式：</strong><br><br>' +
            '&#8226; <kbd>&#9878; 聚焦模式</kbd> (F) — 只高亮当前段落<br>' +
            '&#8226; <kbd>&#9655; 卡拉OK</kbd> (K) — 当前行居中大字<br>' +
            '&#8226; <kbd>&#9889; 紧凑模式</kbd> — 压缩停顿更高效<br>' +
            '&#8226; <kbd>&#9788; 主题</kbd> — 暗色/浅色一键切换<br><br>' +
            '<strong>视觉定制：</strong><br>' +
            '&#8226; 设置 → 显示 → 字号 / 行高 / 边距 / 字体<br>' +
            '&#8226; 支持 <strong>OpenDyslexic</strong>（阅读障碍友好）<br>' +
            '&#8226; 霞鹜文楷 / Noto Sans / 思源体 / 系统默认<br>' +
            '&#8226; 朗读时自动平滑滚动跟随',
          tip: { el: '#btn-focus', msg: '👆 试试聚焦模式，沉浸阅读', pos: 'bottom' }
        },
        // Step 6: Sleep timer
        {
          icon: '&#9201;',
          title: '第6步：定时关闭',
          body: isTouchDevice ?
            '<strong>📱 睡前听书必备：</strong><br><br>' +
            '&#8226; 点 <kbd>&#9201; 定时</kbd> → 选 15/30/45/60 分钟<br>' +
            '&#8226; 倒计时在按钮右上角实时显示<br>' +
            '&#8226; 时间到自动停止播放<br>' +
            '&#8226; 中途点 <kbd>&#9201; 定时</kbd> → 关闭可取消<br><br>' +
            '<small style="color:var(--text-dim)">💡 配合 Edge TTS 锁屏播放，睡前听书完美组合</small>' :
            '<strong>睡前听书必备：</strong><br><br>' +
            '&#8226; 点 <kbd>&#9201; 定时</kbd> → 选 15/30/45/60 分钟<br>' +
            '&#8226; 倒计时在按钮右上角实时显示<br>' +
            '&#8226; 时间到自动停止<br>' +
            '&#8226; 再次点击选"关闭"可取消<br><br>' +
            '<small style="color:var(--text-dim)">💡 配合 Edge TTS 锁屏播放，睡前听书完美组合</small>',
          tip: { el: '#btn-sleep', msg: '👆 设置定时关闭，安心入睡', pos: 'bottom' }
        },
        // Step 7: AB loop + progress drag
        {
          icon: '&#128257;',
          title: '第7步：A-B 循环 & 拖拽跳转',
          body: isTouchDevice ?
            '<strong>📱 精听利器：</strong><br><br>' +
            '&#8226; <strong>A-B 循环</strong> — 反复听某一段落<br>' +
            '&#8226; 点击进度条任意位置 → <strong>拖拽</strong>微调<br>' +
            '&#8226; 循环区间在进度条上有<strong>A/B 标记</strong>高亮<br><br>' +
            '<strong>桌面端：</strong><br>' +
            '&#8226; 按 <kbd>[</kbd> 设 A 点（循环起点）<br>' +
            '&#8226; 按 <kbd>]</kbd> 设 B 点（循环终点）<br>' +
            '&#8226; 按 <kbd>\\</kbd> 取消循环' :
            '<strong>精听利器：</strong><br><br>' +
            '&#8226; 按 <kbd>[</kbd> 设 A-B 循环 <strong>起点</strong><br>' +
            '&#8226; 按 <kbd>]</kbd> 设 A-B 循环 <strong>终点</strong><br>' +
            '&#8226; 按 <kbd>\\</kbd> 取消循环<br>' +
            '&#8226; 进度条上显示<strong>A/B 区域高亮</strong>标记<br>' +
            '&#8226; <strong>拖拽进度条</strong>精确定位（支持触摸拖拽）<br>' +
            '&#8226; 适合反复精听某一段落',
          tip: { el: '#progress-bar', msg: '👆 点击或拖拽进度条跳转', pos: 'top' }
        },
        // Step 8: AI voice engines
        {
          icon: '&#129302;',
          title: '第8步：AI 语音引擎',
          body: isTouchDevice ?
            '<strong>4 种 TTS 引擎可选：</strong><br><br>' +
            '&#8226; <strong>系统 TTS</strong> — 浏览器自带，免费，离线可用<br>' +
            '&#8226; <strong>Edge TTS</strong>（推荐⭐）— 微软免费，26种中文音色<br>' +
            '&#8226; <strong>ElevenLabs</strong> — 顶级 AI 音质，接近真人<br>' +
            '&#8226; <strong>OpenAI TTS</strong> — 6 种声音，按量付费<br><br>' +
            '<strong>Edge TTS 无需 API Key</strong>，每月免费 50 万字符。<br>' +
            '选中后<strong>锁屏也能继续播放</strong>（后台播放）。<br>' +
            '点击 <kbd>&#9881; 设置</kbd> → AI 语音 切换引擎。' :
            '<strong>4 种 TTS 引擎可选：</strong><br><br>' +
            '&#8226; <strong>系统 TTS</strong> — 浏览器自带，免费离线<br>' +
            '&#8226; <strong>Edge TTS</strong>（推荐⭐）— 微软免费，26种中文音色<br>' +
            '&#8226; <strong>ElevenLabs</strong> — 顶级 AI 音质，接近真人<br>' +
            '&#8226; <strong>OpenAI TTS</strong> — 6 种声音，按量付费<br><br>' +
            '<strong>Edge TTS 无需 API Key</strong>，每月免费 50 万字符。<br>' +
            '选中后支持<strong>后台锁屏播放</strong>。<br>' +
            '点击 <kbd>&#9881; 设置</kbd> → AI 语音 切换引擎。',
          tip: { el: '#btn-settings', msg: '👆 点击设置配置 AI 语音引擎', pos: 'bottom' }
        },
        // Step 9: MP3 export
        {
          icon: '&#127925;',
          title: '第9步：导出 MP3',
          body: isTouchDevice ?
            '<strong>把文字变成音频文件：</strong><br><br>' +
            '&#8226; 使用 <strong>Edge TTS 或 AI 引擎</strong>播放<br>' +
            '&#8226; 点底部 <kbd>MP3</kbd> 按钮导出<br>' +
            '&#8226; Edge TTS 模式下<strong>后台合成全文</strong>并导出<br>' +
            '&#8226; AI 模式下导出已播放部分的音频<br>' +
            '&#8226; 导出文件命名自动取播客标题<br><br>' +
            '<small style="color:var(--text-dim)">💡 导出的 MP3 可离线听，或导入播客 App</small>' :
            '<strong>把文字变成音频文件：</strong><br><br>' +
            '&#8226; 使用 <strong>Edge TTS 或 AI 引擎</strong>播放<br>' +
            '&#8226; 点底部 <kbd>MP3</kbd> 按钮导出<br>' +
            '&#8226; Edge TTS 模式<strong>后台合成全文</strong>并导出<br>' +
            '&#8226; AI 模式导出已播放部分<br>' +
            '&#8226; 文件命名自动取播客标题<br><br>' +
            '<small style="color:var(--text-dim)">💡 导出的 MP3 可离线听，或导入其他播客 App</small>',
          tip: { el: '#btn-export-mp3', msg: '👆 导出为 MP3 音频文件', pos: 'top' }
        },
        // Step 10: Settings — display + pron dict + tags
        {
          icon: '&#9881;',
          title: '第10步：深度定制',
          body: isTouchDevice ?
            '<strong>设置里有 7 个标签页：</strong><br><br>' +
            '&#8226; <strong>AI 语音</strong> — 引擎 / 音色 / API Key / 回退续播<br>' +
            '&#8226; <strong>显示</strong> — 字号 12-40px / 行高 / 边距 / 字体<br>' +
            '&#8226; <strong>词典</strong> — 自定义发音替换（如 zhí → zhi）<br>' +
            '&#8226; <strong>导入</strong> — RSS 订阅 / URL 抓取 / Google Drive<br>' +
            '&#8226; <strong>同步</strong> — WebDAV 云端备份 / JSON 导入导出<br>' +
            '&#8226; <strong>统计</strong> — 已听字数 / 时长 / 播放次数<br>' +
            '&#8226; <strong>关于</strong> — 版本号 / GitHub / 技术栈' :
            '<strong>设置里有 7 个标签页：</strong><br><br>' +
            '&#8226; <strong>AI 语音</strong> — 引擎 / 音色 / API Key / 回退秒数<br>' +
            '&#8226; <strong>显示</strong> — 字号 12-40px / 行高 / 边距 / 字体<br>' +
            '&#8226; <strong>词典</strong> — 自定义发音替换（如 zhí → zhi）<br>' +
            '&#8226; <strong>导入</strong> — RSS 订阅 / URL 抓取 / Google Drive<br>' +
            '&#8226; <strong>同步</strong> — WebDAV 云端备份 / JSON 导入导出<br>' +
            '&#8226; <strong>统计</strong> — 已听字数 / 时长 / 播放次数<br>' +
            '&#8226; <strong>关于</strong> — 版本号 / GitHub / 技术栈',
          tip: { el: '#btn-settings', msg: '👆 打开设置，探索所有定制选项', pos: 'bottom' }
        },
        // Step 11: Sync & backup
        {
          icon: '&#9729;',
          title: '第11步：云端同步 & 备份',
          body: isTouchDevice ?
            '<strong>数据安全，换设备不丢失：</strong><br><br>' +
            '&#8226; <strong>WebDAV 同步</strong> — 支持 Nextcloud / ownCloud<br>' +
            '&#8226; 设置 → 同步 → 填入地址/用户名/密码<br>' +
            '&#8226; 开启自动同步：每次保存自动上传<br>' +
            '&#8226; 随时手动「立即同步」上传/下载<br>' +
            '&#8226; <strong>JSON 备份</strong> → 下载全部数据为文件<br>' +
            '&#8226; <strong>JSON 导入</strong> → 合并到现有数据<br>' +
            '&#8226; <strong>Bookmarklet</strong> → 任意网页一键发送到磨耳朵' :
            '<strong>数据安全，换设备不丢失：</strong><br><br>' +
            '&#8226; <strong>WebDAV 同步</strong> — 支持 Nextcloud / ownCloud<br>' +
            '&#8226; 设置 → 同步 → 填入 WebDAV 地址和凭证<br>' +
            '&#8226; 开启自动同步：每次保存自动上传<br>' +
            '&#8226; 随时手动「立即同步」上传/下载<br>' +
            '&#8226; <strong>JSON 导出</strong> → 下载全部数据<br>' +
            '&#8226; <strong>JSON 导入</strong> → 合并到现有数据<br>' +
            '&#8226; <strong>Bookmarklet</strong> → 任意网页一键发送到磨耳朵',
          tip: { el: null, msg: '', pos: 'bottom' }
        },
        // Step 12: Tags + search
        {
          icon: '&#127991;',
          title: '第12步：标签 & 搜索',
          body: isTouchDevice ?
            '<strong>📱 高效管理大量播客集：</strong><br><br>' +
            '&#8226; 侧边栏 <kbd>&#127991; 标签</kbd> → 添加分类标签<br>' +
            '&#8226; 预置红/橙/绿/蓝/金/紫 6 种颜色<br>' +
            '&#8226; 侧边栏<strong>搜索框</strong> → 搜标题/正文/标签<br>' +
            '&#8226; <kbd>&#128260; 排序</kbd> → 最新 / 字母 / 阅读进度<br>' +
            '&#8226; 播客集卡片显示标签 + 阅读进度百分比<br>' +
            '&#8226; 输入新标签名回车即创建' :
            '<strong>高效管理大量播客集：</strong><br><br>' +
            '&#8226; 侧边栏 <kbd>&#127991; 标签</kbd> → 添加分类标签<br>' +
            '&#8226; 预置红/橙/绿/蓝/金/紫 6 种颜色<br>' +
            '&#8226; 搜索框<strong>搜标题/正文/标签</strong><br>' +
            '&#8226; <kbd>&#128260; 排序</kbd> → 最新 / 字母 / 阅读进度<br>' +
            '&#8226; 播客集卡片显示标签 + 进度百分比<br>' +
            '&#8226; 输入新标签名回车即创建',
          tip: { el: '#btn-tag-ep', msg: '👆 为播客集添加标签分类', pos: 'bottom' }
        },
        // Step 13: Install PWA + shortcuts
        {
          icon: '&#128241;',
          title: '第13步：安装到桌面',
          body: isTouchDevice ?
            '<strong>把网页变成手机 App：</strong><br><br>' +
            '<strong>🍎 iPhone (Safari)：</strong><br>' +
            '点底部 <kbd>⎋ 分享</kbd> → <strong>「添加到主屏幕」</strong><br><br>' +
            '<strong>🤖 Android (Chrome/Edge)：</strong><br>' +
            '点右上 <kbd>⋮</kbd> → <strong>「安装应用」</strong><br><br>' +
            '<strong>安装后的好处：</strong><br>' +
            '&#8226; 桌面点图标打开，<strong>全屏无地址栏</strong><br>' +
            '&#8226; <strong>离线也能用</strong>（飞行模式下打开）<br>' +
            '&#8226; 长按图标 → 「新建朗读」「继续上次」<br>' +
            '&#8226; 微信文章 → 分享 → 选择<strong>「磨耳朵」</strong><br>' +
            '&#8226; 新版本可用时<strong>自动提示刷新</strong>' :
            '<strong>把网页变成独立应用：</strong><br><br>' +
            '<strong>Chrome / Edge / Brave：</strong>地址栏右侧安装图标<br>' +
            '<strong>Safari：</strong>文件 → 添加到程序坞<br><br>' +
            '<strong>安装后：</strong><br>' +
            '&#8226; 独立窗口运行，全屏无干扰<br>' +
            '&#8226; <strong>离线可用</strong>，无需网络<br>' +
            '&#8226; 新版本自动提示刷新',
          tip: { el: '#btn-install', msg: '👆 一键安装到桌面', pos: 'bottom' }
        },
        // Step 14: Final — shortcuts + tips
        {
          icon: isTouchDevice ? '&#127881;' : '&#9000;',
          title: isTouchDevice ? '全部掌握！' : '快捷键 & 实用技巧',
          body: isTouchDevice ?
            '你已经学会了所有功能 🎉<br><br>' +
            '&#8226; 底部 <kbd>?</kbd> 按钮可随时重新查看教程<br>' +
            '&#8226; <kbd>&#9733; 功能全览</kbd> 按钮查看所有功能清单<br>' +
            '&#8226; 朗读停止后会自动保存进度<br>' +
            '&#8226; 设置 → 显示 → 调整到最舒适的视觉<br><br>' +
            '<strong>💻 电脑快捷键一览：</strong><br>' +
            '<kbd>Space</kbd> 播放/暂停 &nbsp; <kbd>←→</kbd> 快退/快进<br>' +
            '<kbd>B</kbd> 书签 &nbsp; <kbd>F</kbd> 聚焦 &nbsp; <kbd>K</kbd> 卡拉OK<br>' +
            '<kbd>[</kbd> AB起点 &nbsp; <kbd>]</kbd> AB终点 &nbsp; <kbd>\\</kbd> 取消<br>' +
            '<kbd>Esc</kbd> 停止 &nbsp; <kbd>H</kbd> 重新教程<br>' +
            '拖拽文件到窗口直接导入 📂<br><br>' +
            '享受你的播客时光吧 ☕' :
            '快捷键一览 ⌨<br><br>' +
            '<table style="width:100%;font-size:13px;border-collapse:collapse;text-align:left">' +
            '<tr><td style="padding:3px 8px"><kbd>Space</kbd></td><td>播放/暂停</td><td style="padding:3px 8px"><kbd>←→</kbd></td><td>快退/快进</td></tr>' +
            '<tr><td style="padding:3px 8px"><kbd>B</kbd></td><td>添加书签</td><td style="padding:3px 8px"><kbd>F</kbd></td><td>聚焦模式</td></tr>' +
            '<tr><td style="padding:3px 8px"><kbd>K</kbd></td><td>卡拉OK</td><td style="padding:3px 8px"><kbd>Esc</kbd></td><td>停止播放</td></tr>' +
            '<tr><td style="padding:3px 8px"><kbd>[</kbd></td><td>AB 循环起点</td><td style="padding:3px 8px"><kbd>]</kbd></td><td>AB 循环终点</td></tr>' +
            '<tr><td style="padding:3px 8px"><kbd>\\</kbd></td><td>取消循环</td><td style="padding:3px 8px"><kbd>H</kbd></td><td>重新教程</td></tr>' +
            '</table><br>' +
            '<strong>实用技巧：</strong><br>' +
            '&#8226; 拖拽文件到窗口直接导入 📂<br>' +
            '&#8226; 点 <kbd>&#9733;</kbd> 查看完整功能清单<br>' +
            '&#8226; 设置 → 同步 → Bookmarklet 实现任意网页一键朗读<br>' +
            '&#8226; 底部 <kbd>?</kbd> 按钮可随时重新查看本教程<br><br>' +
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
        5: { el: '#btn-focus', msg: '👆 聚焦模式 / 卡拉OK / 紧凑模式', pos: 'bottom' },
        6: { el: '#btn-sleep', msg: '👆 定时关闭，安心入睡', pos: 'bottom' },
        7: { el: '#progress-bar', msg: '👆 点击或拖拽进度条', pos: 'top' },
        8: { el: '#btn-settings', msg: '👆 设置 → AI 语音，切换引擎', pos: 'bottom' },
        9: { el: '#btn-export-mp3', msg: '👆 导出 MP3 音频', pos: 'top' },
        10: { el: '#btn-settings', msg: '👆 点击设置深度定制一切', pos: 'bottom' },
        11: { el: null, msg: '', pos: 'bottom' },
        12: { el: '#btn-tag-ep', msg: '👆 添加标签分类', pos: 'bottom' },
        13: { el: '#btn-install', msg: '👆 安装到桌面', pos: 'bottom' }
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
      var isZh = PR.locale === 'zh-CN';
      var demoText = isZh ?
        '人工智能正在深刻改变我们的生活方式。从智能手机上的语音助手，到自动驾驶汽车，再到医疗诊断中的影像分析，AI 已经渗透到了社会的方方面面。\n\n在语音技术领域，文本转语音（TTS）系统已经从早期的机械式发音，发展到了今天几乎可以以假乱真的自然语音合成。现代 TTS 不仅能准确读出文字，还能根据上下文调整语调、语速和情感表达。\n\n深度学习模型的突破是这一进步的关键。通过在海量语音数据上训练，AI 学会了人类说话时的微妙变化——什么时候停顿、什么时候重读、什么时候加快或放慢。\n\n对于学习语言的人来说，这意味着一场革命。你不再需要找人朗读给你听，也不需要反复听同一段录音。只需要把文字投喂给 AI，它就能像一位耐心的朗读者一样，用自然的语调为你读出每一个字。\n\n这就是"磨耳朵"的意义所在——通过反复聆听，让耳朵逐渐适应目标语言的节奏和语调。就像婴儿学说话一样，听多了，自然就会了。\n\n无论是准备雅思听力考试，还是想提高英语语感，或是单纯想用碎片时间多吸收一些信息，文字转语音都是你的得力助手。\n\n打开一本书，粘贴一段文字，点击播放，闭上眼静静听。知识就这样流进了耳朵里。' :
        'Artificial intelligence is profoundly reshaping the way we live. From voice assistants on our smartphones, to self-driving cars, to medical imaging diagnostics, AI has permeated every corner of society.\n\nIn the realm of speech technology, text-to-speech systems have evolved from early robotic-sounding voices into remarkably natural speech synthesis indistinguishable from human speech. Modern TTS not only reads text accurately, but also adjusts intonation, pacing, and emotional expression based on context.\n\nThe breakthrough of deep learning models is key to this progress. By training on vast amounts of speech data, AI has learned the subtle nuances of human speech — when to pause, when to emphasize, when to speed up or slow down.\n\nFor language learners, this represents a revolution. You no longer need to find someone to read aloud for you, nor listen to the same recording over and over. Simply feed text to the AI, and it becomes a patient narrator, reading every word aloud with natural intonation.\n\nThis is the essence of podcast reading — through repeated listening, let your ears gradually adapt to the rhythm and tone of the target language. Much like how babies learn to speak, the more you listen, the more naturally it comes.\n\nWhether you are preparing for an English listening exam, improving your sense of the language, or simply making the most of your spare moments to absorb more information, text-to-speech is your indispensable companion.\n\nOpen a book, paste a passage, press play, close your eyes, and listen. Knowledge flows straight into your ears.';

      PR.elText.textContent = demoText;
      PR.elTitle.value = isZh ? 'AI 与语音技术 · 演示播客' : 'AI & Speech Tech · Demo Podcast';
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
      PR.toast(isZh ? '已加载演示内容，点击 ▶ 播放试试吧' : 'Demo content loaded. Press ▶ to try it out!');

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
    var tutDone = localStorage.getItem(TUT_KEY);
    if (savedStep !== null && !tutDone) {
      setTimeout(function() { renderTutorial(parseInt(savedStep)); }, 300);
    }
  };

})(window.PR);
