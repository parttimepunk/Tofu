# 当前交接 — 2026-10-24

下一位协作者先读 AGENTS.md，再读本文件；不要根据旧安装包或早期设计稿判断当前产品状态。

## 当前可用版本

- Web 0.2 主线：可安装网页应用。最新功能为混合文件拖入、MIME 缺失时扩展名回退、自动分类、可见拖入提示和导入后显示全部类型。
- 正式图标已更新为暖灰米色底写实白豆腐。用户已在手机添加主屏幕、在 Mac 操作 Safari 安装，并反馈实际拖入“可以啦”。
- 用户截图显示已登录，曾出现 Synced / Syncing 状态；这是用户侧使用证据。**尚未完整记录：双向新增/修改 + 另一端打开原文件的验收过程**。不可继续写成“从未注册账号”，也不可据此宣布全部同步验收完成。
- 旧 Swift 原生 Mac 0.1 是独立本地实现，未接入上述同步。原生图标仍是先前版本；不要拿它覆盖新网页安装版。

## 已实现

媒体复制导入、混合拖放、类型分类、链接/笔记、搜索、标签/合集、收藏、Date Added / Creative Order、恢复移除；独立账号、显式连接、前台自动同步、离线程序壳、账号隔离、版本竞争及冲突保留。

## 公开仓库配置

个人部署域名、项目标识、部署 ID 与电脑路径已移出公开文件。默认无云端连接，使用者可本地使用；同步须自建 Supabase。表、RPC 和存储名仍为通用的 `tofu_sync_state`、`tofu_save_snapshot`、`tofu-media`。

当前发布的是源码，不改动既有个人线上部署。LICENSE 仅允许个人非商业用途；不采用 MIT。

## 验证证据

- 当日 Web 功能发布：18 项单元/存储回归、生产构建、线上 9 类拖放检查、5 类离线检查通过。
- 更早完整界面回归：12 项导入/播放/搜索/布局/恢复检查；320/390/768/1280 宽度。测试均使用独立上下文和生成素材。
- 原生版：当日早期 8 项 CLT 存储回归通过，原生构建与播放验证曾完成；整理未改业务逻辑。
- 生产截图精选在 `docs/assets/`。新目录搬入自包含的生成测试素材，浏览器脚本不再依赖旧机器的 work 目录。
- 本轮源码整理的复核结果见本文件末尾追加，不能把早前结果假装成新目录实测。

## 下一步（按优先级）

1. 用已登录的真实设备完成双向新增、编辑和原件读取验收；用户自己操作账号，不索取密码。
2. 按用户已确认的公开仓库与个人非商业许可证发布；后续修改不得恢复私有配置。
3. 如出现一直 Syncing / Waiting to retry，保留库、查看错误与连接，不清空存储。复盘见 pitfalls.md。
4. 以后按实际需求考虑完整原件备份、较大文件分片、分享扩展、去重与更丰富链接预览；这些不是已实现功能。

## 交接底线

当前只保证 50 MiB/文件；同步在前台联网时运行；元数据备份不含原件；浏览器可清除本机存储；缺失预览不等于原件丢失。不使用真实库做回归，不自动删除备份、不永久清理移除项。

## 本轮整理后实测

在正式新目录 `Documents/ChatGPT/Tofu` 完成：

- npm ci 后固定 Vite 8.1.6；18 项单元/存储检查、生产构建、npm audit（0 漏洞）通过。
- 本地生产预览 127.0.0.1:5183：9 类拖放、5 类离线、12 项界面/播放/响应式检查通过，均为隔离 Chrome 与生成素材。
- script/check_library.sh：8 项原生存储检查通过；本轮未重新打包/启动旧原生应用。
- 文档本地链接检查通过；待提交源码的旧命名扫描无匹配；秘密模式扫描未检出候选，不能代替未来人工提交审查。
- 发布构建资源哈希与线上最近版本一致；仅做本地整理，无新线上部署。
- 源码初次整理时 Git 已初始化；公开发布状态见本文件末尾。outputs/work/依赖/构建/环境文件均被忽略。

README 为入口；docs/assets 保留现行参考图，web/tests/fixtures 保留生成素材。其余旧工作资料未并入本目录。

## 公开源码发布准备

用户最终选择：公开仓库，但仅允许个人非商业使用；不采用 MIT。个人部署标识、后台 URL/key、机器路径和联系信息均已从待提交文件移除。公开代码默认本地模式，Supabase 由使用者通过 .env.local 自行配置，CSP 同步生成。环境示例为空，无作者后台。

