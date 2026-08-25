# Backend Spec Freeze Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 将 V0.1 后端已确认的认证、标识、媒体、首页与执行边界固化为可独立执行的 BE 任务规范，且不初始化 Django 应用。

**Architecture:** 本任务只修改规范层。BackendArchitecture.md 定义稳定的运行时、数据边界与安全边界；BackendImplementationPlan.md 把后端拆成可单独验收的 BE-001 至 BE-040 任务；APIContract.md 与 database-design.md 保持为传输层和数据层的事实来源。

**Tech Stack:** Django、Django REST Framework、PostgreSQL、Gunicorn、Nginx、Django Session、CSRF、S3-compatible Object Storage、Vue SPA。

## Global Constraints

- V0.1 生产拓扑固定为 Vue SPA -> Nginx -> Django REST API -> PostgreSQL；服务器约为 2 CPU / 2 GB RAM。
- 生产认证固定为同源 Django Session、HttpOnly session cookie 与 CSRF；禁止 token 持久化到浏览器存储。
- 自助注册只创建 is_active=false 的待审核账号；仅 Django Admin 中的 SUPERADMIN 可启用账号。
- 所有正式资源的 canonical identifier 为 UUID v4；不引入 slug。
- 媒体二进制不写入 PostgreSQL；开发使用 LocalStorageBackend，生产使用 S3-compatible 托管对象存储；不得在 2C2G 主机自建 MinIO。
- 图片上传上限为 5 MB；公开媒体 DTO 只暴露 {id, url}，绝不暴露 object_key。
- Markdown 是正文 canonical source；原始 HTML 默认禁用，渲染成 HTML 前必须 sanitize。
- 首页固定使用只读聚合端点 GET /api/home；不得新增 HomePageData、homepage_stats、hot_score 等表。
- 组织申请必须经 Recruitment -> RecruitmentPosition -> RecruitmentApplication；不得保留直接申请组织的端点。
- 本任务不创建 backend/、不安装依赖、不建立 Migration、不修改前端当前未提交文件，也不启动 FE-100 API 集成。

---

## 文件结构与职责

- docs/backend/BackendArchitecture.md：后端系统边界、认证、媒体、Markdown、权限、服务与测试策略。
- docs/backend/BackendImplementationPlan.md：BE-001 至 BE-040 的顺序、范围、验收和停止条件。
- docs/api/APIContract.md：认证端点、公开 DTO、写端点和首页聚合字段的唯一传输契约。
- docs/backend/database-design.md：注册待审核、对象存储、Markdown 与数据库实施门禁的唯一数据层说明。
- docs/frontend/FrontendImplementationPlan.md：前端当前进度元数据，由正在进行的前端任务独立维护；本次不修改。

### Task 1: 固化后端架构边界

**Files:**
- Create: docs/backend/BackendArchitecture.md

**Interfaces:**
- Consumes: database-design.md 的 25 张业务表、APIContract.md 的 /api 约定、产品 V0.1 范围。
- Produces: BE-001 可遵循的后端目录、配置、安全和测试边界。

- [x] **Step 1: 写入运行时与部署拓扑**

明确同源 Nginx 路由：/ 服务前端静态产物，/api/ 反向代理 Django；生产不启用 CORS，不引入 Redis、Celery、WebSocket、MinIO 或额外 Node 服务。

- [x] **Step 2: 写入认证与账户审核契约**

定义 GET /api/auth/csrf、注册、登录、登出、当前用户的职责；注册事务必须创建 User(is_active=false) 与 UserProfile，登录对所有 inactive 账号返回同一不可用错误，不区分待审核与停用。

- [x] **Step 3: 写入媒体、Markdown 与服务边界**

定义 ObjectStorage、LocalStorageBackend、S3CompatibleStorageBackend 的职责；规定 public MediaRef 只含 id 与 url；规定 raw HTML 禁用和 sanitize 边界；列出必须由事务 Service 承担的跨表流程。

- [x] **Step 4: 写入 PostgreSQL 测试边界**

明确 partial unique、jsonb、行锁、容量并发和 Migration 必须使用 PostgreSQL 验证；Django Admin 是 V0.1 的审核与高权限操作入口。

### Task 2: 建立可单任务执行的后端实施计划

**Files:**
- Create: docs/backend/BackendImplementationPlan.md

**Interfaces:**
- Consumes: BackendArchitecture.md 的固定边界和 database-design.md 的领域顺序。
- Produces: 可由后续任务单独执行且不会自动越过阶段的 BE-001 至 BE-040 任务清单。

