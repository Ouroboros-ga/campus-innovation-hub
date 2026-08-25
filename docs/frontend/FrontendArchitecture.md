# FrontendArchitecture.md

> Project: campus-innovation-hub  
> Product: 人工智能学院科创与就业服务平台  
> Version: 0.3  
> Status: Architecture Baseline  
> Frontend: Vue 3 + Vite + TypeScript + Nuxt UI v4  
> Web Targets: Desktop Web + Responsive Mobile Web  
> Production mode: Static SPA served by Nginx  
> Backend boundary: Django REST Framework API  
> Locale: 简体中文（zh-CN）— 唯一产品语言，前端不引入 i18n 框架
> Reference verification：2026-08-25（公开 GitHub / 官方 Nuxt UI 文档）

---

# 目的（Purpose）

本文档定义前端如何被工程化组织。

`FrontendDesign.md` 回答：

> 产品应该长什么样、给人什么感觉？

本文档回答：

> 前端代码库应如何组织，才能让产品保持可维护、可测试，并方便人类开发者与 coding agent 扩展？

架构刻意保守。

产品是一个面向多届学生群体的校园服务平台，不应依赖某一个开发者理解一套精巧的自定义框架。

因此架构优先考虑：

- 清晰的目录归属（file ownership）
- 可预测的数据流
- 低运维复杂度
- 强 TypeScript 边界
- 小而可审查的变更
- 未来维护者容易上手
- 兼容 2C2G 生产服务器
- 与 Django 的直接集成

---

# 参考仓库与技能（Reference Repositories and Skills）

本架构参考了以下公开项目与 agent 工程模式。

## Nuxt UI

仓库：

https://github.com/nuxt/ui

重要性：

- 通过 Vite plugin 与 Vue plugin 官方支持纯 Vue 项目
- 基于 Tailwind CSS
- 通过 Reka UI 提供可访问的基础组件
- 提供本项目所需的通用组件
- 自带 `AGENTS.md`、测试布局与 Vue playground
- 适合使用单一组件系统而不是混用多个库

## Nuxt UI Vue Starter

仓库：

https://github.com/nuxt-ui-templates/starter-vue

作为：

- 最小 Vue + Vite + Nuxt UI 配置的参考
- Vite、TypeScript 与 ESLint 基线的参考

不要把它当作产品架构本身。

## Nuxt UI Dashboard Vue

仓库：

https://github.com/nuxt-ui-templates/dashboard-vue

作为：

- 运营 / 管理 UI 的参考
- command palette 模式
- 响应式导航模式
- 表格与 dashboard 组合

不要将其视觉身份复制到学生端产品中。

## Anthropic frontend-design Skill

仓库：

https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md

用于：

- 刻意的视觉方向
- 反模板纪律
- 避免通用 AI 审美

## Microsoft frontend-design-review Skill

官方仓库：

https://github.com/microsoft/skills

精确 Skill 文件：

https://github.com/microsoft/skills/blob/main/.github/skills/frontend-design-review/SKILL.md

该文件已于 2026-08-25 重新验证，可直接访问；其 frontmatter 名称为 `frontend-design-review`。

用于：

- design system 合规性
- design token 使用检查，避免无依据 hardcoded values
- 明确用户任务与主操作层级
- 任务路径效率检查
- 响应式与 reflow 检查
- 键盘、焦点与无障碍审查
- 明确区分 blocking / major / minor 的审查结论
- 识别 generic AI aesthetics 与模板化前端问题

说明：

`microsoft/GitHubCopilot_Customized` 是另一个真实的 Microsoft 仓库，但不是本项目引用 `frontend-design-review` Skill 时的替代来源。此处以后统一引用 `microsoft/skills` 中的精确 `SKILL.md` 文件。

## ByteDance DeerFlow AGENTS Pattern

仓库：

https://github.com/bytedance/deer-flow/blob/main/AGENTS.md

https://github.com/bytedance/deer-flow/blob/main/frontend/AGENTS.md

用于：

- 根级 `AGENTS.md` 作为定位层
- 模块级 guidance（需要更深入规则的地方）
- 必需命令与验证门禁
- 文档与代码保持同步

## AG Kit frontend architecture pattern

仓库：

https://github.com/vudovn/ag-kit

用于：

- UI / logic / data / type 职责分离
- 状态分层
- API 服务边界
- composable-first 的 Vue 组织
- UI 实现之前先确立设计 source of truth

---

# 架构决策摘要（Architecture Decision Summary）

项目将使用：

