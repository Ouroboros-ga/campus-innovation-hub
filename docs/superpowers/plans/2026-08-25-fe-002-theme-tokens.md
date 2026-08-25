# FE-002 主题与设计 Token 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `FrontendDesign.md` 的颜色、排版、圆角、间距、焦点、容器与暗色模式规则落成 Nuxt UI v4 可消费的共享主题。

**Architecture:** `tokens.css` 是视觉 token 与 Nuxt UI 语义变量映射的单一 CSS 入口，`main.css` 负责导入和全局基线；`vite.config.ts` 只声明 Nuxt UI 的 semantic color aliases。现有首页仅作为 FE-002 的最小主题演示，FE-003 不在本任务实施。

**Tech Stack:** Vue 3、Nuxt UI v4、Tailwind CSS v4 CSS-first、TypeScript、Vitest、pnpm。

## Global Constraints

- 保留既有 primary 50、100、500、600、700 及暗色 primary-400 锚点。
- `danger` 是项目 token 名；Nuxt UI 的 `error` alias 指向 `danger` palette。
- 控件基准圆角 8px，普通卡片 10px，主要表面 12px。
- 内容最大宽度 1440px；移动 gutter 16px、桌面 gutter 24px。
- 产品文案使用简体中文；不添加业务组件、首页业务布局、logo、API 或 FE-003 路由。
- 不添加新依赖，不引入页面级主题或第二套组件库。

---

### Task 1: 冻结主题契约与无障碍约束

**Files:**
- Create: `frontend/tests/unit/theme-contract.spec.ts`
- Modify: `frontend/tests/unit/home-page.spec.ts`

**Interfaces:**
- Consumes: `src/shared/styles/tokens.css` 中的 CSS custom properties。
- Produces: 色阶连续性、核心对比度及主题演示行为的回归保护。

- [x] **Step 1: 写主题与页面行为的失败测试**

  使用手工确定的锚点与 WCAG 公式验证 primary ramp、primary-600 白字、亮暗 muted text；首页测试验证 surface、link、warning badge、字段 label 和按钮反馈。

- [x] **Step 2: 运行测试并确认 RED**

  Run: `pnpm test tests/unit/theme-contract.spec.ts tests/unit/home-page.spec.ts`

  Expected: `tokens.css` 不存在且现有首页缺少主题演示元素，测试失败。

### Task 2: 实现共享主题

**Files:**
- Create: `frontend/src/shared/styles/tokens.css`
- Modify: `frontend/src/shared/styles/main.css`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/src/pages/home/HomePage.vue`

**Interfaces:**
- Consumes: Nuxt UI `ui.colors` aliases、Tailwind CSS `@theme static`、Color Mode `.dark` class。
- Produces: primary/success/warning/danger palette、项目 role tokens、Nuxt UI text/background/border mappings、排版与容器基线。

- [x] **Step 1: 写入完整色阶和 Nuxt UI 映射**

  定义完整 primary 50–950；配置 `primary -> primary`、`success -> success`、`info -> primary`、`warning -> warning`、`error -> danger`、`neutral -> neutral`，并由项目覆盖完整 `neutral` 色阶。

- [x] **Step 2: 写入全局基线和最小演示**

  导入 `tokens.css`，建立 system font、中文正文行高、body canvas、16/24px gutters、1440px 容器、2px focus ring、reduced-motion；首页展示验收所需组件。

- [x] **Step 3: 运行测试并确认 GREEN**

  Run: `pnpm test tests/unit/theme-contract.spec.ts tests/unit/home-page.spec.ts`

  Expected: 主题契约与页面行为全部通过且无 warning。

### Task 3: 同步设计文档并验证

**Files:**
- Modify: `docs/frontend/FrontendDesign.md`

**Interfaces:**
- Consumes: 已实施的完整 palette 与映射决策。
- Produces: 与代码一致的完整色阶、danger/error 适配、精确圆角和 16px 移动 gutter 规范。

- [x] **Step 1: 更新权威设计文档**

  用简体中文记录完整色阶和映射，消除 §11.4/§12 gutter 冲突，并把圆角范围冻结为已批准值。

- [x] **Step 2: 运行完整命令验证**

  Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm check`

  Expected: 所有命令 exit code 0。

- [x] **Step 3: 完成视觉与交互验证**

  在 1440 桌面和 390 移动视口检查亮暗模式、颜色、surface、文字层级、button、link、badge、input、focus 和 reduced-motion；控制台无相关 warning/error。

- [x] **Step 4: 审查范围并停止**

  检查变更只属于 FE-002，确认未创建 FE-003 开发路由、业务组件或新依赖；当前任务不自动创建 Git commit。
