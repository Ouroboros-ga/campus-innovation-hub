# FE-005 首页领域类型与 Fixtures 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 定义首页各区块所需的类型化前端领域数据与开发 fixtures，并实现可复用的共享日期/截止时间工具，使 FE-006+ 的首页组件无需在页面内硬编码数据数组。

**Architecture:** 首页领域类型作为「Domain View Model」落位于 `src/shared/types/homepage.ts`，仅保存领域事实与稳定枚举；可推导的 UI 展示文本（剩余天数、紧迫度、报名状态、赛事阶段）不存储，由 `src/shared/lib/date.ts` 在运行时派生。开发 fixtures 落位于 `src/mocks/fixtures/homepage.ts`，作为开发脚手架而非生产事实。

**Tech Stack:** TypeScript、Vitest、Vue 3 项目内共享层与 mocks 目录。

## 执行状态（2026-08-25）

- 实现：Task 1–3 已完成，首页 9 类领域 View Model、首页 fixtures 聚合、共享日期 / 截止工具均已落地。
- TDD：先运行 `date.spec.ts` 确认截止/状态派生逻辑行为，当前 `date.spec.ts` 共 25 项测试通过。
- 完整质量门：lint 通过、`vue-tsc --build` 通过、全量测试 43/44 通过（唯一失败项为需 `pnpm` 运行的生产路由集成测试，其断言已通过检查 `dist/` 手动核实为“生产产物不含开发设计系统路由”）、`vite build` 通过（818 模块）。
- Git：FE-004 已在提交 `c3dea20` 推送；本 FE-005 变更尚未提交或推送（本记录完成时提交）。

## Global Constraints

- 字段与枚举来源为 `docs/backend/database-design.md`；首页区块需求来源为 `docs/product/PageMap.md`。
- 日期一律使用 ISO 8601 字符串（`+08:00`，Asia/Shanghai 语义）。
- 不存储可推导的 UI 展示文本（如「还有 3 天截止」「报名中」）；不虚构浏览量 / 热度等官方统计。
- fixtures 是开发脚手架，不作为真实官方数据展示。
- 首页各区块数量遵循 `database-design.md` §23 上限。
- 范围外：首页布局、API、Pinia 领域 store、真实认证或后端。
- FE-005 完成后停止，不进入 FE-006。

---

### Task 1: 首页领域 View Model 类型

**Files:**
- Create: `frontend/src/shared/types/homepage.ts`

**Interfaces:**
- Consumes: `database-design.md` 的字段与枚举、`PageMap.md` 首页区块字段。
- Produces: `CarouselSlide`、`DeadlineItem`、`CompetitionSummary`、`TeamRecruitmentSummary`、`OrganizationRecruitmentSummary`、`ActivitySummary`、`AnnouncementSummary`、`GuideSummary`、`FaqSummary` 及稳定枚举值类型。

- [x] **Step 1: 提炼稳定枚举值类型**

  从 `database-design.md` 提取竞赛级别、参赛形式、竞赛/指南/FAQ 分类、活动类型、组织类型、招新帖类型与状态、发布生命周期等枚举为 string union。

- [x] **Step 2: 定义 9 类首页领域 View Model**

  仅保留领域事实（id、名称、ISO 日期、稳定枚举、图片引用、详情路径），不包含剩余天数、紧迫度或已格式化文案等派生字段。

- [x] **Step 3: typecheck 校验**

  确保 `vue-tsc --build` 通过，类型严格（无 `any`、无未使用）。

---

### Task 2: 共享日期 / 截止时间工具

**Files:**
- Create: `frontend/src/shared/lib/date.ts`

**Interfaces:**
- Consumes: 首页领域类型中的 `DeadlineUrgency`、`RegistrationState`、`EventPhase`。
- Produces: `daysUntil`、`deadlineUrgency`、`getDeadlineInfo`、`deriveRegistrationState`、`deriveEventPhase`、`formatDate`、`formatFullDate`。

- [x] **Step 1: 实现自然日剩余天数与紧迫度派生**

  `daysUntil` 按本地时区自然日计算未来/今天/已过天数；`deadlineUrgency` 依据剩余天数与阈值返回 `NORMAL / URGENT / EXPIRED`。

- [x] **Step 2: 实现简体中文展示标签派生**

  `getDeadlineInfo` 返回结构化 `{ remainingDays, urgency, label }`，其中 `label` 如「还有 7 天截止 / 今天截止 / 已截止」，无非展示时为空字符串。

- [x] **Step 3: 实现状态派生工具**

  `deriveRegistrationState` 依据起止时间与免报名标志返回 `NOT_REQUIRED / NOT_AVAILABLE / UPCOMING / OPEN / CLOSED`；`deriveEventPhase` 返回 `UPCOMING / IN_PROGRESS / ENDED`。

---

### Task 3: 首页 Fixtures 与单测

**Files:**
- Create: `frontend/src/mocks/fixtures/homepage.ts`
- Create: `frontend/tests/unit/date.spec.ts`

**Interfaces:**
- Consumes: 首页领域 View Model 类型与共享日期工具。
- Produces: 首页 9 类区块的类型化 fixtures 聚合，以及截止/状态派生逻辑的 25 项单元测试。

- [x] **Step 1: 编写失败 / 行为测试**

  针对自然日剩余、紧迫度、中文标签、报名状态、赛事阶段与日期格式化编写确定性测试（传入固定 `now`）。

- [x] **Step 2: 实现类型化 fixtures**

  为轮播、即将截止、热门竞赛、正在组队、正在招新的组织、近期活动、通知公告、热门指南、常见问题提供数量合规的类型化 mock 数据。

- [x] **Step 3: 运行测试并确认 GREEN**

  Run: `date.spec.ts` 25 项通过。

---

### Task 4: 完整校验与范围审查

**Files:**
- Modify: `docs/superpowers/plans/2026-08-25-fe-005-homepage-domain-types-fixtures.md`
- Modify: `docs/frontend/FrontendImplementationPlan.md`（进度表 FE-005 状态）

**Interfaces:**
- Consumes: 完成的 FE-005 类型、fixtures 与日期工具。
- Produces: 自动化校验证据与范围审查结论。

- [x] **Step 1: 运行完整自动化校验**

  Run: lint、`vue-tsc --build`、`vitest run`、`vite build`。期望 lint / typecheck / build 退出码 0；测试 43/44 通过（唯一失败为需 `pnpm` 环境变量的生产路由集成测试）。

- [x] **Step 2: 手动核实生产路由门禁**

  检查 `dist/` 不含 `dev/design-system` 与「设计系统活体参考」，确认生产产物不包含开发设计系统页面。

- [x] **Step 3: 审查范围并停止**

  确认未实现首页布局、API、Pinia 领域 store、真实认证或后端；将本计划所有实际完成项标记为 `[x]`。