```text
Browser
   |
   v
Nginx
   |
   +---- static frontend files from frontend/dist/
   |
   +---- /api/*
             |
             v
          Django
             |
             v
        PostgreSQL
```

生产前端不需要 Node.js 服务器。

这是刻意的。

2C2G 服务器只需要运行常规后端栈：

```text
Nginx
Gunicorn
Django
PostgreSQL
```

Vue 前端在构建 / 部署时编译，以静态文件形式提供。

---

# 核心技术决策（Core Technology Decisions）

## 运行时与包管理器

推荐：

```text
Node.js 22 LTS
pnpm
```

项目必须在 `package.json` 中固定包管理器版本。

示例：

```json
{
  "packageManager": "pnpm@<pinned-version>"
}
```

不允许贡献者或 agent 在以下工具之间随意切换：

```text
npm
yarn
pnpm
bun
```

提交的 lock 文件是：

```text
pnpm-lock.yaml
```

---

# 框架（Framework）

使用：

```text
Vue 3
Vite
TypeScript
```

这是 SPA。

除非显式重新审议架构，不要引入 Nuxt Framework。

原因：

- 产品当前不需要 SSR
- 部署更简单
- Django 保持后端地位
- Nginx 可以高效提供静态前端文件
- 团队已经选择 Vue + Vite
- Nuxt UI 直接支持 Vue + Vite

---

# UI 系统（UI System）

使用：

```text
@nuxt/ui v4
Tailwind CSS v4
```

官方 Nuxt UI 当前文档明确支持 plain Vue + Vite，并提供 Color Mode、Icon、Carousel、Command Palette、Table、Form、Overlay 等本项目需要的能力。生产实现应以安装版本对应的官方文档为准，不复制旧版教程。

Nuxt UI 的 Vue 安装遵循官方模式：

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'

export default defineConfig({
  plugins: [
    vue(),
    ui()
  ]
})
```

应用插件：

```ts
import ui from '@nuxt/ui/vue-plugin'

app.use(ui)
```

主 CSS：

```css
@import "tailwindcss";
@import "@nuxt/ui";
```

确切语法应遵循已安装的 Nuxt UI 版本。

不要不检查当前包就复制旧 Nuxt UI v2/v3 教程的配置。

---

# 图标系统（Icon System）

使用：

```text
Nuxt UI UIcon
Iconify
Lucide icon names
```

示例：

```text
i-lucide-search
i-lucide-bell
i-lucide-trophy
i-lucide-calendar-days
```

产品 UI 不使用 emoji 作为图标。

图标硬规则见 `FrontendDesign.md`。

---

# 路由（Router）

使用：

```text
vue-router
createWebHistory()
```

路由树是显式且经过评审的。

初始公开路由：

```text
/
 /competitions
 /competitions/:id
 /teams
 /teams/:id
 /teams/create
 /organizations
 /organizations/:id
 /organizations/:id/recruitments/:recruitmentId
 /activities
 /activities/:id
 /activities/announcements/:announcementId
 /qa
```

认证区：

```text
/me
/me/follows
/me/teams
/me/applications
/me/activities
/me/questions
/me/settings
```

组织管理：

```text
/manage/organizations/:organizationId
/manage/organizations/:organizationId/profile
/manage/organizations/:organizationId/recruitments
/manage/organizations/:organizationId/applications
```

平台运营：

```text
/ops
/ops/competitions
/ops/activities
/ops/questions
/ops/guides
```

`/activities` 的展示名为“校园动态”，通过 URL query `tab=all|activities|announcements` 在同一学生端一级入口内浏览活动与公告。`/activities/announcements/:announcementId` 是公告详情子路由，不构成一级导航。路由注册时必须先声明静态 `announcements` 子路径，再声明 `/activities/:id` 动态路径。

`/organizations` 登录后按需展示“我的组织”上下文区块；`/me/organizations` 不存在。LEADER 从该区块携带具体 `organizationId` 进入 `/manage/organizations/:organizationId`；不能依赖无作用域的全局组织管理入口。

`/ops/activities` 的展示名为“校园动态管理”，在页内管理活动与公告；前端不建立 `/ops/announcements` 页面路由，但仍通过各自的后端 API 管理两个领域。

第一个前端里程碑不要求所有路由都存在。

路由结构是目标架构。

---

# 路由 Meta（Route Meta）

路由 meta 可以描述客户端 UX 需求。

示例：

```ts
meta: {
  requiresAuth: true,
  surface: 'organization-management'
}
```

后续：

```ts
meta: {
  requiresAuth: true,
  platformRole: 'operator'
}
```

## Mobile Shell Meta

Phone presentation is route-driven rather than detected from business component code.

Recommended route meta:

```ts
type MobileShell = 'tab' | 'detail' | 'form' | 'manage'