- [x] **Step 1: 记录当前 BE-000 完成条件**

BE-000 只在四份规范完成交叉引用、直接组织申请端点删除、招新撤回端点加入、首页字段与认证冻结后完成。

- [x] **Step 2: 写入 BE-001 与 BE-002**

BE-001 只建立 Django/DRF/PostgreSQL 基础、环境配置、健康检查与测试基础设施；BE-002 只建立 Custom User、Profile、Session/CSRF 和注册待审核流程。两项均不得创建其他领域 API。

- [x] **Step 3: 写入 BE-003 至 BE-006**

BE-003 建立 25 表领域模型与 Migration；BE-004 配置 Django Admin；BE-005 实现跨表 Service；BE-006 只验证 Model、约束、事务和权限行为。每项均在验收后停止。

- [x] **Step 4: 写入 BE-010 至 BE-040**

按公开读、学生写、组织负责人、运营 API 分阶段实现；前端在 FE-100+ 前仍使用 fixture，后端任务不得直接改前端调用。

### Task 3: 同步 API 与数据层事实来源

**Files:**
- Modify: docs/api/APIContract.md
- Modify: docs/backend/database-design.md

**Interfaces:**
- Consumes: 已冻结 Backend Spec。
- Produces: 与实现无歧义的端点、DTO、账户与媒体规则。

- [x] **Step 1: 冻结认证端点与状态码**

加入 GET /api/auth/csrf、POST /api/auth/register；注册响应固定为 pending_approval；inactive 登录返回统一 403 ACCOUNT_UNAVAILABLE。注册请求使用 student_no、real_name、password，后端令 username=student_no。

- [x] **Step 2: 修正资源与申请端点**

删除 POST /api/organizations/{id}/applications 及说明；加入 POST /api/recruitment-applications/{id}/withdraw；保留已有活动报名端点 POST /api/activities/{id}/register 与 POST /api/activities/{id}/cancel-registration。

- [x] **Step 3: 冻结首页与媒体 DTO**

首页字段固定为 banners、deadlines、featured_competitions、announcements、featured_guides、team_posts、recruiting_organizations、activities、faqs；增加 MediaRef；所有公开资源把媒体外键暴露改为语义化 MediaRef，上传响应不返回 object_key。

- [x] **Step 4: 更新数据库实施门禁**

将用户的待审核语义、对象存储适配器和 Markdown 渲染策略写入数据层文档；把本次已冻结项标记为已满足，但保留依赖实际代码的 PostgreSQL、Migration、约束命名和事务测试门禁。

### Task 4: 验证文档并隔离前端工作区修改

**Files:**
- Create: docs/superpowers/plans/2026-08-26-be-000-backend-spec-freeze.md

**Interfaces:**
- Consumes: 当前前端任务的未提交进度修改。
- Produces: 可被独立审查的 BE-000 修改，且不覆盖前端工作区状态。

- [x] **Step 1: 确认前端进度不在本任务范围内**

检查 FrontendImplementationPlan.md 的当前状态由正在进行的前端任务维护。本任务不修改其状态、FE 任务内容或任何前端源代码。

- [x] **Step 2: 做关键词一致性检查**

运行：

~~~powershell
rg -n 'organizations/\{id\}/applications|/api/faq\b' docs/api/APIContract.md
rg -n 'FE-004 verification in progress' docs/frontend/FrontendImplementationPlan.md
rg -n '"object_key"' docs/api/APIContract.md
~~~

预期：直接组织申请、旧 FAQ URL 与过期前端状态不再出现；API 响应示例不含 object_key。

- [x] **Step 3: 审查范围与差异**

运行：

~~~powershell
git diff --check
git diff -- docs/backend docs/api docs/superpowers/plans/2026-08-26-be-000-backend-spec-freeze.md
~~~

预期：无空白错误；BE-000 差异只包含后端、API 与本计划文件，不包含用户的未提交前端轮播、设计和进度修改。

## 自检

- Spec coverage：认证待审核、UUID、S3-compatible 媒体、Markdown、首页聚合、组织申请、招新撤回、分阶段后端任务均由 Task 1 至 Task 3 覆盖。
- Placeholder scan：本文不含 TODO、TBD 或未指定责任方的实现步骤。
- Type consistency：MediaRef 固定为 {id, url}；register / cancel-registration 为唯一活动报名端点命名；withdraw 使用 recruitment-applications 资源。

## 执行边界

用户已明确选择 Inline Execution。本计划完成后停止在 BE-000；下一步只能在用户明确指令下执行 BE-001，不得自动开始 BE-002。
