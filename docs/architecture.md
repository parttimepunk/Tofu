# 架构与数据

## Web 主线

React/Vite 静态应用 → IndexedDB 本地库 → 登录后显式连接 → Supabase Auth / 私有对象存储 / PostgreSQL。

| 文件 | 职责 |
| --- | --- |
| `web/src/main.jsx` | 导航、表单、拖放接收、账号设置、同步触发 |
| `model.mjs` | schema v1、校验、时间/顺序、原生记录转换、三方合并 |
| `media-types.mjs` | MIME 与扩展名回退、批量导入前置校验、拖放文件提取 |
| `media.mjs` | 复制原文件、图片缩略图、尽力读取音视频元数据 |
| `storage.mjs` | IndexedDB 事务、账号分区、元数据快照 |
| `cloud.mjs` | 身份固定、对象上传、版本比较交换（CAS）、冲突保留、签名 URL |
| `style.css` | 响应式布局与两套主题 |
| `scripts/build-sw.mjs` | 程序缓存版本、离线策略及 Vercel 响应头 |
| `sync/schema.sql` | 表、RPC、RLS、私有 bucket 权限；首次建库 SQL，不是重复执行的迁移器 |

## 存储与账号

- IndexedDB：`tofu-library-v1`。`state` 按用户 ID 分区，未登录为 `local`；`files` 使用 `scope:assetId`。登录不会自动把未登录素材上传。
- 身份缓存键：`tofu.auth.v1`，与素材缓存分离。上传操作固定到启动时的账号，避免账号切换造成串库。
- 元数据：`public.tofu_sync_state`，每个 `auth.uid()` 一份带版本的文档，最多 10,000 项（客户端校验），数据库限制文档小于 4 MiB。
- 媒体：私有 `tofu-media`，路径 `uid/assetId/original`，新对象不覆盖；读取依赖账号路径权限与签名 URL。
- 当前单文件限制为 `50 * 1024 * 1024` 字节。页面显示“50 MB”，实际是 50 MiB。平台总容量/流量另受免费额度约束。

## 自动同步与冲突

首次 Review & connect，用户决定是否复制未登录素材，然后开始同步。新增/修改后约 1.2 秒触发；前台每 15 秒轮询；恢复联网、切回前台也触发。Sync now 可立即尝试，Pause sync 暂停。界面 Synced 是当前客户端状态，不代替另一台设备的实际验收。

同步先比较本地基线、本地改动与远端文档，再通过 `tofu_save_snapshot(expected_version, next_document)` 提交。版本竞争返回 `40001` 并重试；同字段冲突、移除与编辑冲突暂停并让用户保留版本，不能用最后写入覆盖掩盖冲突。

上传先复制原件；后台/关闭时不保证运行。另一端按需访问媒体，不能把“程序能离线打开”说成“所有原文件已下载到所有设备”。

## 离线与备份

Service worker 只缓存同源程序壳和静态图标，不缓存认证接口或私有云端媒体。缓存版本由构建内容哈希决定。浏览器数据仍可能被系统清理；不要清空站点数据修同步。

Export metadata backup 导出文档/同步状态，不含原件。原生 Mac Export Library 则复制 JSON + Media。两者不是同一种备份。

## 原生保留版本

SwiftPM + SwiftUI，媒体播放器通过 AppKit/AVKit 桥接。源码分 App / Views / Models / Stores / Services / Support；真实库位于 `~/Library/Application Support/Tofu`。测试必须使用任务生成的独立目录，绝不写入真实库。
