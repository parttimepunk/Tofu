# 踩坑记录

## 1. 误把原生与网页版本当成同一个库

**表现**：Mac 装了旧应用，手机却看不到数据。**原因**：Swift 本地库与网页 IndexedDB/Supabase 分离。**处理**：跨设备使用 Safari 安装版；已有库完整导出后由网页复制导入。**预防**：交接时明确入口、版本、数据目录，别直接合并两个 Media 目录。

## 2. 网页只有文件选择，没有拖放

**表现**：截图/视频拖入后没有导入。**原因**：早期网页没接 dragover/drop，原生版拖放能力不会自动继承到网页。**解决**：窗口级文件接收、绿色虚线提示、copy 行为、导入锁与不可写状态拦截。用户更新后已反馈实际可用。

## 3. 文件类型为空，或者导入后被筛选隐藏

**表现**：合法 MOV/M4A 被拒绝；在 Videos 下拖图片后以为没存。**原因**：浏览器 MIME 不总是完整；当前筛选与新素材类型不同。**解决**：媒体 MIME 优先，已知扩展名回退；混合导入后回到 All Types。批量先校验，再写文件。**限制**：分类成功不等于浏览器支持对应编码预览；读不了元数据仍保留原件。

## 4. 原生 App 拖出的只是 URL

**表现**：drag 没有实际 File 字节。**处理**：不尝试用网页读取任意 file:// 路径；提示导出/在 Finder 显示原件后再拖入。**证据边界**：实际 Tendedero 细节未做自动 OS 级检查，用户报告本轮拖入成功；不要推断所有外部 App 都兼容。

## 5. 离线重开看起来像丢数据

**原因 A**：资源响应带 Vary: Origin，缓存匹配漏掉 JS。**解决**：同源程序壳缓存匹配使用 ignoreVary，内容哈希更新缓存。

**原因 B**：测试点击保存后立即刷新，IndexedDB 事务未完成。**解决**：等待记录可见/保存成功及 service worker 控制，再离线重开。不要把测试时序问题当持久化失败，也不要用清空站点数据修复。

## 6. 登录成功却没上传 / 后台不更新

登录与连接是两步，首次 Review & connect 允许选择未登录素材是否复制；没有连接就不会上传。自动同步仅在打开、前台和联网时可靠触发，不承诺锁屏/关闭后的后台执行。Sync now 为手动立即重试，Pause sync 才暂停。Synced 不能代替另一端打开原件的验收。

## 7. 并发覆盖、账号切换与重复上传

客户端 Web Locks 只管同浏览器，不能管另一台设备。服务端 CAS + 三方合并保护跨设备，保存失败不推进本地基线。同步固定启动时身份，避免切换账号时串库；不可变对象遇到重复上传允许已有对象，不能用 upsert 覆盖。冲突暂停，Keep both 保留用户改动。

## 8. 默认验证邮件发不出去

默认 Supabase 发信限制组织成员邮箱且频率有限；个人先用后台账号邮箱注册独立 Tofu 密码。检查垃圾箱与页面报错，避免反复注册；不关闭邮箱确认。规则/额度会变，后续维护查 [官方 SMTP 文档](https://supabase.com/docs/guides/auth/auth-smtp)。

## 9. Vercel 发布目录错、构建后关联丢失

部署必须在 `web/dist/`，不在项目根或 `web/`；先 dry-run 看静态文件清单。Vite 重建 dist 会清掉 `.vercel` 关联；本轮曾因在错误目录调用而得到 Project is not linked，之后在正确目录关联处理。仅选 Tofu 项目，避免覆盖其他站点。

CLI 可能临时生成 `.env.local`，其中可有会话信息：不要打印、提交或打包它。凭据由本机工具保存，不写文档。当前仓库不附 `.vercel/project.json`，新机器须自行关联。

## 10. 图标黑方块 / 旧图标缓存

旧 AppKit 三通道绘制曾变黑；最终正式网页图标改用已选 RGB PNG 母版，通过 sips 缩放，不重新画几何图形。180/192/512 均检查尺寸和不透明。使用版本化资源名与内容哈希程序缓存；已安装 OS 图标缓存仍需设备观察，不承诺自动马上刷新。

## 11. 原生播放器与 CLT 测试

macOS 15 SwiftUI VideoPlayer 曾出现 superclass demangle 崩溃；改为 NSViewRepresentable 包装 AVPlayerView，并显式链接 AVKit。只有 CLT 时缺 XCTest，使用 `script/check_library.sh` 验证核心存储，保留 XCTest 给完整 Xcode 环境。

## 12. 预览尺寸与验收范围

嵌入浏览器曾未响应指定 viewport，实际仍是 324×649；精确布局与离线改用隔离 Playwright Chrome，并记录理由。生成设计图不是真机截图；测试素材不是个人库；技术检查通过不等于用户双端验收完成。

## 13. 交接包依赖本机临时目录

浏览器脚本原先引用 work/verification/Fixtures，新克隆缺这些文件。整理后将生成素材存入 web/tests/fixtures，并让输出目录自动创建。不要把 node_modules、构建产物、整个工作目录或个人素材当作“让测试能运行”的解决方案。

## 14. 整理前的依赖审计不能照抄旧结论

本轮 npm ci 后 audit 检出 Vite 8.1.4 开发工具安全公告；核对 [公告的修复版本](https://github.com/advisories/GHSA-587h-7wmj-h5pm)，将同版本线固定升级到 8.1.6，重跑测试、构建和 audit。结果为 0 漏洞，前端构建资源哈希保持一致。没有使用 audit fix --force，也未因此重新部署线上或修改用户数据。日后仍需重新审计，不能把本次 0 漏洞当永久保证。

## 15. Crop safety and asynchronous saves

Store normalized display bounds instead of replacing the image. A dark-edge detector can mistake dark artwork for borders, so suggestions require review. Rename the title independently from fileName and object paths. Browser checks must wait for the saved ratio to render, rather than only waiting for a button click. Reset must restore the original bounds.

## 16. Import review must precede persistence

Do not call importMedia while a selected image is merely being previewed: that function writes original blobs. Review uses temporary object URLs and disposes them on close. Only the explicit Save path imports originals and commits crop/title/notes. Batch cancel must not delete already confirmed items; it must not leave pending originals stored. Block cancel while committing, validate the active account, and propagate errors so a failed save never advances the queue.
