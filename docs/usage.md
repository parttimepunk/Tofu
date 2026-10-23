# 安装与同步

## 手机

iPhone Safari 打开 自己部署的 Tofu HTTPS 地址 → 分享 → 添加到主屏幕 → 名称 Tofu → 如果有“作为网页 App 打开”则开启 → 添加。之后从桌面白豆腐图标进入。

## Mac

macOS 14+ Safari 打开同一网址 → 文件（繁体“檔案”）→ 添加到程序坞（繁体“加入 Dock 中…”）→ 添加。它会保存在个人 `~/Applications` 文件夹，可从 Dock 或 Spotlight 搜索打开。旧原生 Mac 应用保留但数据独立，不要混用。

## 注册与连接

1. 右上角 ⋯ → Sign in / Create account → Create a Tofu account。
2. 自托管 Supabase 默认邮件服务先用该项目后台成员邮箱，自己另设至少 8 位密码；不在聊天或仓库填写密码。
3. 点 Create Account，完成邮件确认，然后回到桌面 Tofu 登录。
4. Settings → Review & connect。空库点 Connect account library；想保留并上传之前的未登录素材，选 Copy … local items & connect。
5. 另一端用同一个 Tofu 账号登录并连接；无需再注册。

## 日常使用

- 可以直接把图片、视频、音频文件拖入窗口；出现绿色虚线后松开，也可 + → Photos & Files。
- 自动按媒体类型分组，不会自动给画面内容生成 AI 标签。导入复制原件；每个文件最多 50 MiB。
- 文件没有传入时，按提示从 Finder 拖原件；不能仅靠 file:// 路径访问电脑文件。
- Save Link 仅保存网址/文字，不会从社交平台下载视频。
- Date Added 是收藏日期；Creative Order 是独立手动编排。Recently Removed 可恢复。

## 自动同步

连接后自动运行：修改后约 1.2 秒触发，前台每 15 秒检查远端，切回应用和恢复联网也尝试。Syncing… = 正在同步；Synced = 本端本次完成；Sync now = 手动立即尝试；Pause sync = 暂停。

保存较大素材后等 Synced 再关闭；两端保持打开并联网进行验收。锁屏、后台或关闭不能保证持续同步。

## 验收清单

- 手机新增 Sync test 笔记 → 电脑出现。
- 电脑修改文字 → 手机更新。
- 从一端导入一张允许测试的图片/短视频 → 等 Synced → 另一端打开原件并播放（如适用）。
- 记录结果、设备和时间，再更新 handoff.md。不要仅根据状态文字宣布全部通过。

## 备份与问题排查

网页 Export metadata backup 不含原件，原文件另保留。原生 Export Library 才是完整 JSON + Media 目录。不要用清空浏览器存储修同步；保留报错/状态，先检查联网、账号一致与连接是否暂停。长时间卡住参照 [踩坑记录](pitfalls.md)。

## 图片裁剪与快速命名

- 在图库直接点图片下方的标题即可改名；默认保留导入文件名作为初始标题。详情页标题也可点按。更多备注仍在 Edit → Notes。
- 打开图片 → Crop Image。自由调整 Left/Top/Width/Height，或选择 1:1、4:5、3:4、16:9、9:16；固定比例后通过 Scale 和位置调整范围。
- Try removing dark borders 只给出暗色边缘建议，检查画面后再 Save Crop。暗色作品可能误识别，不会自动覆盖你的选择。
- Reset 后保存可恢复完整显示；原文件始终保留，裁剪目前只影响 Tofu 内的显示，不生成新的导出图片。标题与裁剪范围沿原有元数据同步，手机端仍需打开联网。
