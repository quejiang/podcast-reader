# 🚀 磨耳朵 · Podcast Reader — 部署教程

本教程涵盖从零到上线的完整流程，选择任一平台即可。推荐 **Cloudflare Pages**（免费、全球 CDN、自动 HTTPS）。

---

## 目录

- [方式一：Cloudflare Pages（推荐）](#方式一cloudflare-pages推荐)
- [方式二：Vercel](#方式二vercel)
- [方式三：GitHub Pages](#方式三github-pages)
- [方式四：Netlify](#方式四netlify)
- [自定义域名](#自定义域名)
- [AI 语音配置](#ai-语音配置)
- [部署后检查清单](#部署后检查清单)
- [常见问题](#常见问题)

---

## 方式一：Cloudflare Pages（推荐）

**优点**：免费、全球 CDN 加速、自动 HTTPS、不限带宽、中国大陆访问速度优于 Vercel。

### 第一步：推送到 GitHub

如果你的代码还在本地，先推送到 GitHub：

```bash
cd podcast-reader

# 初始化 Git（如果还没有）
git init
git add .
git commit -m "feat: v3 — Edge TTS, Media Session, Share Target"

# 创建 GitHub 仓库后推送
git remote add origin https://github.com/你的用户名/podcast-reader.git
git branch -M main
git push -u origin main
```

### 第二步：连接 Cloudflare Pages

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧菜单选择 **Workers & Pages** → **Overview**
3. 点击 **Create application** → **Pages** → **Connect to Git**
4. 授权 GitHub，选择 `podcast-reader` 仓库
5. 配置构建设置：

   | 选项 | 值 |
   |------|-----|
   | **Production branch** | `main` |
   | **Build command** | *留空* |
   | **Build output directory** | *留空（或填 `.`）* |

   > 本项目是纯静态 HTML/JS/CSS，不需要构建步骤。

6. 点击 **Save and Deploy**

部署完成后，Cloudflare 会分配一个 `*.pages.dev` 域名（例如 `podcast-reader-xxx.pages.dev`）。

### 第三步：验证部署

打开分配的域名，你应该看到「磨耳朵」界面：

- 粘贴一段文字，点击播放 ▶ — 确认系统 TTS 正常
- 点击 ⚙ 设置 → AI 语音 → 选择「Edge TTS」→ 保存 → 播放 — 确认免费 AI 语音正常
- 在手机浏览器打开 → 添加到主屏幕 — 确认 PWA 安装正常
- 锁屏后查看通知栏 — 确认 Media Session 显示

---

## 方式二：Vercel

**优点**：部署极快、自动 HTTPS、免费额度充足。

### 命令行部署（最快）

```bash
cd podcast-reader
npx vercel --prod
```

首次运行会提示登录 Vercel，按提示操作即可。Vercel 会自动检测这是静态站点，无需任何配置。

### 网页端部署

1. 打开 [Vercel](https://vercel.com/)，用 GitHub 登录
2. 点击 **New Project** → 导入 `podcast-reader` 仓库
3. Framework Preset 选择 **Other**（或留空）
4. Build and Output Settings 全部留空
5. 点击 **Deploy**

### 提速建议

在项目根目录创建 `vercel.json`（可选）：

```json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache" },
        { "key": "Service-Worker-Allowed", "value": "/" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=3600" }
      ]
    }
  ]
}
```

> `sw.js` 禁止缓存是为了确保 Service Worker 更新时用户能立刻获取新版本。

---

## 方式三：GitHub Pages

**优点**：零外部依赖，就在 GitHub 上。

### 第一步：启用 GitHub Pages

1. 打开仓库 → **Settings** → **Pages**
2. **Source** 选择 `Deploy from a branch`
3. **Branch** 选择 `main`，文件夹选 `/ (root)`
4. 点击 **Save**

几分钟后，站点部署在 `https://你的用户名.github.io/podcast-reader/`。

### 第二步：调整路径

由于 GitHub Pages 部署在子路径下（`/podcast-reader/`），需要修改三个文件：

**`manifest.json`** — 修改 `start_url`：
```json
"start_url": "/podcast-reader/",
```

**`index.html`** — 修改 manifest 路径：
```html
<link rel="manifest" href="/podcast-reader/manifest.json">
```

**`js/app.js`** — Service Worker 注册路径不变（SW 作用域跟随页面路径）：
```js
// 保持不变
navigator.serviceWorker.register('sw.js').catch(function() {});
```

**`sw.js`** — 修改预缓存路径前缀：
```js
const ASSETS = [
  '/podcast-reader/',
  '/podcast-reader/index.html',
  '/podcast-reader/manifest.json',
  '/podcast-reader/css/style.css',
  '/podcast-reader/js/state.js',
  // ... 其余文件同理
];
```

> 如果用自定义域名则不需要这些修改。

---

## 方式四：Netlify

1. 打开 [Netlify](https://app.netlify.com/)，用 GitHub 登录
2. 点击 **Add new site** → **Import an existing project**
3. 选择 `podcast-reader` 仓库
4. Build command 留空，Publish directory 填 `.`
5. 点击 **Deploy site**

部署后可在 Site settings → Domain management 中设置自定义域名。

### SW 缓存头配置（可选）

在根目录创建 `netlify.toml`：

```toml
[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"

[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "public, max-age=3600"
```

---

## 自定义域名

所有平台都支持绑定你自己的域名。

### Cloudflare Pages

1. 进入项目 → **Custom domains**
2. 输入你的域名（如 `podcast.yourdomain.com`）
3. 如果域名已在 Cloudflare 管理，自动配置 DNS
4. 如果域名在其他平台，按提示添加 CNAME 记录

### Vercel

1. 项目 → **Settings** → **Domains**
2. 添加域名，按提示配置 DNS（CNAME 指向 `cname.vercel-dns.com`）

### GitHub Pages

1. Settings → Pages → Custom domain
2. 输入域名，保存
3. 在 DNS 服务商添加 CNAME 记录指向 `你的用户名.github.io`

---

## AI 语音配置

部署完成后，用户可在应用内配置 AI 语音。

### Edge TTS（免费，推荐）

1. 点击右上角 ⚙ → **AI 语音**
2. 选择 **Edge TTS（免费 · 推荐）**
3. 在下拉菜单中选择语音（晓晓、云希、云扬等 20+ 种）
4. 点击 **保存设置**
5. 无需任何 API Key

> 微软提供每月 **50 万字符**免费额度，个人使用完全足够。

### ElevenLabs（音质最佳）

1. 注册 [ElevenLabs](https://elevenlabs.io/)
2. 进入 [API Keys](https://elevenlabs.io/app/settings/api-keys) 页面
3. 复制 API Key，粘贴到设置面板
4. 免费额度：~10,000 字符/月

### OpenAI TTS

1. 注册 [OpenAI](https://platform.openai.com/)
2. 进入 [API Keys](https://platform.openai.com/api-keys) 页面
3. 创建新 Key，粘贴到设置面板
4. 按量付费，需绑定信用卡

---

## 📱 手机安装教程

部署完成后，在任何手机上都能把「磨耳朵」安装到桌面，像原生 App 一样使用。支持离线访问、锁屏控制和分享导入。

---

### iPhone / iPad（Safari）

<p>
<strong>第 1 步</strong>：用 <strong>Safari 浏览器</strong>打开你的「磨耳朵」网址（不支持微信/QQ 内打开）。
</p>

> 如果只是在微信里点链接，请点右上角 <kbd>···</kbd> → <strong>在 Safari 中打开</strong>。

<p>
<strong>第 2 步</strong>：点 Safari 底部工具栏中间的 <strong>分享按钮</strong> <kbd>⎋</kbd>（方框+向上箭头）。
</p>

<p>
<strong>第 3 步</strong>：往下滑，找到并点击 <strong>「添加到主屏幕」</strong>。
</p>

<p>
<strong>第 4 步</strong>：确认名称（默认为「磨耳朵」），点右上角 <strong>「添加」</strong>。
</p>

<p>
<strong>第 5 步</strong>：回到桌面，你会看到磨耳朵的 🎧 图标。点击即可打开，全屏运行，没有浏览器地址栏。
</p>

<details>
<summary>📸 图文对照（点击展开）</summary>

| 步骤 | 操作 | 画面 |
|------|------|------|
| 1 | Safari 打开网址 | 底部中间找到分享按钮（方框+↑） |
| 2 | 点击分享按钮 | 弹出分享菜单 |
| 3 | 往下滑 | 找到「添加到主屏幕」 |
| 4 | 确认名称 | 点击右上角「添加」 |
| 5 | 回到桌面 | 桌面出现 🎧 磨耳朵 图标 |

</details>

> **iOS 提示**：安装后如果锁屏播放几分钟就停，这是 iOS 系统限制。切换到 Edge TTS 模式（设置 → AI 语音 → Edge TTS）即可后台持续播放。

---

### Android（Chrome 浏览器）

<p>
<strong>第 1 步</strong>：用 <strong>Chrome 浏览器</strong>打开你的「磨耳朵」网址。
</p>

<p>
<strong>第 2 步</strong>：稍等 3~5 秒，地址栏下方会出现横幅提示 <strong>「将应用安装到设备」</strong>，点击即可。如果没有横幅，点右上角 <kbd>⋮</kbd> → <strong>「添加到主屏幕」</strong>或<strong>「安装应用」</strong>。
</p>

<p>
<strong>第 3 步</strong>：弹窗中点 <strong>「安装」</strong>。
</p>

<p>
<strong>第 4 步</strong>：桌面出现磨耳朵图标。长按图标还能看到快捷入口：「新建朗读」「继续上次」。
</p>

> **Chrome 提示**：安装后从桌面打开，如果仍然看到地址栏，说明没安装成功。检查网址是否以 `https://` 开头（必须 HTTPS 才能安装 PWA）。

---

### Android（Edge 浏览器）

1. 用 Microsoft Edge 打开网址
2. 底部弹出提示「将此网站添加到主屏幕」→ 点击
3. 点「安装」确认

Edge 对 PWA 支持良好，锁屏控制（Media Session）在 Edge 上体验最佳。

---

### Android（Firefox 浏览器）

Firefox 对 PWA 支持较弱，安装方式略有不同：

1. 用 Firefox 打开网址
2. 地址栏右侧出现「小房子+加号」图标 → 点击
3. 选择「添加到主屏幕」
4. 桌面出现快捷方式

> **注意**：Firefox 安装的是网页快捷方式，不是真正的 PWA。推荐用 Chrome 或 Edge 以获得完整体验。

---

### 华为手机（华为浏览器）

1. 用华为浏览器打开网址
2. **确保使用 `https://` 域名**（PWA 要求 HTTPS）
3. 浏览器检测到 PWA 后，底部出现「添加到桌面」提示 → 点击
4. 如果没有提示，点浏览器底部 <kbd>☰</kbd> → <strong>「添加到桌面」</strong>

> 华为浏览器基于 Chromium，PWA 支持较好。

---

### 小米手机（MIUI 浏览器）

1. 用 MIUI 自带浏览器打开 `https://` 域名
2. 底部菜单 <kbd>☰</kbd> → <strong>「添加到桌面」</strong>
3. 或使用 Chrome 浏览器安装（推荐，体验更好）

---

### OPPO / vivo / 其他安卓

大部分国产安卓浏览器对 PWA 支持不够完善。强烈建议：

1. 先安装 [Chrome 浏览器](https://play.google.com/store/apps/details?id=com.android.chrome)（或系统自带 Google Play 下载，或通过第三方应用商店搜索「Chrome」）
2. 在 Chrome 中打开网址 → 按上面 Android（Chrome）步骤安装

---

### 安装后如何验证

安装成功的关键标志：

| 验证项 | 预期效果 |
|--------|----------|
| 打开方式 | 点击桌面图标打开，**没有浏览器地址栏**，全屏运行 |
| 离线可用 | 播放一段内容后，开飞行模式，关掉 App 重新打开，仍能加载 |
| 锁屏控制 | 播放时锁屏，通知栏显示「磨耳朵」+ 播放/暂停按钮 |
| 分享导入 | 在微信/文件管理器中选择文字或文件 → 分享 → 在列表中选择「磨耳朵」 |
| 快捷入口 | 长按桌面图标 → 显示「新建朗读」「继续上次」 |

---

### 安装常见问题

<details>
<summary>Q: 为什么没有出现「添加到主屏幕」选项？</summary>

- **iOS**：必须用 Safari 打开，微信/QQ/支付宝内置浏览器不支持
- **安卓**：必须用 Chrome 或 Edge 打开，且网址必须是 `https://`
- 如果已经是 Safari/Chrome+HTTPS，多浏览几秒等待 Service Worker 注册完成再试
</details>

<details>
<summary>Q: 桌面图标打开后还有浏览器地址栏？</summary>

说明没有正确安装 PWA，只是添加了书签。确保：
- iOS：通过 Safari → 分享 → 添加到主屏幕
- Android：通过 Chrome → 安装应用（不是"添加到主屏幕"快捷方式）
- 网址必须是 `https://`
</details>

<details>
<summary>Q: 锁屏/后台播放几分钟就停了？</summary>

- iPhone 系统 TTS 模式下，iOS 会限制后台播放时长。**切换到 Edge TTS**（设置 → AI 语音 → Edge TTS → 保存）即可解决，因为 Edge TTS 使用 Audio 元素播放，天然支持后台。
- Android 一般没有此限制。
</details>

<details>
<summary>Q: PWA 版本太旧，怎么更新？</summary>

打开 PWA → 完全关闭 → 再打开一次。Service Worker 会在后台自动检测更新，第二次打开时就是新版本。如果还是旧的：浏览器打开 → 开发者工具 → Application → Service Workers → Unregister → 重新安装。
</details>

---

## 部署后检查清单

部署完成后逐项检查：

| # | 检查项 | 方法 |
|---|--------|------|
| 1 | 页面能正常打开 | 浏览器访问域名 |
| 2 | 粘贴文字后能播放 | 粘贴一段文字 → 点 ▶ |
| 3 | 变速播放正常 | 点击 1.5x / 2x 再播放 |
| 4 | 文件导入正常 | 拖入一个 TXT/PDF 文件 |
| 5 | Edge TTS 可用 | 设置 → Edge TTS → 播放 |
| 6 | MP3 导出可用 | Edge 模式播放一段 → 点 MP3 按钮 |
| 7 | PWA 可安装 | 手机浏览器打开 → 添加到主屏幕 |
| 8 | 离线可用 | 安装 PWA 后开飞行模式 → 仍能打开 |
| 9 | 锁屏控制显示 | 播放时锁屏 → 查看通知栏 |
| 10 | HTTPS 正常 | 域名显示锁图标 |

---

## 常见问题

### Q: 部署后 Edge TTS 无法使用？

A: 检查浏览器是否支持 WebSocket（所有现代浏览器均支持）。如果在中国大陆使用，微软语音服务可能被墙，建议配置代理或使用系统 TTS。

### Q: PWA 安装后还是旧版本？

A: Service Worker 缓存了旧版本。关闭 PWA → 浏览器打开 → 开发者工具 → Application → Service Workers → Unregister → 重新打开。

### Q: Share Target（分享导入）不生效？

A: Share Target 需要 PWA 安装后才能使用。在浏览器中打开 → 地址栏右侧出现安装图标 → 安装到桌面 → 从其他 App 分享文本/文件时选择「磨耳朵」。

### Q: 如何更新部署？

A: 推送新代码到 GitHub，Cloudflare Pages / Vercel / Netlify 会自动重新部署。GitHub Pages 需要等几分钟自动刷新。

### Q: 如何查看使用统计？

A: 如需统计，可在设置 → 关于 → 配置 Umami（自建网站分析工具）。Umami 免费开源，不追踪隐私。

### Q: 书签和批注数据存在哪里？

A: 全部存储在浏览器 localStorage 中，不上传到任何服务器。可以通过设置 → 同步 → 导出 JSON 备份，也可导入到其他设备。

---

## 技术参考

| 项目 | 说明 |
|------|------|
| **静态文件** | 纯 HTML + CSS + JS，无构建步骤 |
| **Service Worker** | 缓存静态资源，支持离线访问 |
| **Edge TTS** | WebSocket 连接微软语音服务 |
| **Media Session** | 锁屏/通知栏播放控制 |
| **Share Target** | PWA 分享入口 |
| **localStorage** | 播客集、书签、批注、设置 |

---

部署遇到问题？欢迎提 [GitHub Issue](https://github.com/quejiang/podcast-reader/issues)。
