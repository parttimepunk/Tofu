# 视觉与素材

## 正式规范

英文 UI，紧凑工具栏、桌面侧栏、素材优先画廊。手机 Library / Collections / Search。System / Light / Dark 三种外观，图片原色不改。

| 用途 | Light | Dark |
| --- | --- | --- |
| 主画布 | #FCFCFC | #111111 |
| 分区表面 | #F7F9F8 | #1E211F |
| 选中背景 | #E1ECE5 | #293A31 |
| 强调色 | #38755F | #82A68F |
| 主文字 | #202020 | #EEEEEE |

不使用被否定的明亮薄荷绿。不要为保持绿色而给媒体加色罩。

## 图标

用户确认柔角写实白豆腐，并选定暖灰米色底（方向目标色 #C9C2B8；真实生成图含自然光影，不是纯色逐像素填充）。

- 母版：`web/assets/icon-master.png`，1254×1254 RGB，不透明。
- 产物：`web/public/icon-greige-180.png`（Apple touch）、192 / 512（网页/manifest）。
- 生成：`cd web && swift scripts/make_icons.swift public`。
- 内置 image_gen 精确编辑，以选定的白豆腐图为目标，只替换背景及接触阴影，保持造型、孔隙、朝向、尺寸、位置与光照；背景改为低饱和暖灰米色，无字、无碟、无边框。母版已是确认结果，无需再次生成。
- 原生 Mac 历史版本图标单独由 `script/make_icon.swift` 生成，不要误拿它覆盖网页图标。

## 参考图索引

- `assets/Tofu-Drop-Preview.png`：真实网页拖入提示，生成测试数据。
- `assets/Tofu-Drop-Imported.png`：真实网页混合媒体分类，生成测试数据。
- `assets/Tofu-Web-{Desktop,Mobile}-{Light,Dark}.png`：真实网页早期界面检查，内容为生成测试素材；部分截图早于最终图标，不作为当前图标规范。
- `assets/Tofu-iOS-Design-01-{Light,Dark}.png`：AI 生成的手机视觉参考，不是 iOS 原生应用或真机截图。不要把示意交互/波形当成已实现功能。

过时命名和未选方向不纳入当前仓库。图片来源/权利未确认前不新增外部平台素材作公开示例。
