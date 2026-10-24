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
