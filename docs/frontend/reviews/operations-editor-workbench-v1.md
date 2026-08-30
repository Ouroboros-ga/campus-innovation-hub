# 运营编辑工作台 V1 验收记录

更新时间：2026-08-30

## 覆盖范围

- 发布型内容：竞赛、活动、公告、指南、FAQ、站点文档与组织招新。
- 配置面：首页精选、Banner 与系统健康展示。
- 工作队列：咨询正式答疑、招新申请与既有运营审核列表。

## 自动化验证矩阵

| 场景 | 覆盖方式 | 结果 |
| --- | --- | --- |
| 原子创建并发布 | 前端编辑页/API 单测；后端 create intent 服务测试 | 通过 |
| 已发布内容立即更新 | 编辑器状态和 API 行为单测 | 通过 |
| 字段错误与离开保护 | `useEditorTask`、`form-errors`、编辑页单测 | 通过 |
| 招新岗位完整回填、发布与组织切换 | `recruitment-editor-page.spec.ts` | 通过 |
| 私密咨询、完整回复历史、关闭确认、关闭后拒绝回复 | 咨询 API/工作台单测；服务器 PostgreSQL Django 定向测试 | 通过 |
| Phone 队列进入独立答疑页、快速切换不串详情 | `ops-questions-workbench.spec.ts` | 通过 |
| 页面 HTTP 架构边界 | ESLint `no-restricted-imports` + `rg` 审计 | 通过 |

## 已执行验证

- 前端：`pnpm lint`、`pnpm typecheck`、`pnpm build` 均通过；`pnpm exec vitest run --maxWorkers=1` 为 78 files / 379 tests 通过。
- 后端：目标提交 `0b9a6eb6bda5d609211eaea4327f4d73d5b2b9d5` 在服务器临时 checkout + PostgreSQL 测试库中通过 `manage.py check`、`makemigrations --check --dry-run`，以及两项咨询回复/关闭 action 回归测试。
- 服务器全量 `manage.py test --keepdb -v 1` 执行了 109 项，结果为 10 failures / 8 errors；失败集中于既有账户身份约束、注册策略、媒体 MIME、竞赛创建旧断言与旧 migration leaf 断言，未作为本次工作台改动的通过证据。

## 发布状态

- 已构建但未切换的 release：`/opt/campus-innovation-hub/releases/0b9a6eb6bda5d609211eaea4327f4d73d5b2b9d5`；已验证含 `frontend/dist/index.html`。
- 发布前线上 release：`c37265eeccc3b1e16f64d5e7d7b7496b7e4f992f`。
- 新 migration 仅包含可空 `published_at` 字段和竞赛分类 metadata；执行前仍必须备份生产 PostgreSQL 并在实际可达服务器执行 migration plan。
- 2026-08-30 发布阶段服务器 SSH banner 与 `https://zsitai.xyz/api/health` 均连续连接超时；因此尚未执行备份、生产 migration、`current` symlink 切换、service restart 或线上交互验收。

## 恢复后的验收与回滚

1. 先确认 SSH、`/api/health` 与当前 release SHA 恢复可达。
2. 备份生产 PostgreSQL 并校验 dump 可读；在已构建 release 上执行 `migrate --plan` 与 `migrate --noinput`。
3. 停止旧 Gunicorn、原子切换 `current` 到目标 SHA、启动服务，防止新前端面对旧后端。
4. 检查本地和公网 `/api/health`、loopback `/api/ready`、静态入口、运营登录、咨询回复与关闭、Nginx/service 日志。
5. 如验收失败，在 migration 向后兼容前提下切回 `c37265eeccc3b1e16f64d5e7d7b7496b7e4f992f` 并启动旧服务。