meta: {
  mobileShell: 'tab',
  mobileTab: 'home'
}
```

Approved phone root tabs:

```text
home
competitions
teams
activities
me
```

Examples:

```ts
/                  -> { mobileShell: 'tab',    mobileTab: 'home' }
/competitions      -> { mobileShell: 'tab',    mobileTab: 'competitions' }
/competitions/:id  -> { mobileShell: 'detail' }
/teams             -> { mobileShell: 'tab',    mobileTab: 'teams' }
/teams/create      -> { mobileShell: 'form' }
/teams/:id         -> { mobileShell: 'detail' }
/activities        -> { mobileShell: 'tab',    mobileTab: 'activities' }
/activities/:id    -> { mobileShell: 'detail' }
/activities/announcements/:announcementId -> { mobileShell: 'detail' }
/me                -> { mobileShell: 'tab',    mobileTab: 'me' }
/manage/*           -> { mobileShell: 'manage' }
/ops/*              -> { mobileShell: 'manage' }
```

`mobileShell` is UI composition metadata only.

It is not permission metadata.

The same route remains the same product page on desktop and phone.

Do not create:

```text
/m/competitions
/mobile/teams
```

as duplicate mobile routes.

重要：

> 客户端路由守卫不是安全边界。

Django 必须在每个受保护的 API 请求上强制权限。

前端可以出于用户体验隐藏或拦截 UI，但不能授予授权。

---

# 移动 Web Shell 架构（Mobile Web Shell Architecture）

Responsive Mobile Web is part of the primary V0.1 frontend.

It is not a separate application.

## Device Classes

```text
Phone   < 768px
Tablet  768–1023px
Desktop >= 1024px
```

These are layout classes, not device fingerprints.

Use CSS media queries and feature detection.

Do not branch layout by phone model or user-agent string.

## Shared Components

Add shared shell components:

```text
AppHeader.vue
DesktopNavigation.vue
TabletNavigationDrawer.vue
MobileBottomNav.vue
MobilePageHeader.vue
MobileActionBar.vue
PageContainer.vue
```

Business pages do not implement their own independent bottom bars.

## Root Phone Shell

```text
Compact Header
Router View
MobileBottomNav
```

Root tabs are persistent only for:

```text
/
/competitions
/teams
/activities
/me
```

## Detail Phone Shell

```text
MobilePageHeader(back)
Router View
MobileActionBar(optional)
```

No global bottom navigation.

## Form / Task Phone Shell

```text
MobilePageHeader(back)
Focused Task Content
MobileActionBar(optional submit)
```

No global bottom navigation.

## Tablet Shell

Tablet keeps:

```text
Compact Header
UDrawer navigation
Router View
```

Tablet does not inherit the five-tab phone navigation by default.

## Safe Area

`index.html` must include:

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, viewport-fit=cover"
/>
```

Shared CSS defines safe-area helpers using:

```text
env(safe-area-inset-*)
```

Fixed / sticky bottom UI must reserve safe area and content height.

Use:

```text
100dvh
```

when full viewport height is genuinely needed.

Do not use fixed iPhone-specific offsets.

## Mobile Browser Targets

Primary Web validation targets:

```text
iOS Safari
Android Chrome
WeChat in-app browser
```

No core interaction may depend on hover.


---

# 状态架构（State Architecture）

项目将状态分为四层。

## 第 1 层：本地组件状态（Local Component State）

使用本地 Vue 状态处理：

- modal 开 / 关
- 选中的本地 tab
- 提交前的草稿输入
- 轮播位置
- 临时 hover / 展开状态

使用：

```text
ref
reactive
computed
```

不要把本地 UI 状态放进 Pinia。

---

## 第 2 层：URL / 路由状态（URL / Route State）

使用 URL 承载可分享的导航状态：

- 搜索关键词
- 竞赛筛选
- 页码
- 排序方式
- 选中的公开分类

示例：

```text
/competitions?status=open&category=ai&page=2
```

校园动态同样使用 URL，而不以 Pinia 保存 tab 或筛选：

```text
/activities?tab=announcements&publisher_scope=UNIVERSITY&page=2
/activities?tab=activities&status=OPEN&activity_type=TECH_SHARING
```

收益：

- 浏览器后退可用
- 链接可分享
- 刷新保留上下文

除非有强理由，不要把路由状态复制到 Pinia。

---

## 第 3 层：全局客户端状态（Global Client State）

Pinia 只用于持久的跨页面客户端状态。

初始 stores：

```text
session
notifications
ui-preferences
```

可能示例：

```text
src/stores/session.ts
src/stores/notifications.ts
```

不要因为业务域存在就创建：

```text
competitionStore
activityStore
organizationStore
```

服务端数据不自动属于 Pinia。

---

## 第 4 层：服务端状态（Server State）

服务端数据包括：

- competitions（竞赛）
- team posts（组队帖子）
- organization data（组织数据）
- activities（活动）
- announcements（公告）
- applications（申请）
- FAQ / guides
- notifications（通知）

在 V0.1 里程碑中，通过类型化 feature API 模块与 composables 获取服务端数据。

示例：

```text
competition.api.ts
useCompetitionList.ts
useCompetitionDetail.ts
```

当服务端状态缓存、失效与后台刷新变得复杂时，通过 ADR 引入专门的服务端状态库。

不要过早构建自研的全局缓存。

---

# API 边界（API Boundary）

页面组件不得直接调用 `fetch()`。

错误示例：

```ts
// CompetitionPage.vue
const response = await fetch('/api/competitions')
```

必需方向：

```text
Page
  |
  v
Feature composable
  |
  v
Feature API module
  |
  v
Shared HTTP client
  |
  v
Django API
```

示例：

```text
src/shared/api/http.ts
src/features/competition/api/competition.api.ts
src/features/competition/composables/useCompetitionList.ts
```

---

# HTTP 客户端（HTTP Client）

从一个基于原生 `fetch` 的小型 wrapper 开始。

职责：

- base URL
- JSON 解析
- 超时 / abort 支持
- 公共 headers
- 认证实现后的 CSRF 集成
- 归一化的 API 错误
- 开发环境的可选 request ID 日志

不要习惯性地引入 Axios。

只有当原生方案明显变差时才添加依赖。

---

# 认证方向（Authentication Direction）

认证 API 尚未冻结。

Django 的首选生产方向：

```text
同源安全的 HttpOnly session cookie
+
CSRF 保护
```

原因：

- 浏览器不向 JavaScript 暴露 session token
- 与 Django 天然契合
- 避免在 localStorage 中长期保存认证 token
- 适配同域 Nginx 部署

在评审过的认证设计明确要求之前，不要将长期有效的认证密钥存放在：

```text
localStorage
sessionStorage
Pinia persisted state
```

---

# API 运行时校验（API Runtime Validation）

TypeScript 只验证编译期假设。

外部 API 载荷在运行时仍可能是错的。

API 集成开始时，在重要边界使用 schema 校验器。

推荐：

```text
Zod
```

特别用于：

- 当前用户 / session
- 权限上下文
- create / update 表单 schema
- 复杂 API 响应
- 判别式状态值（discriminated status values）

不要对每个微小内部对象做校验，以免产生噪音。

---

# 错误模型（Error Model）

归一化 API 错误。

建议形状：

```ts
export interface AppError {
  code: string
  message: string
  fieldErrors?: Record<string, string[]>
  requestId?: string
}
```

页面不应解析任意的后端错误形状。

API 层将后端错误转换为前端错误模型。

UI 错误必须可操作（actionable）。

---

# 领域类型（Domain Types）

在有用的情况下，分离传输类型（transport types）与 UI / 领域类型。

建议：

```text
src/features/competition/types/competition.api.ts
src/features/competition/types/competition.ts
```

不要无理由创建重复类型。

在以下情况使用映射：

- 后端命名与前端不同
- 日期需要归一化
- 可选传输字段变成显式领域状态
- API 载荷形状对 UI 不理想

---

# 日期与时间（Dates and Times）

后端应返回 ISO 8601 时间戳。

前端：

- 集中解析时间戳
- 通过共享工具格式化日期
- 通过共享工具计算倒计时状态
- 绝不在组件中硬编码已格式化的日期字符串

建议：

```text
src/shared/lib/date.ts
```

实用时使用浏览器 `Intl.DateTimeFormat`。

避免为简单格式化引入大型日期库。

---

# 项目结构（Project Structure）

目标结构：

```text
frontend/
├── public/
│
├── src/
│   ├── app/
│   │   ├── App.vue
│   │   ├── main.ts
│   │   └── providers/
│   │
│   ├── router/
│   │   ├── index.ts
│   │   ├── routes.ts
│   │   └── guards.ts
│   │
│   ├── layouts/
│   │   ├── PublicLayout.vue
│   │   ├── AccountLayout.vue
│   │   ├── OrganizationManageLayout.vue
│   │   └── OperationsLayout.vue
│   │
│   ├── pages/
│   │   ├── home/
│   │   ├── competitions/
│   │   ├── teams/
│   │   ├── organizations/
│   │   ├── activities/
│   │   ├── qa/
│   │   ├── account/
│   │   └── operations/
│   │
│   ├── features/
│   │   ├── competition/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── composables/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   │
│   │   ├── team/
│   │   ├── organization/
│   │   ├── activity/
│   │   ├── qa/
│   │   └── auth/
│   │
│   ├── shared/
│   │   ├── api/
│   │   ├── components/
│   │   │   ├── AppHeader.vue
│   │   │   ├── MobileBottomNav.vue
│   │   │   ├── MobilePageHeader.vue
│   │   │   └── MobileActionBar.vue
│   │   ├── composables/
│   │   ├── lib/
│   │   ├── styles/
│   │   └── types/
│   │
│   ├── stores/
│   │   ├── session.ts
│   │   └── notifications.ts
│   │
│   └── mocks/
│       └── fixtures/
│
├── tests/
│   ├── unit/
│   └── e2e/
│
├── .env.example
├── eslint.config.*
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── vite.config.ts
```

---

# 结构规则（Structure Rules）

## 页面（Pages）

页面组件拥有：

- 路由级组合
- 页面 meta
- feature 区块的编排
- 路由参数读取

页面不应拥有：

- 原始 API 实现
- 大型可复用 UI
- 共享表单 schema
- 通用格式化工具

页面通常应可读作一段组合。

示例：

```vue
<HomeHero />
<HomeDeadlineSection />
<HomeCompetitionSection />
<HomeCommunityGrid />
```

---

# Feature 模块（Feature Modules）

一个 feature 模块拥有一个业务域。

示例：

```text
features/competition/
```

可以包含：

```text
api
components
composables
types
schemas
```

feature 不导入页面组件。

跨 feature 导入应不常见。

跨域共享功能属于 `shared`。

---

# 共享层（Shared Layer）

`shared` 用于真正的跨 feature 基础能力。

示例：

```text
AppHeader
AppFooter
SectionHeader
StatusBadge
EmptyState
ErrorState
http client
date utilities
```

不要因为两个页面恰好用到，就把业务特定组件放进 `shared`。

---

# Barrel 导出（Barrel Exports）

feature 级 `index.ts` 允许用于刻意的公共 API。

不要为每个目录创建 barrel。

避免隐藏的循环导入。

---

# Composable 规则（Composable Rules）

用 composables 承载可复用的 Vue 逻辑。

好的候选：

```text
useCompetitionList
useCountdown
useBreakpoint
useCurrentUser
usePermissionContext
```

composable 不应变成无结构的服务容器。

保持：

- IO 在 API 模块
- 渲染在组件
- 路由编排在页面
- 可复用的响应式逻辑在 composables

---

# 依赖方向（Dependency Direction）

首选依赖方向：

```text
pages
  -> features
      -> shared
```

layouts 可以使用：

```text
features/auth
shared
stores
```

shared 不得依赖业务 feature。

避免：

```text
shared -> competition
competition -> organization -> competition
```

循环业务依赖应被重新设计。

---

# 设计系统 Source of Truth

阅读：

```text
docs/frontend/FrontendDesign.md
```

设计文档对以下内容有权威：

- 颜色
- 图标
- 间距
- 圆角
- 排版
- 组件选择
- 交互模式
- 动效
- 响应式行为

架构不覆盖设计规则。

---

# 设计 Token（Design Tokens）

Token 应放在集中式主题配置与全局 CSS 中。

推荐位置：

```text
src/shared/styles/main.css
src/shared/styles/tokens.css
```

Nuxt UI 主题配置应集中。

页面不得定义自己的独立主题。

暗色模式（dark mode）的架构落点：

- 使用 Nuxt UI 的 Color Mode 集成，在 `<html>` 上切换 `dark` / `light` class；底层能力与具体安装方式以当前 Nuxt UI plain Vue / Vite 文档和已安装版本为准
- 暗色 token 映射在 `.dark` scope 中重新声明同一组 CSS custom properties（与 FrontendDesign.md §7.4 的映射表一致）
- 语义色角色（primary、neutral、success 等）在 `app.config.ts`（`ui.colors`）集中映射
- 页面组件不实现任何暗色样式，只消费 token
- 主题切换 UI 优先使用 Nuxt UI `UColorModeButton` / `UColorModeSelect` / `UColorModeSwitch` 中适合当前场景的组件
- 新增 token 必须在亮色与暗色两种模式下通过 WCAG AA 对比度验证

---

# UI 组件选择规则（UI Component Selection Rule）

构建 UI 基础组件前：

1. 查看 Nuxt UI 文档
2. 适用时使用现有 Nuxt UI 组件
3. 围绕它组合业务组件
4. 仅当 Nuxt UI 无法表达所需行为时才创建自定义基础组件

不要从零重造：

```text
Button
Modal
Drawer
Toast
Dropdown
Tooltip
Table
Pagination
Form controls
Carousel
Command Palette
```

---

# Mock-First 开发（Mock-First Development）

在 Django API 集成之前，前端使用类型化 fixtures。

结构：

```text
src/mocks/fixtures/competitions.ts
src/mocks/fixtures/teams.ts
src/mocks/fixtures/organizations.ts
src/mocks/fixtures/activities.ts
```

Fixtures 必须符合领域类型。

不要把 150 行 mock 数据放进页面组件。

Mock 数据是开发脚手架，不是生产事实。

---

# 环境变量（Environment Variables）

所有公开前端环境变量使用：

```text
VITE_
```

示例：

```text
VITE_API_BASE_URL=/api
```

提交：

```text
.env.example
```

不要提交真实密钥。

前端环境变量在构建时是公开的。

绝不要把以下内容放进 Vite 环境文件：

- 密码
- API 私钥
- Django secret
- 数据库凭据

---

# 生产 API 路由（Production API Routing）

首选生产形态：

```text
https://platform.example.edu/
https://platform.example.edu/api/*
```

同源（same origin）。

Nginx：

```text
/        -> frontend dist
/api/    -> Django
```

收益：

- 更简单的认证
- 无生产 CORS 需求
- CSRF 更简单
- 部署更简单
- 配置错误更少

开发环境 Vite 可以代理：

```text
/api -> localhost:8000
```

---

# SPA Fallback

Nginx 必须支持 Vue Router history mode。

概念上：

```text
try file
else index.html
```

否则直接导航到：

```text
/competitions/123
```

会返回服务器 404。

---

# 前端性能策略（Frontend Performance Strategy）

2C2G 服务器约束强化了静态部署。

前端规则：

- 路由级懒加载
- 懒加载首屏以下媒体
- 优化 WebP / AVIF 资源
- 显式图片尺寸
- 无第二套 UI 库
- V0.1 里程碑中无重型动画依赖
- 长列表分页
- 控制首页 API 请求数量
- 不为摘要卡片获取详细记录
- 对带 hash 的资源使用浏览器缓存

目标用户体验：

- 在普通 Android 手机上流畅响应
- 在 iOS Safari、Android Chrome 与微信内置浏览器中完成核心学生流程
- 在校园 Wi-Fi 与移动网络下可用
- 媒体加载不产生可见布局位移
- 无巨型初始图片载荷

---

# 路由懒加载（Route Lazy Loading）

业务页面应懒加载。

概念：

```ts
component: () => import('@/pages/competitions/CompetitionListPage.vue')
```

全局 shell 可以急切加载。

---

# 无障碍架构（Accessibility Architecture）

无障碍是架构的一部分，不是最后的打磨工序。

必需：

- 语义化页面 landmark
- 键盘导航
- 可见焦点
- 需要时的路由切换焦点管理
- modal 焦点管理
- 纯图标按钮的 aria-label
- reduced-motion 支持
- 正确的表单 label
- 仅在必要时使用 live region

Nuxt UI 提供可访问的基础组件，但不会自动让业务组合可访问。

暗色模式的无障碍：

- 暗色 token 集合同样满足 WCAG AA 对比度（FrontendDesign.md §7.4）
- 焦点环、状态色与键盘行为在两种模式下一致验证

---

# 加载、空与错误状态（Loading, Empty and Error States）

每个数据驱动页面必须定义：

```text
loading
success
empty
error
```

不要只实现快乐路径。

共享组件：

```text
AppSkeleton
EmptyState
ErrorState
```

在需要的地方使用 feature 特定骨架布局。

---

# 权限架构（Permission Architecture）

前端权限上下文用于 UX。

示例问题：

```text
用户能看到管理按钮吗？
用户能打开这个组织管理路由吗？
用户能看到运营导航吗？
```

后端权限始终是权威。

初始概念类型：

```ts
type PlatformRole = 'student' | 'operator' | 'superadmin'

type OrganizationRole = 'member' | 'leader'
```

一个用户可以有多个组织成员关系。

组织身份由 session API 提供，仅用于 `/organizations` 中“我的组织”区块和 LEADER 管理入口的 UX。后端仍必须在每个 `/api/manage/organizations/{organizationId}/…` 请求上验证具体组织作用域；前端不能从“看到进入管理按钮”推导出授权。

不要把以下内容扁平化为全局应用角色：

```text
AI协会会长
科创部部长
```

领域语义见 PRD / 权限设计。

---

# 测试策略（Testing Strategy）

V0.1 测试栈：

```text
Vitest
Vue Test Utils
```

应用 shell 稳定后，为高价值浏览器流程添加 Playwright。

优先单元测试：

- 日期 / 倒计时工具
- 权限辅助函数
- 数据映射器
- 表单 schema
- 非平凡 composables

优先组件测试：

- 有状态的业务组件
- 表单
- 依赖权限的 UI
- empty / error 处理

不要对每个静态卡片做 snapshot 测试。

---

# 端到端测试优先级（End-to-End Test Priority）

初始 E2E 流程：

```text
homepage navigation
competition browse
team application mock flow
organization recruitment mock flow
activity registration mock flow
mobile navigation
global search
```

E2E 应测试用户结果，而不是内部实现细节。

---

# 代码质量（Code Quality）

必需脚本收敛为：

```text
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm check
```

`pnpm check` 应聚合 merge 前必需的非破坏性验证。

建议：

```text
lint
typecheck
unit tests
build
```

如果浏览器运行时开销大，E2E 可以单独执行。

---

# TypeScript 规则（TypeScript Rules）

开启严格 TypeScript。

不要把 `any` 当作逃生出口。

优先：

```text
unknown
narrowing
泛型（generic types）
显式领域接口（explicit domain interfaces）
```

如果 `any` 不可避免，在本地说明原因。

避免宽泛类型断言：

```ts
as SomeHugeType
```

当可以通过校验或 narrowing 时。

---

# ESLint 与格式化（ESLint and Formatting）

使用当前 Vue / TypeScript 兼容的 ESLint flat 配置。

不要引发大规模样式规则争论。

目标是：

- 捕获 bug
- 强制导入与 Vue 正确性
- 保持格式一致

格式化可以由选定的 formatter 配置处理。

项目不应需要人工审查空白符。

---

# 导入别名（Import Alias）

使用：

```text
@ -> src
```

避免复杂别名。

可能示例：

```ts
import { api } from '@/shared/api/http'
```

不要为每个文件夹添加别名。

---

# 命名（Naming）

Vue 组件文件：

```text
PascalCase.vue
```

Composables：

```text
useSomething.ts
```

Stores：

```text
something.ts
```

API 模块：

```text
competition.api.ts
```

Schemas：

```text
competition.schema.ts
```

Types：

```text
competition.ts
competition.api.ts
```

Tests：

```text
*.spec.ts
```

---

# 表单架构（Form Architecture）

表单拥有：

```text
schema
initial values
submit handler
API module
字段级错误映射（field-level error mapping）
```

不要把所有内容塞进一个巨型页面组件。

一致使用 Nuxt UI 表单。

运行时 schema 可以复用于前端校验。

---

# 通知架构（Notification Architecture）

V0.1 通知是普通服务端记录。

不需要 WebSocket。

客户端行为：

```text
fetch unread count
show badge
load list on demand
mark read
```

`notifications` 是按用户定向的 Header 小铃铛与 `/notifications` 数据源。公开 Announcement 由校园动态 feature 读取，默认不写入 notification store；活动取消、提醒和申请状态等服务端流程可以提供指向活动或公告详情的 `action_path`。

实时传输不是初始前端架构的一部分。

---

# 搜索架构（Search Architecture）

全局搜索从以下位置打开：

```text
header search
Ctrl/Cmd + K
```

UI：

```text
UModal
UCommandPalette
```

初始实现可以搜索 mock fixtures。

后续：

```text
GET /api/search?q=
```

搜索是单一产品 feature，不是每个页面重复的独立搜索逻辑。

---

# 轮播架构（Carousel Architecture）

使用：

```text
UCarousel
```

不要手写生产级轮播。

当前 HTML demo 轮播只是视觉原型。

生产实现必须：

- 使用 Nuxt UI carousel
- 支持触摸
- 支持键盘
- 尊重 reduced motion
- 在适当时暂停自动播放
- 使用优化图片

---

# 仅开发的设计系统页面（Development-Only Design System Page）

创建：

```text
/dev/design-system
```

只在开发构建中启用。

应展示：

- 颜色
- 排版
- 按钮
- badges
- inputs
- selects
- modal
- toast
- empty state
- skeleton
- 图标规则
- 通用业务组件

该页面是 `FrontendDesign.md` 的活体实现伴侣。

不要在正常生产导航中暴露它。

---

# 架构决策记录（Architecture Decision Records）

当重大架构选择变化时，添加：

```text
docs/adr/
```

示例：

```text
0001-use-vue-vite-spa.md
0002-use-nuxt-ui.md
0003-use-cookie-session-auth.md
```

ADR 只用于未来维护者可能合理质疑的决策。

不要为每个组件写 ADR。

---

# 安全边界（Security Boundaries）

前端从不假设隐藏 UI 等于安全。

规则：

- 权限由 Django 强制执行
- 不暴露密钥
- 安全渲染用户生成内容
- 除非经过消毒与评审，避免 `v-html`
- 外部链接使用安全 target 行为
- 上传由服务端校验
- 认证写操作开始时集成 CSRF
- 后端校验保持权威

---

# 未来分发兼容性（Future Distribution Compatibility）

V0.1 仍然是：

```text
Responsive Vue Web SPA
```

## Capacitor

未来如需要 Android APK / AAB 或 iOS 包装，可通过独立 ADR 和任务引入 Capacitor。

当前架构保持 wrapper-friendly：

- 业务页面不依赖 hover
- API 层集中
- 认证、分享、文件等平台敏感能力未来可通过 adapter 隔离
- 不在普通页面散布 native 判断

V0.1 不安装 Capacitor，也不生成 `android/` / `ios/` 项目。

## 微信小程序

真正的微信小程序视为独立前端 surface。

Web 项目未来可与 Mini Program 共享：

```text
API contract
业务状态枚举
验证语义
文案
部分 TypeScript contract
```

但不假设 Nuxt UI / DOM 组件可直接复用。

V0.1 不引入：

```text
uni-app
Taro
微信小程序 SDK
WebView bridge
```

除非出现明确的小程序交付任务。


---

# 暂不添加（Do Not Add Yet）

初始架构明确排除：

```text
SSR
Nuxt Framework
micro-frontends
GraphQL
WebSocket
service worker / PWA
internationalization framework（产品语言固定为简体中文，见 FrontendDesign.md §0.1，V0.1 无需 i18n 框架）
TanStack Query
Axios
Motion / GSAP
Storybook
第二套 UI 库
```

以上可以通过显式架构决策在后续重新考虑。

这不是在说它们是坏工具。

它们只是当前不需要。

---

# 文档归属（Documentation Ownership）

前端 source of truth 是：

```text
docs/product/PRD.md
docs/product/PageMap.md
docs/frontend/FrontendDesign.md
docs/frontend/FrontendArchitecture.md
docs/frontend/FrontendImplementationPlan.md
AGENTS.md
```

当架构变化时，在同一次变更中更新相关文档。

代码与文档不得有意分叉。

外部参考链接应尽量精确到实际文件（例如 `SKILL.md`），避免只引用不可判定内容的仓库目录。

仓库文档使用简体中文书写，专业术语保留英文（见 AGENTS.md 文档语言章节）。

---

# Source-of-Truth 优先级（Source-of-Truth Priority）

当指令冲突时，使用此优先级：

```text
1. 当前明确的任务需求
2. AGENTS.md
3. FrontendDesign.md（视觉 / 交互决策）
4. FrontendArchitecture.md（工程决策）
5. FrontendImplementationPlan.md（顺序与任务范围）
6. PRD / PageMap（产品行为）
7. HTML demo 与生成的参考图
```

视觉原型绝不覆盖更新的硬设计规则。

示例：

```text
原型包含 emoji
FrontendDesign.md 禁止 emoji
=> 使用已批准的 SVG 图标系统
```

---

# 架构完成定义（Definition of Architectural Completion）

当以下条件满足时，前端基础在架构上就绪：

- Vue + Vite + TypeScript 可运行
- Nuxt UI 已为 Vue 配置
- Tailwind / Nuxt UI 样式正常加载
- Vue Router 可用
- Pinia 可用
- strict typecheck 通过
- lint 通过
- 生产构建通过
- `src` 遵循架构边界
- 存在开发设计系统页面
- 存在公开应用 shell
- 移动端导航可用
- 不存在第二套 UI 库
- 渲染第一个 UI 里程碑不需要后端集成

此时项目可以从基础工作进入 feature 实现。
