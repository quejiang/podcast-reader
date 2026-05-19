# 🎧 磨耳朵 · Podcast Reader

把文字变成播客 — 用 AI 语音朗读任何文字，像听播客一样「磨耳朵」。

## 功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 🗣 **系统 TTS** | ✅ | Web Speech API，免费，离线可用 |
| 🤖 **AI 语音** | ✅ | Edge TTS（免费）/ ElevenLabs / OpenAI |
| 🆓 **Edge TTS** | ✅ | 微软免费语音，每月 50 万字符，无需 API Key |
| 📄 **多格式导入** | ✅ | PDF、EPUB、图片 OCR、TXT、Markdown |
| 🌐 **网页抓取** | ✅ | URL 抓取正文、RSS 订阅 |
| 🔖 **书签 & 批注** | ✅ | 随时标记，进度条可视化 |
| 📻 **MP3 导出** | ✅ | AI TTS 模式下导出音频文件 |
| 🎯 **聚焦 & 卡拉OK** | ✅ | 专注阅读、大字跟读 |
| 🌙 **暗色/浅色主题** | ✅ | 自动切换 |
| ⏱ **定时关闭** | ✅ | 睡前自动停止 |
| 📊 **使用统计** | ✅ | 已听字数、时长、次数 |
| 📱 **PWA** | ✅ | 可安装到桌面，离线可用 |
| 🔔 **锁屏控制** | ✅ | Media Session API，通知栏播放/暂停 |
| 📤 **分享导入** | ✅ | 从任意 App 分享文本/文件到磨耳朵 |
| 🔄 **数据同步** | ✅ | JSON 导入/导出备份 |

## 技术栈

- **纯前端** — Vanilla JavaScript，无需后端
- **PWA** — Service Worker 离线缓存 + Media Session + Share Target
- **Web Speech API** — 系统自带 TTS
- **Edge TTS** — 微软免费神经语音（WebSocket，无需 API Key）
- **AI TTS** — ElevenLabs Multilingual v2 / OpenAI TTS-1
- **PDF** — pdf.js
- **EPUB** — JSZip
- **OCR** — Tesseract.js (中文 + 英文)

## 快速开始

```bash
git clone https://github.com/quejiang/podcast-reader.git
cd podcast-reader
python3 -m http.server 8080
```

打开 `http://localhost:8080` 即可使用。

## 部署

详细教程见 **[DEPLOY.md](./DEPLOY.md)**，包含：
- 四种平台部署教程（Cloudflare Pages / Vercel / GitHub Pages / Netlify）
- **📱 各系统手机安装教程**（iPhone / Android / 华为 / 小米 / OPPO…）
- 自定义域名、AI 语音配置、排错指南

| 平台 | 难度 | 免费额度 |
|------|------|----------|
| **Cloudflare Pages**（推荐） | ⭐ | 无限 |
| **Vercel** | ⭐ | 100 GB/月 |
| **GitHub Pages** | ⭐ | 100 GB/月 |
| **Netlify** | ⭐ | 100 GB/月 |

## AI 语音配置

| 引擎 | 费用 | 音质 | 后台播放 | API Key |
|------|------|------|----------|---------|
| **Edge TTS**（推荐） | 免费 50 万字符/月 | ⭐⭐⭐⭐ | ✅ | 不需要 |
| ElevenLabs | 免费 ~1 万字符/月 | ⭐⭐⭐⭐⭐ | ✅ | 需要 |
| OpenAI TTS | 按量付费 | ⭐⭐⭐⭐⭐ | ✅ | 需要 |

设置路径：点击右上角 ⚙ → **AI 语音** → 选择引擎 → 保存。

## 项目结构

```
podcast-reader/
├── index.html            # 入口 HTML
├── manifest.json         # PWA 配置（含 Share Target）
├── sw.js                 # Service Worker
├── _headers              # Cloudflare 缓存规则（可选）
├── css/style.css         # 样式
├── js/
│   ├── state.js          # 全局状态 & 工具函数
│   ├── storage.js        # localStorage 读写
│   ├── highlight.js      # 字级高亮引擎
│   ├── bookmarks.js      # 书签系统
│   ├── annotations.js    # 批注系统
│   ├── tts.js            # Web Speech TTS
│   ├── edge-tts.js       # Edge TTS（免费微软语音）
│   ├── ai-tts.js         # AI TTS + MP3 导出
│   ├── player.js         # 播放控制 + Media Session
│   ├── import.js         # 文件导入 (PDF/EPUB/OCR/RSS)
│   ├── analytics.js      # 埋点 (Umami, 可选)
│   ├── ui.js             # UI 模式 & 设置面板
│   ├── tutorial.js       # 新手引导
│   └── app.js            # 事件绑定 & 初始化
└── DEPLOY.md             # 部署教程
```

## License

MIT
