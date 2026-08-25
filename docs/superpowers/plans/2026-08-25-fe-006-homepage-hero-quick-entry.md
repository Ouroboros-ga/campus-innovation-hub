# FE-006 首页 Hero 与快捷入口实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按照已批准的设计方向实现首页顶部区域：主信息（Hero 主标题 + 一句说明）与四个快捷入口（找竞赛 / 找队友 / 找组织 / 找活动）。

**Architecture:** `HomeHero` 作为首页 Hero 区块，右侧为 `media` 插槽，后续由 FE-007 的 `HomeCarousel` 注入；无媒体时以单列（可收缩网格）呈现。`QuickEntry` 为四个结构化快捷入口卡片，使用 Nuxt UI `UIcon` + Lucide 图标，整块可点击。

**Tech Stack:** Vue 3、Vue Router、TypeScript、Nuxt UI v4、Tailwind CSS v4、Vitest、Vue Test Utils

## 执行状态（2026-08-25）

- 实现：Task 1–3 已完成，`HomeHero`（主信息 + 媒体插槽）与 `QuickEntry`（四快捷入口）均已落地，首页 `HomePage` 已接入。
- TDD：为 Hero / 快捷入口编写路由与导航测试，组件与 App 级渲染测试通过。
- 完整质量门：`pnpm check` 全绿（lint、`vue-tsc --build`、`vitest run` 47/47 通过、含 `production-route.spec.ts` 生产路由集成测试、`vite build` 通过 823 模块）。
- 视觉验证：1440 桌面与 768 平板截图确认 Hero 主信息、快捷入口一行/响应式正确、无横向溢出；窄屏（headless 实际渲染视口）经 DOM 布局测量确认无横向溢出。
- Git：本 FE-006 变更尚未提交或推送（本记录完成时提交）。

## Global Constraints

- 文案使用简体中文（zh-CN），保持事实性，无虚假 KPI（§43 / §12 PageMap）。
- 产品图标无 emoji；仅 Lucide SVG 图标，不手绘通用图标、不用 Unicode 箭头（§3.1/§3.2/§17）。
- 克制的边框与圆角（§9 圆角预算：控件 8px、卡片 10px、表面 12px）；卡片默认仅描边、非必要不加阴影（§10）。
- 无紫色渐变的 hero；无玻璃拟态、无通用 AI 风格（§3.5）。
- 颜色仅使用已批准 token（§7）；快捷入口作为首页主操作使用主蓝强调（§7.1），不引入装饰性语义色（§7.3）。
- 移动端快捷入口 2x2（§34）；整块触控目标 ≥ 44px（§35）；键盘焦点可见（§36/§37）。
- 范围外：校园轮播（FE-007）、截止时间区块、竞赛区块、API、Pinia 领域 store、后端。
- FE-006 完成后停止，不进入 FE-007。

---

### Task 1: 首页 Hero 组件外壳

**Files:**
- Create: `frontend/src/features/homepage/components/HomeHero.vue`

**Interfaces:**
- Consumes: `PageContainer`、`QuickEntry`、设计 token。
- Produces: Hero 白色区块（`border-b` + surface），内含主标题、一句说明与 `QuickEntry`，右侧预留 `media` 插槽（FE-007 轮播）。

- [x] **Step 1: 定义 Hero 区块结构**

  白色表面带 + 分隔线；主标题 32–36px、权重 700–760；说明文字 muted；无媒体时为可收缩单列内容（限制可读宽度）。

- [x] **Step 2: 预留媒体插槽与可收缩网格列**

  使用 `useSlots` 判断是否注入媒体；无媒体用 `grid-cols-1`（`minmax(0,1fr)`，防隐式 auto 列撑宽导致横向溢出），有媒体用双列网格。

- [x] **Step 3: 接入首页**

  `HomePage` 渲染 `<HomeHero />`，其余首页区块保留占位说明（FE-006 范围外）。

---

### Task 2: QuickEntry 快捷入口

**Files:**
- Create: `frontend/src/features/homepage/components/QuickEntry.vue`

**Interfaces:**
- Consumes: Vue Router `RouterLink`、Nuxt UI `UIcon`、设计 token、Lucide 图标。
- Produces: 四个快捷入口卡片，指向 `/competitions`、`/teams`、`/organizations`、`/activities`。

- [x] **Step 1: 定义四项入口与路由**

  找竞赛（trophy）、找队友（users）、找组织（building-2）、找活动（calendar-days），各带一句说明。

- [x] **Step 2: 实现卡片**

  每项为白色卡片（`rounded-card` + `border-default`），左侧 `size-11` 圆角主蓝图标容器（`bg-primary-50` + `text-primary-600`，图标 22px），右侧标题 + 说明（说明 `truncate`），整块为可点击 `RouterLink`。

- [x] **Step 3: 响应式与触控**

  移动端 2x2（`grid-cols-2`），≥ md 一行四个（`md:grid-cols-4`）；整块高度 ≥ 44px，可点击区域覆盖整卡片。

---

### Task 3: 测试与校验

**Files:**
- Create: `frontend/tests/unit/home-hero.spec.ts`
- Modify: `frontend/tests/unit/home-page.spec.ts`
- Modify: `frontend/tests/unit/public-shell-routing.spec.ts`

**Interfaces:**
- Consumes: 完成的 Hero 与快捷入口。
- Produces: 组件 / 路由渲染与导航测试，以及首页 H1 断言更新。

- [x] **Step 1: 编写 Hero / 快捷入口测试**

  断言 H1 主标题、说明、四个快捷入口 href 正确，以及快捷入口可导航到对应页面（懒加载路由，使用 `vi.waitFor` 等待路由结算）。

- [x] **Step 2: 更新首页与外壳测试**

  将 `home-page.spec.ts` 与 `public-shell-routing.spec.ts` 中首页 H1 断言从占位标题更新为 Hero 主标题「发现科创机会，成就无限可能」。

- [x] **Step 3: 运行完整校验**

  Run: `pnpm check`。期望 lint、typecheck、全量测试（含生产路由集成测试）、build 全部退出码 0。

---

### Task 4: 视觉验证与范围审查

**Files:**
- Modify: `docs/superpowers/plans/2026-08-25-fe-006-homepage-hero-quick-entry.md`
- Modify: `docs/frontend/FrontendImplementationPlan.md`（进度表 FE-006 状态）

**Interfaces:**
- Consumes: 完成的 HomeHero 与 QuickEntry。
- Produces: 桌面 / 平板视觉验证证据、范围审查结论。

- [x] **Step 1: 浏览器验证桌面端**

  在 1440 宽度检查 `/`：Hero 主标题与说明、四个快捷入口（图标容器、标题、说明）与参考图左侧一致，无横向溢出、无控制台错误。

- [x] **Step 2: 浏览器验证平板 / 窄屏**

  在 768 宽度检查：快捷入口一行四个；窄屏头顺 2x2；Hero 内容可换行、网格列可收缩，无横向溢出。

- [x] **Step 3: 对照设计规范**

  核对无 emoji、仅 Lucide 图标、卡片圆角/描边、无紫色渐变、主蓝仅用于主操作、移动端 2x2、触控目标 ≥44px。

- [x] **Step 4: 审查范围并停止**

  确认未实现轮播 / 截止时间 / 竞赛区块、API、Pinia 领域 store 或后端；将本计划实际完成项标记为 `[x]`。
