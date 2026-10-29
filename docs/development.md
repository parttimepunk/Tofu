# 开发、检查与发布

## Web 主线

Node 22.12+，本机 Node 26.1.0 / macOS 15；lockfile 固定依赖。全新目录运行：

```sh
cd web
npm ci
npm test
npm run build
npm run dev
```

默认 dev 为 127.0.0.1:5180。生产预览：`npm run preview -- --port 5182`。

浏览器测试使用独立上下文，不登录真实业务账号；生成素材在 `web/tests/fixtures/`，任何运行输出进入被 Git 排除的 outputs/ 或 work/。默认 Chrome 路径为 Mac 系统安装位置，其他电脑使用 `TOFU_CHROME_PATH` 指定现有 Chrome 可执行文件。不要求下载第二套浏览器。

```sh
# 先在另一个终端保持 preview 服务运行
cd web
TOFU_TEST_URL=http://127.0.0.1:5182/ node scripts/drop-check.mjs
TOFU_TEST_URL=http://127.0.0.1:5182/ node scripts/offline-check.mjs
TOFU_TEST_URL=http://127.0.0.1:5182/ node scripts/browser-check.mjs
```

`drop-check` 验证混合拖放与分类；`offline-check` 验证程序壳/保存/断网恢复；`browser-check` 是更广的导入/播放/编辑/布局回归。不是所有媒体编码都能播放，读取元数据失败时仍需保留原件。

图标再生成（macOS）：`cd web && swift scripts/make_icons.swift public`。母版在 assets，产物在 public，构建只发布产物。

## 原生 Mac 保留版

```sh
./script/build_and_run.sh --build-only
./script/check_library.sh
# 确实要打开原生本地版时才运行：
./script/build_and_run.sh
```

输出到 outputs/；选项包括 --verify / --debug / --logs / --telemetry。注意 `run` 会关闭同名原生进程再启动；这与网页安装版不是同一源码。CLT 环境不能运行 XCTest 时用独立运行时检查，完整 Xcode 可另运行 `swift test`。

## 自己部署新的后台

公开源码不带作者的后台配置。需要同步时：

```sh
cd web
cp .env.example .env.local
```