公开版实测：18 项回归与构建通过；9 类拖放、12 项界面/播放、5 类离线检查通过；无配置时账号禁用、合成后台配置时表单可用，均使用隔离浏览器。未登录个人后台，未修改现有线上应用。原个人部署资料仅留在 Git 忽略的本机 work/ 恢复档案中；不随源码发布。

## 公开发布完成 — 2026-10-22

已按用户授权创建公开 GitHub 仓库并推送 main 分支，使用新的干净提交历史。79 个文件，提交前检查未检出原个人标识或秘密模式；.env.example 为空示例，未上传 work/ 或真实配置。许可证为 Tofu Personal Noncommercial License 1.0，仅允许个人自用，不采用 MIT、不允许商用。Git 提交身份采用项目通用名称与平台隐私邮箱。实际仓库地址以 Git origin 为准，个人部署地址不写入源码。既有个人线上服务未重新部署。

## 2026-10-23 — Image cropping and quick rename

Crop Image preserves the original and stores a validated normalized optional crop in schema v1. Gallery and detail share the same crop. Free bounds and 1:1 / 4:5 / 3:4 / 16:9 / 9:16 are supported; Reset restores the full view. Dark-border detection is a suggestion requiring review, never an automatic destructive edit. Rename changes the display title, not the original filename. Existing Edit retains Notes. Both changes use the current metadata sync.

21 unit checks, build, 12 existing UI checks, and the generated mobile crop/rename flow passed locally. New script: web/scripts/crop-check.mjs. Actual iPhone/cloud crop display remains unverified. User explicitly approved updating the existing website and GitHub source on 2026-10-23; publication verification is recorded below.

### Publication verification

The user authorized website + GitHub updates. The existing private-config deployment was updated on 2026-10-23. Live-domain crop/rename checks passed (suggestion, save/reload, 4:5, reset and no runtime errors), along with 12 existing UI/playback checks and 5 offline checks. Unit suite: 21 passing. Tests used generated media in isolated browser contexts without signing into the personal account. Public-source privacy scan passed; production configuration remains only in ignored local files/builds. No new backend schema migration or paid service was introduced. Actual iPhone cross-device crop display still requires user acceptance.

## 2026-10-24 — Pre-save import review

Mobile and Mac web file-picker/drop imports now open Review Import before storage. Review title, notes and image crop in one flow; Save to Library / Save & Next commits one item. Cancel discards only pending items. Original bytes are not modified; unsupported preview can Save Original. The account scope is checked before commit; saving blocks cancel and duplicate saves. No cloud/local media writes are performed during preview.

Local checks passed: 21 unit checks and build; mobile + desktop review flow (including zero writes before save, cancellation, multi-item partial confirmation, crop/title/notes persistence); existing 12 UI checks, 9 drop checks and crop/reset regression.

Accepted future direction: link import from Threads and the other requested social platform, with image previews and selection before saving. This extraction feature is not implemented in this release and needs representative links and a feasibility check.

Publication: the import-review correction was deployed to the existing personal site under the prior crop/rename update authorization. Live mobile and desktop review checks passed, along with 5 offline checks. No personal test account was used and no existing media or backend schema was modified. Public source keeps deployment configuration excluded. Actual iPhone and Safari-installed Mac behavior awaits user acceptance; automated viewport checks use isolated Chrome.

### Optional import source link — 2026-10-24

Review Import now includes Source link (optional) for image/video/audio imports, reusing sourceURL metadata and the existing Source detail link. Blank input is accepted; non-http(s) values are rejected before any storage write; surrounding whitespace is removed. No content extraction, schema change or backend service is introduced.

Verification/publication: 21 unit checks and production build passed; mobile and desktop import-review checks passed both locally and on the existing live site, including blank links, unsafe-link rejection without file writes, saved links after reload, and cancellation. Validation messages clear when correcting input. Public-source scan passed. The source-link refinement was deployed within the ongoing import-review update scope; no private test account or cloud data was used.

## 2026-10-24 — Link image import development (not deployed)

Implemented Add → Images from Link, complete-gallery extraction for supported anonymous Xiaohongshu pages, selection, and pre-save review with source/title prefilled. The authenticated same-origin API restricts hosts, redirects, MIME and sizes; platform cookies are never forwarded. A Mac bookmark collector supports already-open signed-in posts, requiring the DOM image count to match the visible slide counter. Threads is not implemented.

