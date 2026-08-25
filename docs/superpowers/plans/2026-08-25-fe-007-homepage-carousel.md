# FE-007 首页轮播实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用生产组件替换原型轮播，实现首页校园轮播（`HomeCarousel`）。

**Architecture:** 使用 Nuxt UI `UCarousel`（基于 Embla）驱动，不手写轮播 JS。轮播内容源自 FE-005 的 `carouselSlides` fixture（`CarouselSlide` 类型）。`HomeCarousel` 注入 `HomeHero` 的 `media` 插槽，使 Hero 在桌面为两列（左主信息 + 右轮播）、窄屏单列堆叠。

**Tech Stack:** Vue 3、Vue Router、TypeScript、Nuxt UI v4（UCarousel）、Tailwind CSS v4、Vitest、Vue Test Utils

## 执行状态（2026-08-25）

- 实现：Task 1–2 已完成，`HomeCarousel`（3 张幻灯片、箭头、分页点、自动播放、悬停暂停、reduced-motion 关闭自动播放、键盘/触摸）已落地并接入首页 Hero。
- TDD：为轮播编写组件/语义测试；因首页新增轮播，同步修正 `home-hero.spec` 快捷入口选择器与 `public-shell-routing.spec` 的抽屉 `getComputedStyle` stub（embla 依赖其 `getPropertyValue`）。
- 完整质量门：`pnpm check` 全绿（lint、`vue-tsc --build`、`vitest run` 50/50、含生产路由集成测试、`vite build` 通过）。
- 视觉验证：1440 桌面（Hero 两列、右轮播深色卡、白色箭头、分页点、CTA 完整）与 500px 窄屏（单列堆叠、16:9、无溢出）截图确认。
- Git：本 FE-007 变更尚未提交或推送（本记录完成时提交）。

## Global Constraints

- 使用 Nuxt UI `UCarousel`，不保留手写原型轮播 JS（§19）。
- 内容为校园主题 / 竞赛 / 组织招新；一张幻灯片最多一个类别标签 + 一条标题 + 一句说明 + 一个可选 CTA（§19）。
- 统一 16:9 画框（§19 / §38），移动端与 PC 端一致、素材最易获得；主表面圆角 12px（§9）。
- 行为：5–6 秒自动播放、悬停暂停、手动箭头、分页指示、触摸滑动、键盘可访问；`prefers-reduced-motion` 时关闭自动播放（§19 / §33）。
- 图片预留尺寸、`object-fit: cover`、懒加载（§38）；真实校园图片未接入前以品牌中性深色背景占位（§19 禁止装饰性 AI 图、§2 真实摄影优先）。
- 产品图标仅 Lucide（§17.1）；不使用 emoji / Unicode 箭头；不引入手绘图标（§3.2/§3.3）。
- 范围外：真实校园媒体、详情路由（CTA 目标）、截止时间 / 竞赛区块、API、后端；FE-007 完成后停止，不进入 FE-008。

---

### Task 1: HomeCarousel 组件

**Files:**
- Create: `frontend/src/features/homepage/components/HomeCarousel.vue`

**Interfaces:**
- Consumes: `carouselSlides` fixture 与 `CarouselSlide` 类型、Nuxt UI `UCarousel`、`UButton`、设计 token。
- Produces: 首页校园轮播；接收可选 `slides` prop（默认 `carouselSlides`）。

- [x] **Step 1: 配置 UCarousel**

  使用 `arrows` + `dots` + `autoplay`（5s、`stopOnInteraction:false`、`stopOnMouseEnter:true`）+ `loop`；`items` 为幻灯片；`#default="{ item }"` 渲染每张幻灯片。

- [x] **Step 2: 实现幻灯片内容**

  统一 16:9（`aspect-video`）预留图片区，深色占位背景 + 文字叠加（类别 chip、标题 h2、一句说明、单一 CTA 按钮）；图片存在时用 `object-fit: cover` + 可配置 `object-position` 焦点 + 懒加载。

- [x] **Step 3: 自定义箭头与分页点**

  白色圆角箭头（`left-3!`/`right-3!` 水平居中、`z-10`）保证深色背景可见；内容区左右内边距（`px-14 sm:px-16`）使文字避让箭头；分页点位于卡片下方。

- [x] **Step 4: reduced-motion 处理**

  读取 `prefers-reduced-motion`（`globalThis.matchMedia`）并在匹配时令 `autoplay` 关闭；监听 change 并在卸载时清理监听。

---

### Task 2: 接入首页与测试

**Files:**
- Modify: `frontend/src/pages/home/HomePage.vue`
- Create: `frontend/tests/unit/home-carousel.spec.ts`
- Modify: `frontend/tests/unit/home-hero.spec.ts`
- Modify: `frontend/tests/unit/public-shell-routing.spec.ts`

**Interfaces:**
- Consumes: 完成的 `HomeCarousel`。
- Produces: 首页 Hero 的媒体列（轮播），及轮播 / 相关测试更新。

- [x] **Step 1: 注入 Hero 媒体插槽**

  `HomePage` 渲染 `<HomeHero><template #media><HomeCarousel /></template></HomeHero>`，桌面两列、窄屏单列堆叠。

- [x] **Step 2: 编写轮播测试**

  断言渲染三张幻灯片（类别 + 标题）、可访问轮播 region、prev/next 控件存在、每张提供单个 CTA；`beforeEach` 中 stub `matchMedia`。

- [x] **Step 3: 修正受影响测试**

  `home-hero.spec` 快捷入口断言缩小到 `main ul a`；`public-shell-routing.spec` 抽屉 `getComputedStyle` stub 补全 `getPropertyValue`（embla 测量依赖）。

- [x] **Step 4: 运行完整校验**

  Run: `pnpm check`。期望 lint、typecheck、全量测试（含生产路由集成测试）、build 全部退出码 0。

---

### Task 3: 视觉验证与范围审查

**Files:**
- Modify: `docs/superpowers/plans/2026-08-25-fe-007-homepage-carousel.md`
- Modify: `docs/frontend/FrontendImplementationPlan.md`（进度表 FE-007 状态）

**Interfaces:**
- Consumes: 完成的 `HomeCarousel`。
- Produces: 桌面 / 窄屏视觉验证证据与范围审查结论。

- [x] **Step 1: 浏览器验证桌面端**

  1440px 检查 Hero 两列（左主信息 + 右轮播），轮播深色卡、白色箭头、分页点、CTA、文字完整、无溢出。

- [x] **Step 2: 浏览器验证窄屏**

  500px（Chrome 允许的最窄）检查单列堆叠（主信息 + 快捷入口在上、轮播在下）、16:9、无横向溢出。

- [x] **Step 3: 审查范围并停止**

  确认未实现真实校园媒体、详情路由、截止时间 / 竞赛区块、API 或后端；将本计划实际完成项标记为 `[x]`。
