# Tofu Web 0.2

当前跨设备主线：React/Vite、IndexedDB、独立 Supabase Auth / Postgres / 私有 Storage。默认本地使用，云端由使用者自行部署。应用 UI 英文，项目协作与使用说明中文。

```sh
npm ci
npm run dev
# 新终端做检查
npm test
npm run build
npm run preview -- --port 5182
```

详细文档统一在根目录 docs，避免重复信息失效：

- [安装、账号与自动同步](../docs/usage.md)
- [架构与数据](../docs/architecture.md)
- [开发、检查与发布](../docs/development.md)
- [当前状态和下一步](../docs/handoff.md)
- [踩坑记录](../docs/pitfalls.md)
- [GitHub 边界](../docs/github.md)

浏览器生成测试素材已包含在 `tests/fixtures/`，输出写入根目录被忽略的 outputs/ 和 work/。不要用真实账号或个人素材运行回归。需要同步时复制 `.env.example` 为 `.env.local`，填写自己的 Supabase URL/publishable key；构建会据此生成 CSP。不能使用管理员密钥。
