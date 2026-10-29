# Tofu Collector — 浏览器扩展试用版

Manifest V3，面向支持 MV3 的桌面 Chromium 浏览器。已做隔离 Chrome for Testing 回归；真实 Dia 的安装和真实帖子采集仍需验收。不是 iPhone Safari 扩展，不替代手机快捷指令，也不支持 Threads。

## 使用

一次安装：浏览器扩展管理页 → 开发者模式 → 加载已解压的扩展 → 选择生成的 Tofu-Collector 文件夹（包含 manifest.json）。不要选择仓库源码 extension/，其中没有个人站点配置。尚未发布 Chrome Web Store，不产生商店费用。日常不需要复制书签代码。

安装后刷新同一浏览器里的 Tofu 网页。进入 ＋ → Images from Link，填帖子链接，点 Open & Collect。帖子完整显示时会返回原 Tofu 标签页供选图，再进入裁剪、标题、备注、来源与保存。需要登录或验证时由用户完成，扩展不绕过。可以 Cancel Collection；图集数量不完整时不会返回部分图片。

另一入口：已经打开帖子时，点浏览器工具栏的 Tofu Collector → Collect This Post。将打开 Tofu 预览。若没固定图标，从浏览器 Extensions 菜单找到它即可。

在浏览器 Tofu 中使用同一账号；Safari 安装版与 Dia 的登录、本地库可能独立。若要自动同步，在 Settings 中显式连接账号库。扩展只交出预览地址，不会替用户上传/连接本地库，也不保存原件。

## 权限与数据

生成的 manifest 只允许自己的 Tofu HTTPS origin、指定的小红书域名。没有全网站权限、cookies、webRequest、历史记录或密码权限。content scripts 在隔离环境中读取帖子 DOM，传递标题、来源、图片地址与核对过的图片总数。不会读取 Cookie/账号密码/隐藏平台状态，不修改已有素材。

自动收集仅针对用户从 Tofu 新开的任务；最多等待十分钟。任务临时存在 extension storage.session，不同步到账号，关闭标签页/取消后清理。只有配置的顶层 Tofu 页面可创建任务，只有任务对应帖子可回传。结果仍由 Tofu 用户勾选与保存。页面源码改动、懒加载、平台登录/验证码和 CDN 访问限制仍可能导致失败。书签与手机入口保留。

## 构建

在仓库根目录，设置自己的站点地址（示例 origin 不是作者后台）：

```sh
TOFU_SITE_URL=https://tofu.example node extension/build.mjs outputs/Tofu-Collector
```

个人站点被写入生成的 config.mjs/manifest.json，因此生成物留在被 Git 忽略的 outputs/，不能作为作者配置提交到公共源码。构建复用 safari-share.mjs 的 DOM 采集器，但只在生成的扩展内替换 Safari 专用错误提示，不改动已签名手机文件。

Web：`cd web && npm test && npm run build`。
隔离扩展验证：`PLAYWRIGHT_BROWSERS_PATH=<task-owned-browser-path> node scripts/extension-check.mjs`（从 web/ 运行）。需要 Playwright 对应的 Chrome for Testing；当前正式 Chrome/Edge 不支持相同命令行侧载方式。测试用自己的 profile、合成帖子/媒体/账号并拦截云端请求，不使用个人浏览记录或账号。

许可证沿用仓库的个人非商业使用许可。
