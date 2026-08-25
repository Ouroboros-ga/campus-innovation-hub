# FE-004 应用外壳实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为六个学生端公开占位路由实现共享、响应式、支持暗色模式的应用外壳。

**Architecture:** 使用 `PublicLayout` 作为公开路由父布局，由聚焦的 shared app components 组成 Header、导航、工具区、Footer 与页面容器。路由元信息只承载占位页标题，业务 feature、真实认证、搜索结果和通知数据保持在 FE-004 范围外。

**Tech Stack:** Vue 3、Vue Router、TypeScript、Nuxt UI v4、Tailwind CSS v4、Vitest、Vue Test Utils

## 执行状态（2026-08-25）

- 实现：Task 1–3 已完成，公开路由、`PublicLayout`、Header、DesktopNavigation、`UDrawer`、Footer 和页面容器均已落地。
- TDD：先运行 `public-shell-routing.spec.ts` 确认 RED，再实现至 GREEN；当前 FE-004 相关路由测试共 11 项通过。
- 完整质量门：`pnpm check` 已通过，全部 7 个测试文件、19 项测试通过，生产构建通过。
- 桌面视觉：已检查页面内容、活动路由状态、用户菜单、亮暗主题、Header 65px、活动下划线 2px、44px 工具按钮、无横向溢出及无控制台 warn/error；并于 2026-08-25 通过 headless Chrome 在 1440 宽度下复核外壳与参考图对齐。
- 移动视觉：已通过 headless Chrome（390×844）完成真实窄视口检查，Header 无溢出、桌面导航正确隐藏、移动菜单按钮可见，Footer 与占位内容正常渲染。
- Git：FE-001 至 FE-003 基线已在提交 `2e6ab93` 推送；FE-004 已于提交 `c3dea20` 推送（本记录最终更新于 2026-08-25）。

## Global Constraints

- 唯一产品语言为简体中文（zh-CN）。
- 仅使用 Lucide 图标，不使用 emoji、Unicode 箭头或手绘通用 SVG。
- 颜色、圆角、间距和暗色模式消费现有 design token。
- Desktop Header 高度为 64–68px，活动路由使用 primary 文本与 2px 底部指示线。
- Mobile 主导航使用 Nuxt UI `UDrawer`，触控目标不小于 44px。
- 不实现真实认证、通知 API、全局搜索结果、业务 feature 内容或后端。
- FE-004 完成后停止，不进入 FE-005。

---

### Task 1: 公开路由与持久布局契约

**Files:**
- Create: `frontend/tests/unit/public-shell-routing.spec.ts`
- Create: `frontend/src/layouts/PublicLayout.vue`
- Create: `frontend/src/pages/placeholder/PublicPlaceholderPage.vue`
- Modify: `frontend/src/router/routes.ts`
- Modify: `frontend/src/pages/home/HomePage.vue`

**Interfaces:**
- Consumes: Vue Router 嵌套路由与现有 `HomePage`。
- Produces: `PublicLayout` 父路由，以及 `/`、`/competitions`、`/organizations`、`/teams`、`/activities`、`/qa` 六个可访问子路由。

- [x] **Step 1: 编写失败测试**

  挂载真实 router，逐个导航到六个公开路由，断言共享 `banner`、`main`、`contentinfo` 均存在，并断言当前页面 H1 与预期标题一致。

- [x] **Step 2: 运行测试并确认 RED**

  Run: `pnpm test -- tests/unit/public-shell-routing.spec.ts`

  Expected: FAIL，因为公开父布局与五个占位路由尚不存在。

- [x] **Step 3: 实现最小公开路由骨架**

  将公开页面注册为 `PublicLayout` 的 children；创建可复用占位页，并保持开发设计系统路由位于公开布局之外且只在开发环境注册。

- [x] **Step 4: 运行测试并确认 GREEN**

  Run: `pnpm test -- tests/unit/public-shell-routing.spec.ts`

  Expected: PASS。

---

### Task 2: 桌面 Header、导航与工具区

**Files:**
- Create: `frontend/src/shared/components/app/navigation.ts`
- Create: `frontend/src/shared/components/app/AppLogo.vue`
- Create: `frontend/src/shared/components/app/DesktopNavigation.vue`
- Create: `frontend/src/shared/components/app/SearchButton.vue`
- Create: `frontend/src/shared/components/app/NotificationButton.vue`
- Create: `frontend/src/shared/components/app/UserMenu.vue`
- Create: `frontend/src/shared/components/app/AppHeader.vue`
- Modify: `frontend/src/layouts/PublicLayout.vue`
- Modify: `frontend/tests/unit/public-shell-routing.spec.ts`

