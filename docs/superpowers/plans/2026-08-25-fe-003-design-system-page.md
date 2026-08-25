# FE-003 开发设计系统页面实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修正 FE-002 的设计规范差距，并创建只在开发环境注册的 `/dev/design-system` 活体视觉参考页。

**Architecture:** 公开路由与开发路由在 `routes.ts` 中按 `import.meta.env.DEV` 组合，生产构建通过真实 Vite build 测试证明不包含设计系统页面。设计系统页面只消费共享 token 与 Nuxt UI 组件，以用户提供的页面 demo 为视觉语言参考，但不提前实现应用外壳或首页业务区块。

**Tech Stack:** Vue 3、Vite、TypeScript、Nuxt UI v4、Tailwind CSS v4、Vue Router、Vitest、pnpm。

## Global Constraints

- 产品 UI 文案只使用简体中文，图标只使用 Lucide / Iconify，不使用 emoji 或手绘通用 SVG。
- 触摸目标至少 44×44px；primary solid hover 必须为亮色 primary-700、暗色 primary-400。
- 页面使用共享 token，不创建页面级颜色系统或页面级暗色覆盖。
- `/dev/design-system` 只在开发环境注册，生产构建中不得包含该路由或页面 chunk。
- 展示 typography、color、button、badge、input、select、textarea、checkbox、radio、avatar、modal、drawer、toast、tooltip、skeleton、empty state、icon 和 focus。
- 参考图只控制视觉语言；不实现 FE-004 AppHeader、真实 logo、生产导航或 FE-006 之后的首页业务区块。
- 不添加新依赖，不创建 Git commit，FE-003 验证后停止。

---

### Task 1: 修复 FE-002 设计差距

**Files:**
- Modify: `frontend/src/shared/theme/config.ts`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/src/shared/styles/main.css`
- Modify: `docs/frontend/FrontendDesign.md`

**Interfaces:**
- Consumes: `uiColors` 与共享 primary token。
- Produces: `uiTheme`，为 Nuxt UI 标准按钮提供 44px 触摸目标与精确 primary hover 色阶。

- [x] **Step 1: 写入可由页面行为测试消费的主题配置接口**

  将 `uiColors` 与 button 主题组合为 `uiTheme`，按钮基础 slot 包含 `min-h-11 min-w-11`；primary solid compound variant 使用 `hover:bg-primary-700 dark:hover:bg-primary-400`。

- [x] **Step 2: 同步全局链接触摸目标与设计文档**

  新增共享 `.ui-touch-link`，提供至少 44px 高度；将暗色 token 的权威位置从 `main.css` 更正为 `tokens.css`。

- [x] **Step 3: 在浏览器中验证修复**

  检查按钮和图标按钮的 `getBoundingClientRect()` 均不小于 44px，并检查亮暗 hover 的 computed background。

---

### Task 2: 用 TDD 建立开发路由边界

**Files:**
- Modify: `frontend/tests/unit/router.spec.ts`
- Create: `frontend/tests/integration/production-route.spec.ts`
- Modify: `frontend/src/router/routes.ts`
- Create: `frontend/src/pages/dev/design-system/DevDesignSystemPage.vue`

**Interfaces:**
- Consumes: `import.meta.env.DEV`。
- Produces: 开发环境 `/dev/design-system` 路由；生产环境只保留公开路由。

- [x] **Step 1: 写失败测试**

  单元测试要求开发路由存在；生产构建测试调用 Vite `build()` 输出到临时目录，断言 bundle 不包含 `/dev/design-system` 与设计系统页面文案。

- [x] **Step 2: 运行测试并确认 RED**

  Run: `pnpm test tests/unit/router.spec.ts tests/integration/production-route.spec.ts`

  Expected: 当前缺少开发路由与设计系统页面，测试失败。

- [x] **Step 3: 实现最小开发路由**

  使用顶层 `if (import.meta.env.DEV)` 注册 lazy page，确保 Vite 在生产时删除整个动态 import 分支。

- [x] **Step 4: 运行测试并确认 GREEN**

  Run: `pnpm test tests/unit/router.spec.ts tests/integration/production-route.spec.ts`

  Expected: 开发路由断言及生产 bundle 排除断言通过。

---

### Task 3: 用 TDD 实现活体设计系统页面

**Files:**
- Create: `frontend/tests/unit/design-system-page.spec.ts`
- Modify: `frontend/src/pages/dev/design-system/DevDesignSystemPage.vue`
- Modify: `frontend/src/pages/home/HomePage.vue`
- Modify: `frontend/tests/unit/home-page.spec.ts`

**Interfaces:**
- Consumes: Nuxt UI 组件、共享 token、`useToast()`。
- Produces: 可交互的组件视觉参考页；首页恢复为非业务占位页。

- [x] **Step 1: 写页面内容和交互的失败测试**

  测试真实页面组件，验证全部组件类别可被语义查询；点击按钮后 modal、drawer 与 toast 触发可观察状态，字段 label 与控件保持关联。

- [x] **Step 2: 运行测试并确认 RED**

  Run: `pnpm test tests/unit/design-system-page.spec.ts tests/unit/home-page.spec.ts`

  Expected: 设计系统内容与交互尚不存在，测试失败。

- [x] **Step 3: 实现参考图视觉语言**

  使用浅灰 canvas、白色 surface、蓝色重点、紧凑标题栏、首屏左右分栏、2×2 foundation entry、主内容与右侧 rail；所有组件保持代码原生、可交互并由共享 token 驱动。

- [x] **Step 4: 运行测试并确认 GREEN**

  Run: `pnpm test tests/unit/design-system-page.spec.ts tests/unit/home-page.spec.ts`

  Expected: 页面与交互测试通过，无 Vue warning。

---

### Task 4: 视觉对照与完整验证

**Files:**
- Modify as needed: FE-003 files listed above

**Interfaces:**
- Consumes: 用户参考图 `C:/Users/LIU/Downloads/ChatGPT Image 2026年8月25日 14_13_04.png`。
- Produces: 桌面、平板、移动和暗色模式的最终浏览器证据及 fidelity ledger。

- [x] **Step 1: 启动应用并执行 Browser/IAB 验证**

  目标流程：`/dev/design-system` 加载 → 切换暗色 → 打开 modal / drawer → 触发 toast → 状态正确且控制台无错误。

- [x] **Step 2: 对照 1536×1024 原图与实现截图**

  至少检查容器、首屏比例、文字层级、surface、蓝色强调、边框/阴影、间距、图标、组件密度和响应式；用 `view_image` 同轮查看参考图与最终截图。

- [x] **Step 3: 验证 1440、768、390 和暗色模式**

  检查无横向溢出、44px 触摸目标、可见 focus、200% 等效重排、modal/drawer 焦点行为与 reduced-motion 基线。

- [x] **Step 4: 运行完整质量门**

  Run: `pnpm check`

  Expected: lint、typecheck、tests、production build 全部 exit code 0。

- [x] **Step 5: 审查范围并停止**

  确认没有生产导航、应用外壳、首页业务 fixtures、API、后端或新依赖；删除临时 QA 文件，当前任务不提交 Git。
