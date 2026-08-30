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

- 已发布 release：`0b9a6eb6bda5d609211eaea4327f4d73d5b2b9d5`；`/opt/campus-innovation-hub/current`、Gunicorn 进程工作目录和 Nginx 实际返回的 `frontend/dist/index.html` 哈希均已核对为该 release。
- 发布前线上 release：`c37265eeccc3b1e16f64d5e7d7b7496b7e4f992f`；保留为可回切目标。
- 发布前已生成并校验 PostgreSQL custom dump：`pre-0b9a6eb6bda5-20260830T113943Z.dump`，SHA-256 为 `a955573f03a730e49455e05ac015dab08c41acab8476aca9e8a650c7d95f9525`。服务器缺少与 PostgreSQL 16.2 匹配的系统 `pg_dump`，因此复用已缓存的 `postgres:16.2-alpine` 镜像完成导出与 `pg_restore -l` 校验；未下载镜像、未安装数据库服务。
- 已执行并通过 production migration：`activities.0002_activity_published_at`、`competitions.0002_competition_published_at`、`competitions.0003_alter_competition_category`、`content.0005_faqitem_published_at`、`organizations.0004_recruitment_published_at`。这些变更对旧 release 向后兼容。
- 发布后 `campus-innovation-hub.service` 为 active，Nginx 回环 `/api/health` 返回 `ok`、`/api/ready` 返回 `ready`；公网首页和 `/api/health` 为 200。公网 `/api/ready` 仍按既有访问策略返回 403，未作为失败处理。
- 未使用运营人员登录态执行回复、关闭等写操作验收，避免在生产数据上制造测试记录。

## 未完成的计划范围

- Task 9 的五个既有队列页面尚未全部迁移到 `ManagementPageHeader`、`ManagementFilterBar`、`ManagementState`；咨询队列已采用该结构，但招新申请、组织申请、组队、活动、组织列表仍保留历史页面编排。
- Task 10 已消除 page -> shared HTTP 边界并拆出 API 模块，但 `OpsHomepagePage.vue` 与 `OpsSystemPage.vue` 尚未完成计划要求的 focused composable / form 级拆分。
- 因此本记录只确认已提交 slice 的行为，不把整个深度整理计划表述为全部完成。

## 本次发布执行与回滚

1. 已确认 SSH、当前 release SHA、Nginx 配置和公网健康接口可达；先执行 migration plan，再执行数据库备份与 migration。
2. 已停止旧 Gunicorn、通过临时符号链接原子切换 `current` 到目标 SHA 并启动服务，避免新前端面对旧后端。
3. 首次切换曾因直连 Gunicorn 的错误健康探针得到 403 而自动回切；随后改为同真实流量一致的 HTTPS/Nginx 回环检查，确认新 release 实际运行后完成切换。
4. 如后续需要回滚，在 migration 向后兼容前提下，将 `current` 原子切回 `c37265eeccc3b1e16f64d5e7d7b7496b7e4f992f` 后重启 `campus-innovation-hub.service`；迁移前备份可用于更高风险的数据库恢复场景。
