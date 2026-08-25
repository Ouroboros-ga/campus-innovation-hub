# Campus Dynamics Information Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将学生端“活动”升级为不新增一级导航的“校园动态”入口，并把个人消息、组织上下文、组织负责人管理、平台运营与 Django Admin 的职责冻结为一致的 V0.1 规范。

**Architecture:** 保留 `Activity`、`Announcement` 和 `Notification` 三个独立领域模型与 API；仅将公开浏览界面收束到既有 `/activities` 路由，以 `tab` URL 状态切换“全部 / 活动 / 公告”。组织成员关系从独立个人中心页面迁入 `/organizations` 的登录态上下文区块；负责人工作台与平台运营工作台保持受保护的独立路由，SUPERADMIN 使用 Django Admin，而不是 Vue 管理页面。

**Tech Stack:** Vue 3、Vue Router、Nuxt UI v4、Tailwind CSS v4、Django 5.2、Django REST Framework、PostgreSQL、Django Admin。

## Global Constraints

- 产品 UI、文档和错误文案使用简体中文；专业术语保留英文。
- 公共导航不新增“公告”一级项；既有 `/activities` 路径保留，展示名改为“校园动态”。
- `Activity`、`Announcement`、`Notification` 不能合表，前端合并浏览入口不改变后端事实模型。
- `Announcement.publisher_scope` 固定为 `ACADEMY`、`UNIVERSITY`、`PLATFORM`；`external_url` 可空，禁止抓取、镜像或 iframe 嵌入站外正文。
- `/notifications` 仅显示当前登录用户的个人消息；公开公告默认不生成个人消息。
- `/organizations` 未登录或无组织身份时不渲染“我的组织”区块；有身份时最多显示 4 项，并以“查看全部 / 收起”原位展开，不使用横向滚动。
- Phone `<768px`、Tablet `768–1023px`、Desktop `>=1024px`；Phone 固定五项底部导航仍保持五项，活动标签缩短为“动态”。
- `SUPERADMIN` 管理入口为 Django Admin `/admin/`；`OPERATOR` 不得获得 `is_staff` 或 Admin 访问权。
- 本计划的当前执行范围是 Spec 文档同步；不创建 `backend/`、不修改前端实现、不执行构建或测试。

---

### Task 1: 冻结数据、API 与服务边界

**Files:**
- Modify: `docs/backend/database-design.md:1373-1650`
- Modify: `docs/api/APIContract.md:296-400,1028-1132,1287-1378`
- Modify: `docs/backend/BackendArchitecture.md:180-320`
- Modify: `docs/backend/BackendImplementationPlan.md:77-124,298-338,586-617`

**Interfaces:**
- Consumes: 既有 `Activity`、`Announcement`、`Notification`、`OrganizationMembership` 与 `AuditLog` 规范。
- Produces: `publisher_scope`、公告外链规则、`create_activity_with_announcement()` 服务、`POST /api/ops/dynamics/activity-with-announcement` 契约，以及 Django Admin 的权限边界。

- [x] **Step 1: 写入 Announcement 的来源、外链与关联规则**

在 `content_announcement` 添加必填 `publisher_scope`，声明 `ACADEMY | UNIVERSITY | PLATFORM`；保留可空 `external_url` 和“最多一个核心对象”约束。明确外链只作跳转、无抓取/镜像/iframe；公开公告与个人消息分离。

- [x] **Step 2: 写入公开读取与组合发布 API**

保留 `GET /api/activities`、`GET /api/announcements` 与各自详情 API；公告列表/详情返回 `publisher_scope`、`external_url` 与可空 `linked_object`。新增 `POST /api/ops/dynamics/activity-with-announcement`：请求含 `activity`、`announcement` 与 `publish`，后端服务在一个事务内创建 Activity 和 `activity_id` 已绑定的 Announcement，返回二者；失败不得留下半成品。

- [x] **Step 3: 写入 Service 与通知规则**

在 Backend Architecture 指定 `create_activity_with_announcement()` 由 DRF View 调用、使用 `transaction.atomic`、写两个 AuditLog。普通活动或普通公告不自动创建个人消息；活动取消、临近提醒等既有受影响人群消息继续使用 Notification。

