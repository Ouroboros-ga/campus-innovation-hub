# FE-001 Vue 前端基础实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `frontend/` 创建可运行、可测试、可构建的 Vue 3 + Vite + TypeScript + Nuxt UI v4 前端基础。

**Architecture:** 入口位于 `src/app/main.ts`，注册 Vue Router、Pinia 与 Nuxt UI；页面只组合路由视图，路由定义与守卫骨架分别放在 `src/router/`。本任务仅提供首页占位和目录骨架，不建立 FE-002 的主题 token，也不实现业务组件。

**Tech Stack:** Vue 3、Vite、TypeScript strict、Nuxt UI v4、Tailwind CSS v4、Vue Router、Pinia、ESLint flat config、Vitest、pnpm。

## Global Constraints

- 产品 UI 文案仅使用简体中文。
- Nuxt UI 是唯一组件库；不添加第二套 UI 框架、axios 或动效依赖。
- Vite alias 固定为 `@ -> src`，Vue Router 使用 `createWebHistory()`。
- `packageManager` 固定实际 pnpm 版本，提交 `pnpm-lock.yaml`。
- 只执行 FE-001；不实现主题、最终导航、首页设计、API、认证或 Django 集成。

---

### Task 1: 建立并验证前端基础

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/index.html`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.app.json`
- Create: `frontend/tsconfig.node.json`
- Create: `frontend/eslint.config.js`
- Create: `frontend/.env.example`
- Create: `frontend/.gitignore`
- Create: `frontend/src/app/App.vue`
- Create: `frontend/src/app/main.ts`
- Create: `frontend/src/router/index.ts`
- Create: `frontend/src/router/routes.ts`
- Create: `frontend/src/router/guards.ts`
- Create: `frontend/src/pages/home/HomePage.vue`
- Create: `frontend/src/shared/styles/main.css`
- Create: `frontend/tests/unit/home-page.spec.ts`
- Create: `frontend/tests/setup.ts`

**Interfaces:**
- Consumes: Nuxt UI Vue/Vite 插件、Vue Router、Pinia。
- Produces: `router: Router`、`routes: RouteRecordRaw[]`、`registerRouterGuards(router: Router): void`，以及 `/` 首页占位路由。

- [x] **Step 1: 写失败的首页冒烟测试**

  测试挂载真实 `HomePage.vue`，断言简体中文占位标题与真实 Nuxt UI `UButton` 渲染为可访问按钮。

- [x] **Step 2: 运行测试并确认 RED**

  Run: `pnpm test tests/unit/home-page.spec.ts`

  Expected: 因 `HomePage.vue` 尚不存在而失败。

- [x] **Step 3: 实现最小脚手架与首页占位**

  创建配置、入口、路由、Pinia/Nuxt UI 注册、全局 CSS 导入、目录骨架与最小首页。首页仅包含标题、说明和一个用于验证组件链路的 `UButton`。

- [x] **Step 4: 运行单测并确认 GREEN**

  Run: `pnpm test tests/unit/home-page.spec.ts`

  Expected: 1 个测试文件通过，首页标题和按钮断言通过。

- [x] **Step 5: 完成静态与构建验证**

  Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm check`

  Expected: 所有命令 exit code 0。

- [x] **Step 6: 完成浏览器冒烟验证**

  启动 `pnpm dev`，验证 `/` 页面身份、非空渲染、无错误覆盖层、控制台健康、Nuxt UI 按钮可聚焦，并检查桌面与移动视口。

- [x] **Step 7: 审查范围与差异**

  检查 `git diff` / `git status`，确认没有第二套 UI 库、没有 FE-002 token 或业务功能、没有覆盖用户现有未跟踪文件。当前任务不自动创建 Git commit。
