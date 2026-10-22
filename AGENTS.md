# Tofu — 项目协作规则

本文件供后续 AI / 开发者进入项目时先读。它保存长期约束，不充当进度日志。最新进度见 [docs/handoff.md](docs/handoff.md)，踩坑见 [docs/pitfalls.md](docs/pitfalls.md)。

## 产品与协作

- 产品名只有 **Tofu**。所有新增应用界面文案使用英文，与 用户 交流使用中文；技术说明用普通语言。
- 当前主线为 `web/` 的 React/Vite 可安装网页应用；Mac Safari 和 iPhone Safari 使用同一个独立账号同步。
- `Sources/Tofu/` 为保留的原生 Mac 本地版，数据独立。不能声称它已接入网页同步。不得拿旧原生包覆盖当前网页安装版。
- 未有真实证据前，不宣称原生 iOS、分享扩展、CloudKit、后台同步或设备双向验收完成。
- 修改前简短说明范围；普通可撤销修改直接推进。发布、对外发送、开通服务及费用必须有对应授权，已有同范围授权不重复询问。
- 用户已授权本次公开 GitHub 发布，许可证仅限个人非商业用途。未来其他发布或部署仍需对应授权。

## 视觉约束

- Apple 风格：紧凑工具栏、桌面源列表侧栏、图片优先画廊、可选详情；手机 Library / Collections / Search 导航。避免营销式大卡片。
- System / Light / Dark。Light accent `#38755F`；Dark accent `#82A68F`；canvas `#FCFCFC` / `#111111`；selection `#E1ECE5` / `#293A31`。
- 不重新引入被否定的明亮薄荷绿 `#1FD8A4`；导入媒体保持原色。
- 正式网页图标为暖灰米色背景的写实白豆腐，母版 `web/assets/icon-master.png`。不要使用旧几何图标重新生成网页资源。

## 数据、安全与同步

- 导入复制原文件；移除可恢复；不新增永久清除功能，除非用户再次明确要求。
- 元数据损坏或版本不支持时保留原件、禁写；结构变更需要显式迁移。
- 原生真实库 `~/Library/Application Support/Tofu` 禁用于测试；浏览器也必须用隔离上下文、生成的测试素材。
- 后台仅使用 Tofu 独立免费项目；禁止使用其他 App 的数据库、账号、密钥、对象或记录。禁止开通付费服务。
- 前端只能有公开 publishable key；禁止提交 service-role、密码、会话、令牌、私有素材、真实库备份或作者个人部署标识。后台配置通过 .env.local 注入，默认本地模式。
- 保持账号隔离、首次连接明确选择、CAS 版本检查、三方合并与冲突保留。不能用“清空浏览器数据”作为常规修复。
- 自动同步依赖打开、前台和联网；不要承诺锁屏/关闭后的可靠后台同步。元数据导出不含原文件。

## 文件与验证

- 本目录是整理后的正式源码。源码：`web/`、`Sources/Tofu/`；文档：`docs/`；本机交付：`outputs/`；临时文件：`work/`。
- Git 排除 `outputs/`、`work/`、依赖、构建目录、部署关联、环境文件；精选参考图放 `docs/assets/`。不要粗暴 `git add` 被忽略的目录。
- Web 修改必做：`cd web && npm test && npm run build`。拖放、播放或缓存改动再运行对应 `scripts/*-check.mjs`；不要只凭构建通过判断交互完成。
- 原生生命周期使用 `script/build_and_run.sh`，存储回归使用 `script/check_library.sh`；只有 CLT 时别把 XCTest 不可用误判为产品失败。
- 更新进度时维护 `docs/handoff.md`；稳定决定进 `docs/decisions.md`；新坑进 `docs/pitfalls.md`。记录已验证事实、用户反馈、待验收三种证据边界。