- [x] **Step 4: 写入 Django Admin 的最小高权限边界**

明确 `/admin/` 是同一 Django 部署的内部入口，Admin 访问要求 `is_active && is_staff`；SUPERADMIN 创建时同时具备 `is_superuser=true` 与 `is_staff=true`，OPERATOR 绝不具备 Admin 访问。BE-004 覆盖待审核用户筛选/启用、组织与负责人关系、只读 AuditLog 和敏感字段最小可见性。

- [x] **Step 5: 核对术语与权限**

确认 API 中没有把 OPERATOR 写为组织负责人、没有将公告投递到所有 `/notifications`，且组合发布端点没有替代单独活动/公告 API。

### Task 2: 同步产品路由、页面行为与 Mobile Web 规则

**Files:**
- Modify: `docs/product/PRD.md:160-340,401-429,913-1032,1134-1255,1749-1790`
- Modify: `docs/product/PageMap.md:1-345,511-640,1136-1215,1335-1405,1507-1920,2141-2184,2299-2349`
- Modify: `docs/frontend/FrontendDesign.md:1056-1160,1950-2110`

**Interfaces:**
- Consumes: Task 1 的领域与 API 边界、既有响应式壳规范。
- Produces: `/activities?tab=all|activities|announcements` 的“校园动态”页面说明、公告详情子路由、`/organizations` 的“我的组织”上下文区块，以及两个管理工作台的移动端交互规则。

- [x] **Step 1: 更新学生端导航与页面树**

保留 `/activities`，将桌面导航展示名改为“校园动态”；Phone 底部标签为“动态”。页面树移除 `/me/organizations`，添加 `/activities/announcements/:announcementId` 为公告详情子路由；不新增公告一级导航或 `/announcements` 根路由。

- [x] **Step 2: 定义校园动态浏览与详情体验**

`/activities` 默认 `tab=all`，同页按“近期活动”和“最新公告”分区；`tab=activities` 展示可筛选、可报名的活动列表；`tab=announcements` 展示公告列表。URL 承载 tab 与筛选；活动详情显示相关公告，公告详情显示来源、外链标识、相关对象入口。首页两个区块继续独立，但“查看全部”活动和公告分别跳入对应 tab。

- [x] **Step 3: 将我的组织迁入组织页**

`/organizations` 登录态读取 `GET /api/me/organizations`，仅在存在身份时显示“我的组织”；前四项紧凑展示，超出时原位展开。MEMBER 仅能查看组织主页；LEADER 额外获得“进入管理”，进入 `/manage/organizations/:organizationId`。头像菜单和个人中心移除“我的组织”入口。

- [x] **Step 4: 定义负责人和运营工作台**

负责人工作台仍为 `/manage/organizations/:organizationId`，仅通过“我的组织”中的 LEADER 入口抵达；运营工作台为 `/ops`，头像菜单仅对 OPERATOR/SUPERADMIN 显示。`/ops/activities` 展示名改为“校园动态管理”，通过页内 tab 管理活动与公告，移除前端 `/ops/announcements` 页面路由；后端 API 保持分域。

- [x] **Step 5: 写入 Phone、Tablet 与 Desktop 的明确降级**

Phone `/activities` 保持根级 Tab Shell，五项底栏标签为“动态”；动态页 tab 可横向可访问但不依赖滑动提示，使用明确文字和可见选中态。公告详情、活动详情、负责人/运营管理均使用 Back/Manage Shell，隐藏全局底栏；活动详情仅在可报名时展示安全区兼容的 Sticky Action。Phone 管理列表改为摘要行 + 详情/任务页，长表单独立任务页；Tablet 用 Drawer 与 1–2 列内容；Desktop 使用表格和侧栏。

- [x] **Step 6: 核对公开与受保护入口**

确认游客可访问校园动态与公告详情，`/notifications` 仍要求登录；`/manage/*` 与 `/ops/*` 不出现在学生一级导航或 Phone 底栏。

