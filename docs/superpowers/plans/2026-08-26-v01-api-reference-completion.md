# V0.1 API Reference Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 V0.1 全部产品功能的 HTTP API 细化为可直接实现、联调与验收的请求、响应、权限、错误和副作用契约，并安全提交推送。

**Architecture:** `APIContract.md` 继续作为简明的规范总览和传输共识；新增 `EndpointReference.md` 作为逐域的详细端点参考。两个文档都只表达已存在领域模型和 V0.1 功能，不引入新表、GenericForeignKey、第二套认证或额外运行时服务。

**Tech Stack:** Django 5.2、Django REST Framework、PostgreSQL、Vue 3 feature API modules、同源 Django Session、CSRF、REST / JSON over HTTPS。

## Global Constraints

- 所有正文、错误 message 和产品文案使用简体中文；字段名、枚举值、HTTP method 与路径保留英文。
- Base path 固定为 `/api`，字段使用 snake_case，ID 使用 UUID v4，时间使用带时区 ISO 8601。
- 写操作使用同源 Session + `X-CSRFToken`；前端不得保存长期 token。
- `Activity`、`Announcement`、`Notification` 分域；公开公告不默认写入个人 Notification。
- 组织权限按具体 `organization_id` 的 active `LEADER` 关系验证；OPERATOR 不自动获得 LEADER 或 Django Admin 权限。
- 只使用 database-design.md 中的字段、枚举、状态机、隐私分级和事务边界；不写实现代码、不创建 Migration。
- 提交仅包含本轮可归属的 API/后端产品文档；不得带入已存在的前端并行改动。

---

### Task 1: 建立 API 参考层与跨域传输规则

**Files:**
- Create: `docs/api/EndpointReference.md`
- Modify: `docs/api/APIContract.md:1-270,1544-1549`

**Interfaces:**
- Consumes: `database-design.md` §3、§8–§27、§35，`APIContract.md` §1–§4。
- Produces: 共享分页、错误、权限、幂等、条件写入、MediaRef、DTO 与枚举参考，使任何端点条目不再依赖未定义的字段含义。

- [x] **Step 1: 固定参考文档职责和版本关系**

在 `APIContract.md` 指向 `EndpointReference.md`，说明前者冻结端点总览和全局约定、后者给出精确 body/response/side effect；冲突时以 database-design.md 的字段和约束为准。

- [x] **Step 2: 写入传输层共用规则**

在参考文档定义 path UUID、Query 的 page/page_size、空值、PATCH 部分更新、JSON 和 multipart、`204`、分页包装、`fieldErrors`、requestId、CSV 下载、下载文件名、CSRF、错误 code、重复请求和 `If-Match` 不在 V0.1 的边界。

- [x] **Step 3: 写入共享 DTO、请求对象与枚举**

定义 MediaRef、分页、当前用户、列表摘要、关联对象、Notification、管理操作响应；定义 Competition、TeamPost、TeamApplication、Recruitment、Activity、Announcement、Guide、FAQ、Banner、Consultation 的写入对象和字段边界，列出所有允许枚举。

### Task 2: 细化公开、认证与学生自助 API

**Files:**
- Modify: `docs/api/EndpointReference.md`
- Modify: `docs/api/APIContract.md:270-1295`

**Interfaces:**
- Consumes: Task 1 共享 DTO/请求对象、PRD 中学生功能、PageMap 页面操作。
- Produces: Auth、个人中心、首页、竞赛、组队、组织/招新、校园动态、内容、咨询、消息、媒体与搜索的逐端点契约。

- [x] **Step 1: 覆盖 Auth、Me、首页和竞赛**

每个端点记录 method/path/permission、Query 或 body、成功 status/body、错误码与关键副作用；明确 pending 注册、Session、个人资料可写字段、竞赛关注幂等边界与首页 Read Model 上限。

- [x] **Step 2: 覆盖组队与组织/招新申请链**

细化 TeamPost/Role 全量写入、申请提交/接受/拒绝/撤回、敏感联系方式可见性；细化 Organization/Recruitment/Position 写入、申请撤回、负责人处理和 Membership/Notification 的事务结果。

- [x] **Step 3: 覆盖校园动态、内容、咨询、通知、媒体与搜索**

细化公开活动/公告读模型、报名重试与容量冲突、公告外链与关联对象、Guide/FAQ/公开问答、咨询可见性、个人消息已读操作、multipart 上传及跨域搜索结果。

