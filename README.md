# 磨耳朵 · Podcast Reader

把文字变成播客，像平时听播客一样磨耳朵。

## 功能

- **TTS 朗读** — 基于浏览器 Web Speech API，免费无依赖
- **字数级高亮** — 读到哪里亮到哪里，自动滚动跟随
- **语速预设** — 一键切换 0.75x / 1x / 1.25x / 1.5x / 2x
- **音调调节** — 调整朗读音高
- **定时关闭** — 15/30/45/60 分钟自动停止，睡前必备
- **连续播放** — 播完一集自动跳到下一集
- **书签** — 随时标记位置，一键跳回
- **PDF 导入** — 拖入 PDF 自动解析文字
- **EPUB 导入** — 支持电子书格式
- **网页导入** — 输入 URL 自动抓取正文
- **AI 语音** — 可选接入 ElevenLabs / OpenAI TTS，音质接近真人
- **亮色/暗色主题** — 一键切换
- **PWA** — 可安装到桌面，离线可用，支持手机

## 使用方法

1. 用浏览器打开 `index.html`
2. 粘贴文字，或拖入 `.txt` `.md` `.pdf` `.epub` 文件
3. 点击播放按钮或按空格键开始朗读
4. 顶部工具栏可调速、调音调、换声音、定时关闭

## 快捷键

| 按键 | 功能 |
|---|---|
| 空格 | 播放 / 暂停 |
| ← → | 快退 / 快进 15 秒 |
| b | 添加书签 |
| Esc | 停止播放 |

## AI 语音配置

点击设置齿轮 → 选择 ElevenLabs 或 OpenAI TTS → 填入 API Key 即可。

### ElevenLabs（推荐，中文效果好）
1. 注册 [elevenlabs.io](https://elevenlabs.io) 获取 API Key
2. 在 Voice Lab 中选择或克隆一个中文声音，复制 Voice ID
3. 填入设置面板

### OpenAI TTS
1. 在 [platform.openai.com](https://platform.openai.com/api-keys) 创建 API Key
2. 填入设置面板，选择声音即可

## 部署

纯静态文件，直接部署到任意静态服务：

- **GitHub Pages** — Settings → Pages → 选 main 分支 root 目录
- **Vercel / Netlify** — 拖入文件夹即可
- **本地** — 双击 `index.html` 打开

## 技术栈

纯前端 · Web Speech API · pdf.js · JSZip · PWA