### Task 3: 同步前端架构与后续实施任务

**Files:**
- Modify: `docs/frontend/FrontendArchitecture.md:335-615,646-730,1418-1498,1661-1676`
- Modify: `docs/frontend/FrontendImplementationPlan.md:100-127,473-625,1380-1520,1600-1635`

**Interfaces:**
- Consumes: Task 2 的页面树、URL 状态和 Mobile Web 规则。
- Produces: 明确的 Vue Router 路径、route meta、feature 边界，以及 FE-040/FE-050/FE-070/FE-080/FE-090/FE-104/FE-105 的实施范围。

- [x] **Step 1: 更新 Vue Router 目标结构**

移除 `/me/organizations`，添加 `/activities/announcements/:announcementId`，保留 `/activities` 的 `tab` query；将 `/ops/announcements` 从前端页面树移除。静态 `announcements` 子路径必须在 `/activities/:id` 动态路径前注册。

- [x] **Step 2: 更新 Mobile Shell 与 URL 状态**

`/activities` 使用 `mobileShell: 'tab'`、`mobileTab: 'activities'`；公告和活动详情使用 `mobileShell: 'detail'`；组织负责人和运营路由使用 `mobileShell: 'manage'`。`tab`、搜索与筛选必须属于 URL，而不是 Pinia；session/notifications 仍是跨页状态。

- [x] **Step 3: 重新界定前端任务范围**

FE-040 在 `/organizations` 实现登录态“我的组织”区块；FE-050/051 实现校园动态浏览、活动详情与公告关联；新增公告详情子任务；FE-070 移除组织身份页；FE-080 从指定组织入口进入；FE-090 把活动与公告管理收束为“校园动态管理”。FE-104 集成两个公共读取域和组合发布端点，FE-105 提供组织身份/运营角色上下文。

- [x] **Step 4: 写入可验证验收条件**

为后续实现记录：无组织身份时不出现空白区块；LEADER 不可管理非本组织；公告不出现在个人消息列表；Phone 360/390/430、Tablet 768、Desktop 1024/1440 无横向溢出；动态 tab、活动报名、公告外链、管理入口与权限拒绝均有测试场景。

### Task 4: 审查 Spec 同步完整性

**Files:**
- Modify: `docs/superpowers/plans/2026-08-26-campus-dynamics-information-architecture.md`
- Verify: `docs/product/PRD.md`, `docs/product/PageMap.md`, `docs/api/APIContract.md`, `docs/backend/database-design.md`, `docs/backend/BackendArchitecture.md`, `docs/backend/BackendImplementationPlan.md`, `docs/frontend/FrontendDesign.md`, `docs/frontend/FrontendArchitecture.md`, `docs/frontend/FrontendImplementationPlan.md`

**Interfaces:**
- Consumes: Tasks 1–3 的文档规范。
- Produces: 可供 BE-001、FE-040、FE-050、FE-080、FE-090 依赖的统一冻结状态。

- [x] **Step 1: 对照 Spec 覆盖面**

逐项核对：校园动态单入口、活动/公告/消息分离、公告来源、学校官网外链、我的组织迁移、负责人入口、运营工作台、Django Admin、Phone/Tablet/Desktop 规则。

- [x] **Step 2: 搜索旧路由与旧语义**

检索 `/me/organizations`、`/ops/announcements`、学生一级“活动”、以及把公开公告写入个人消息的旧表述；仅保留明确标注为后端 API 或历史兼容的必要内容。

- [x] **Step 3: 运行文档一致性检查并审查 diff**

运行 `git diff --check`；用 PowerShell 断言关键路由、枚举、权限和移动端约束均出现在对应事实来源；审查 `git diff -- docs/`，确认不触碰 `frontend/` 的并行工作。

- [x] **Step 4: 回填完成状态**

已回填执行状态。本轮仅同步 Spec，未执行后端/前端实现或质量命令；完整文档 diff 检查仍会报告 `docs/frontend/FrontendImplementationPlan.md:663` 的并行既有尾随空格，未在本轮触碰。