在 `.env.local` 中填写自己的 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_PUBLISHABLE_KEY`，然后重启 dev 或重新 build。两个变量都未配置时，应用只使用本地库，登录入口禁用；不会请求作者的后台。Vite 客户端环境变量对访问者可见，因此只能放公开 publishable key，绝不能放 service-role/secret key。

`build-sw.mjs` 根据同一环境配置生成 CSP 的 HTTPS/WSS 白名单，无需手改作者项目域名。schema.sql 为第一次建库，不可对现有生产库盲目重跑；后续结构变更单独写迁移。验证 RLS、对象路径权限、匿名访问拒绝和并发 CAS 后再连接个人数据。

Auth 精确设置 Site URL/回跳为最终 HTTPS 域名；不加任意通配、不关闭邮件确认。默认 SMTP 及额度以 [官方文档](https://supabase.com/docs/guides/auth/auth-smtp) 为准。

## 发布自己的项目

发布/费用需要用户明确授权。源码 GitHub 公开发布已获授权；重新部署网站或开通后台仍需对应授权。只更新代码文档不需要重新部署线上应用。

1. `npm test && npm run build`，浏览器完成受影响的交互检查。
2. 仅关联/发布 `web/dist/` 到自己的 Tofu 项目。Vite 重建后必须重新确认 dist 关联；不要从 web/ 或仓库根发布。
3. 使用已登录的 Vercel CLI 的当前 `--help` 核对命令，dry-run 审查发布文件。链接图片版预期 12 个（原静态资源加 API 入口和服务模块）；验证 API 被识别为函数。排除测试、会话、依赖和真实素材。
4. 确认免费计划、项目名与正式域名；只在授权范围内执行生产部署。
5. 检查 HTTP、manifest、PNG、service worker/security headers，再在隔离上下文运行功能与离线检查；更新 handoff 中部署 ID、时间和实测结果。

不要把任何本机会话路径、账号 token 或 `.vercel` 目录复制进仓库。禁止把其他 App 项目当作便捷发布目标。

## 小红书图片导入

入口：Add → Images from Link。先尝试读取公开帖子的完整图片列表；只有封面或空页面时明确失败。选图后进入 Review Import，逐张裁剪、改名、备注和保存；预览不写入素材库。Threads 尚未接入。

API 为 `web/api/import-link.mjs` + `web/server/link-import.mjs`，Vite dev/preview 使用同一处理器。生产 build 在 dist 生成 API 和服务模块，需要支持 Vercel Node Functions，纯静态托管无法执行。已验证 Vercel 函数打包及线上未登录/无效凭证拒绝；真实账号成功提取仍需用户验收。仅使用公开项目配置；未配置或未登录时拒绝请求。

只允许指定帖子域名及图片 CDN，逐跳检查重定向，不接收或转发平台 Cookie。Tofu 登录凭证仅发往自己的 Supabase 验证身份。HTML 限 3 MB、单图限 3 MiB、最多 30 张，不保证原始最高分辨率；没有通用网页代理或付费服务。使用时须遵守平台条款及原作者授权。

匿名读取失败时，Mac 的 Collect from Page 提供书签代码。在已登录、打开的帖子中由用户点击，只收集标题、来源、图片地址，并要求图片数匹配可见页码。它不读 Cookie、localStorage 或后台状态。结果放 URL fragment，进入 Tofu 后立即清除；来源可能保留平台访问参数，分享前请留意。图片懒加载不全时会停止并提示浏览全部图片后再试。真实 Safari 书签操作、iPhone 操作尚未验收，不能承诺手机只贴链接就成功。

检查：`npm test && npm run build`；保持 `npm run dev -- --port 5188`，运行 `node scripts/link-images-check.mjs`。该脚本使用合成登录/API，验证 5 张预览、选 2 张、保存前编辑、来源及失败反馈，不能当作真实平台匿名提取证据。真实链接、访问参数、页面捕获和第三方素材只放忽略的 work/outputs。

## Safari 分享快捷指令（试用）

生成器 web/scripts/make-safari-shortcut.mjs 只接收使用者自己的 HTTPS Tofu origin，不内置作者域名或账号。输出 JSON 到忽略的 work/，用系统 plistlib 转成 XML plist，再通过 macOS shortcuts sign --mode anyone --input ... --output ... 签名；源码模板可公开，含个人部署地址的生成文件不能提交 Git。

构建时可设置 TOFU_SAFARI_SHORTCUT_PATH 为已签名文件的绝对路径，build-sw 将其复制到 dist/Save-to-Tofu.shortcut 并设置下载文件名。没有该变量时不发布下载文件，也不改变静态资源数量。带此文件的发布清单为 13 个文件。快捷指令不会加入离线程序壳缓存。

快捷指令仅显示在 Safari 网页的分享表单，读取 DOM 中的帖子标题、来源及图片地址，核对图片数与页面计数一致后把结果通过 URL fragment 交给 Tofu。片段到达后清除。失败由快捷指令显示错误并停止，不把错误文本当 URL 打开。它不读取 Cookie、账号密码或平台后台状态，也不自动保存图片。

使用：iPhone Safari 下载签名文件，在“文件 → 下载项”打开并添加；若系统提示脚本关闭，由用户自己在“设置 → 快捷指令（部分系统在 App 内）→ 高级 → 允许运行脚本”选择开启。系统首次会要求网页访问授权。此操作扩大快捷指令读取网页的能力，不能由代理静默更改。见 [Apple 说明](https://support.apple.com/guide/shortcuts/apdfeb05586f/ios)。

日常：Safari 打开完整帖子（必要时登录）→ 分享 → Save to Tofu → 勾选 → Review → 裁剪/命名/Save。不是从小红书 App 分享一条 URL；Safari 网页若无图片或计数不完整，会停止。Safari 与主屏幕安装版的登录/本地存储可能独立，需要登录同一 Tofu 账号并在设置中连接账号库，不能承诺自动打开主屏幕版本。

验证：npm test 覆盖分享脚本与快捷指令连接结构；node scripts/safari-share-check.mjs 验证未登录时保留收集结果、登录后预览、来源/标题预填及取消零保存。全部使用合成账号/图片并拦截云端请求。macOS 的签名成功和导入动作预览不能替代真实 iPhone 网页/分享表单运行验收。

## 桌面浏览器扩展

见 [extension/README.md](../extension/README.md)。生成器 extension/build.mjs 复用 DOM 采集器，要求调用者传入自己的 HTTPS Tofu origin；生成的配置与安装包不得放入公开 Git。正式 Chrome/Edge 已移除相关命令行侧载开关，因此自动验证使用 Playwright 配套的 Chrome for Testing 和独立 profile。Browser plugin not available。实际 Dia 安装及权限授予要由用户确认后进行，不将 Chromium 隔离检查写成真实 Dia 验收。

构建时 VITE_TOFU_COLLECTOR_AVAILABLE=true 才显示下载入口；TOFU_COLLECTOR_ZIP_PATH 指向本机已准备的安装 zip，build-sw 将它复制至 dist/Tofu-Collector.zip 并设置附件下载头。两个变量应一起设置。和手机快捷指令同时发布时清单为 14 个文件，缺少包不能显示下载按钮。普通源码构建不附作者安装包。

主流程：Tofu/Images from Link → Open & Collect → 帖子完整 DOM → 原 Tofu 标签页的图片勾选 → Review Import → 确认保存。取消/关闭等待页面会撤销待办任务。工具栏可直接收集当前帖子到新 Tofu 标签页。已打开的帖子仍需可正常显示；验证、未加载完整图片或平台改版可能阻止收集。扩展不保证图片是最高分辨率，也不绕过平台限制。