**Interfaces:**
- Consumes: 六个公开路由、Nuxt UI `UButton`、`UAvatar`、`UDropdownMenu`、`UColorModeButton`。
- Produces: 共享导航配置与 64–68px Desktop Header，当前路由以文本颜色和 2px 底线表示。

- [x] **Step 1: 扩展失败测试**

  断言六项导航均可见；点击“竞赛”后 URL 与 H1 更新；活动项获得 `aria-current="page"`；搜索、通知、外观和用户按钮均有可访问名称。

- [x] **Step 2: 运行测试并确认 RED**

  Run: `pnpm test -- tests/unit/public-shell-routing.spec.ts`

  Expected: FAIL，因为 Header 子组件尚未实现。

- [x] **Step 3: 实现桌面外壳**

  使用现有 blue/neutral token 与截图的白色表面、紧凑导航、克制边框风格；AppLogo 使用 Lucide 临时品牌符号和“科创与就业服务平台 / 人工智能学院”文字，保留未来替换正式 Logo 的单一组件边界。

- [x] **Step 4: 运行测试并确认 GREEN**

  Run: `pnpm test -- tests/unit/public-shell-routing.spec.ts`

  Expected: PASS。

---

### Task 3: Mobile Drawer 与 Footer

**Files:**
- Create: `frontend/src/shared/components/app/MobileNavigation.vue`
- Create: `frontend/src/shared/components/app/AppFooter.vue`
- Create: `frontend/src/shared/components/layout/PageContainer.vue`
- Modify: `frontend/src/shared/components/app/AppHeader.vue`
- Modify: `frontend/src/layouts/PublicLayout.vue`
- Modify: `frontend/tests/unit/public-shell-routing.spec.ts`

**Interfaces:**
- Consumes: 共享导航配置、Nuxt UI `UDrawer` 与现有 `.page-container` token 规则。
- Produces: 小屏菜单按钮、可关闭 Drawer、移动导航及全站 Footer。

- [x] **Step 1: 扩展失败测试**

  断言点击“打开主菜单”后 Drawer 出现；点击“社团组织”后路由更新且 Drawer 关闭；Footer 展示版权与四个辅助说明文本。

- [x] **Step 2: 运行测试并确认 RED**

  Run: `pnpm test -- tests/unit/public-shell-routing.spec.ts`

  Expected: FAIL，因为 Drawer 与 Footer 尚未实现。

- [x] **Step 3: 实现移动外壳与 Footer**

  Mobile Header 保留 Logo、搜索、通知、头像、菜单；Drawer 内提供主导航与外观切换。Footer 使用截图中的克制单行链接结构，在窄屏自然换行且不产生横向溢出。

- [x] **Step 4: 运行测试并确认 GREEN**

  Run: `pnpm test -- tests/unit/public-shell-routing.spec.ts`

  Expected: PASS。

---

### Task 4: 完整校验与视觉门禁

**Files:**
- Modify: `docs/superpowers/plans/2026-08-25-fe-004-application-shell.md`

**Interfaces:**
- Consumes: 完成的 FE-004 应用外壳与用户提供的 1536×1024 页面参考图。
- Produces: 自动化、桌面、移动、暗色和交互验证证据。

- [x] **Step 1: 运行完整自动化校验**

  Run: `pnpm check`

  Expected: lint、typecheck、test、build 全部退出码 0，生产构建不包含开发设计系统路由。

- [x] **Step 2: 浏览器验证桌面端**

  在 1536×1024 检查 `/`，确认页面非空、无框架错误覆盖、控制台无相关 warn/error；验证六项导航、活动路由状态、用户菜单与外观切换。

- [x] **Step 3: 浏览器验证移动端**

  在约 390×844 检查 Header 无溢出，打开 Drawer，通过 Drawer 导航后正确关闭，并确认主要触控目标达到 44px。

  已于 2026-08-25 通过 headless Chrome（390×844）完成真实窄视口视觉检查：Header 含 logo、桌面导航正确隐藏（`hidden xl:flex`）、移动菜单按钮可见，Footer 与占位内容正常渲染，无横向溢出；Drawer 打开、导航与关闭由真实 Nuxt UI 集成测试覆盖。

- [x] **Step 4: 对照视觉规范**

  同轮使用 `view_image` 检查用户参考图与最新桌面截图，至少比较 Header 高度、容器宽度、导航密度、字体层级、颜色/边框、图标和响应式折叠。

- [x] **Step 5: 审查范围并停止**

  确认未添加真实认证、搜索结果、通知数据、首页业务区块或 FE-005 类型/fixture；将本计划所有实际完成项标记为 `[x]`。