Real supplied post: anonymous fetch returned a shell without images. Read-only DOM collection found five distinct images matching the five-slide counter; all five image bytes fetched without platform cookies. An isolated app check displayed five real previews through the handler with a test-only auth adapter, then cancelled without saving or cloud writes. This does not prove anonymous extraction, production auth integration, actual Safari bookmark execution or iPhone paste-only success. Real links, access parameters and media stay ignored in work/outputs.

Local evidence: 32 unit checks, production build, synthetic five-preview/two-save link flow, existing 12 UI/playback/responsive checks and optional-source pre-save review regression passed. No personal account or cloud write was used. Deployment now needs Node Functions and includes API/server modules; actual platform packaging is still unverified. Link-proxy limit is 3 MiB/image; local file import stays 50 MiB. No schema migration or paid service. This feature remains local, uncommitted and not pushed or deployed. See development.md for instructions and limitations.

### Publication verification — 2026-10-24

User explicitly approved updating the current website and GitHub source. The deployment was built on the existing free project, verified to contain a Node Function, then promoted to the existing production domain. The function returned 401 JSON for missing and invalid credentials (the latter exercised the real auth provider); it was not served as static source. Live isolated checks passed: synthetic five-image/two-save selection and review flow, pre-save crop/title/notes/optional-source regression, and five offline-shell checks. The new selection test now accepts TOFU_TEST_URL and intercepts all Supabase traffic, avoiding real cloud writes. Successful real-account extraction through the deployed API and actual Safari bookmark/iPhone use remain unverified. Earlier five-real-image local evidence still applies, including anonymous-page failure. No new paid service or schema change. GitHub source publication follows the same authorization after privacy scanning; deployment identifiers/configuration remain local-only.

### Error diagnosis refinement — 2026-10-24

User reported raw “Load failed” in the installed Safari web app. Production logs showed real POST requests reaching the function with 422 responses; an actual app retry displayed “Use a specific Xiaohongshu post link” despite a valid post URL, consistent with the upstream redirect being rejected as a non-post path. This does not establish the cause of the original transport message. Redirects away from the post now explain platform access failure; network failures distinguish Tofu sign-in, importer connection and upstream platform. The collector instructions expand only for post/image access failure, not every transport or sign-in problem. 37 unit checks and build passed; synthetic import flow passed. This is an error-diagnosis fix, not a bypass of platform login or verification.

A subsequent real installed-app retry reached parsing but rejected HTTP CDN image metadata as “Only supported HTTPS links are accepted.” Known image CDN metadata now upgrades to HTTPS before validation; HTTP pages/arbitrary hosts remain rejected and no plaintext request is made. Added regression; 38 unit checks and production build passed. Error refinement redeployed within the ongoing feature-fix scope.

Final real installed Safari web-app retry after the fix displayed the explicit platform-redirect explanation, confirming the request reaches the deployed importer but this post still cannot be imported anonymously. No images were saved. Do not describe this as a successful real-account gallery import.

## Safari Save to Tofu shortcut trial — 2026-10-24

User accepted starting the iPhone Safari shortcut direction after rejecting bookmark setup. Added a Safari-share-only shortcut generator, DOM-only post capture with count verification, signed local trial artifact and optional build-time download packaging. No native app, paid developer membership, new service or schema migration. Browser extension for Dia remains unimplemented.

Captured images now survive the in-memory sign-in dialog: Sign In to Preview returns to the same capture, Retry Preview retries without pasting again. Import remains explicit pre-save review. Raw capture is not persisted as library data.

Evidence: 42 unit checks + build passed. Isolated mobile-sized browser test verified capture → sign-in → five previews → review with title/source → cancel with zero media items; all auth/images synthetic, no real cloud writes. macOS shortcuts sign succeeded, and the native import preview recognized Safari-only share input, JavaScript and connected Open URLs actions. Script execution is disabled in the local system; no security setting was changed, no shortcut was added or run. Real iPhone Safari layout, installation, permissions and actual post collection still need user acceptance. The artifact reads current page DOM only, not Cookie/session credentials; real private source URLs/media are not embedded or committed.

Publication verification: updated the existing site within the ongoing image-import release scope. HTTPS download returned 200, correct attachment filename and byte-for-byte match to the signed file. Live isolated Safari-capture/sign-in/review/cancel and existing link-selection checks passed; no real account or library was touched. One initial unbounded browser test stalled; a bounded rerun passed, and the script now uses explicit timeouts plus failure capture. No claim of iPhone end-to-end success. Source and generator are intended for the same authorized GitHub update; signed deployment-specific output stays ignored.