### Task 3: 补齐运营与组织工作台 API

**Files:**
- Modify: `docs/api/APIContract.md:357-403,1296-1492`
- Modify: `docs/api/EndpointReference.md`
- Modify: `docs/backend/BackendImplementationPlan.md:586-630`

**Interfaces:**
- Consumes: Task 1 写入对象与 database-design.md 的发布、状态机、审计和事务规则。
- Produces: OPERATOR/SUPERADMIN 及 LEADER(org) 的完整列表、详情、创建、局部编辑、状态操作、导出和组合发布端点。

- [x] **Step 1: 补齐运营资源读取与发布生命周期端点**

将管理端实际需要的 Guide、FAQ、Announcement、Banner、Activity、Competition 读取/详情和缺失的 publish/archive/featured 操作写入总览与详情。状态转移只通过 action endpoint，不允许普通 PATCH 直接改 `publication_state`。

- [x] **Step 2: 细化运营写入、导出与审计副作用**

写明 Competition/Timeline、Activity/Registration CSV、Announcement、Guide、FAQ、Banner、Consultation Reply 的 request body、响应、敏感字段和 AuditLog 规则；组合发布严格一事务且不广播公开公告。

- [x] **Step 3: 细化组织负责人工作台**

写明组织资料 PATCH、招新/岗位全量替换、招新状态操作和申请处理；所有路径验证 orgId 作用域、不得通过负责人端点授权 LEADER、接受申请的 Membership 角色固定 MEMBER。

- [x] **Step 4: 将 BE-040 验收链接到逐端点参考**

Backend 实施计划明确 BE-040 必须以 `EndpointReference.md` 的全部 OPERATOR/SUPERADMIN 端点为准，并添加契约/权限/事务测试验收。

### Task 4: 执行一致性检查、提交与推送

**Files:**
- Modify: `docs/superpowers/plans/2026-08-26-v01-api-reference-completion.md`
- Verify: `docs/api/APIContract.md`, `docs/api/EndpointReference.md`, `docs/backend/database-design.md`, `docs/backend/BackendImplementationPlan.md`

**Interfaces:**
- Consumes: Tasks 1–3 的完整 API 文档。
- Produces: 可审查的文档提交与 origin/main 推送结果。

- [x] **Step 1: 做字段、路径、权限与状态机断言**

使用 PowerShell 和 `rg` 核对每个端点总览都在详细参考中、所有写入字段来自数据库设计、组合发布/通知/组织作用域规则一致、旧路由只保留为后端 API。

- [x] **Step 2: 审查本轮文档 diff**

运行 `git diff --check`（针对本轮文件），检查没有生成密钥、前端源代码或无关并行改动；单独报告已有 `FrontendImplementationPlan.md` 尾随空格，不将它带入暂存区。

- [x] **Step 3: 仅暂存可归属文档并提交**

暂存 `docs/api/APIContract.md`、`docs/api/EndpointReference.md`、`docs/backend/database-design.md`、`docs/backend/BackendArchitecture.md`、`docs/backend/BackendImplementationPlan.md`、`docs/product/PRD.md`、`docs/product/PageMap.md`、`docs/frontend/FrontendArchitecture.md`、`docs/frontend/FrontendDesign.md` 与本轮两份计划；不暂存 `frontend/` 或共享的 `FrontendImplementationPlan.md`。提交信息使用 `docs: complete v0.1 api reference`。

- [x] **Step 4: 推送并记录远端提交 SHA**

执行 `git push origin main`，读取命令退出码与 `git rev-parse HEAD`；只有推送成功才报告远端已更新。

执行记录：本轮文档提交为 `e46c3cd`，已成功推送至 `origin/main`。本计划的完成记录在后续文档提交中保存。

## Self-Review

- 覆盖：Task 2 处理全部学生功能域，Task 3 处理全部运营与组织负责人功能域，Task 1 统一字段/错误/权限/并发语义，Task 4 验证并安全交付。
- 无占位符：所有新增端点和写入对象会在 `EndpointReference.md` 中以具体字段和状态码列出；不以“同上”替代请求或响应语义。
- 类型一致性：所有字段和枚举以 `database-design.md` 为唯一来源，端点 path 和权限以 `APIContract.md` 总览同步更新。
