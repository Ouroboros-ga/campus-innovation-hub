# FrontendImplementationPlan.md

> Project: campus-innovation-hub  
> Version: 0.3  
> Status: FE-001–FE-011 已完成并提交；当前执行 FE-012（全局搜索外壳）  
> Execution model: One task at a time（一次只执行一个任务）  
> Primary executor: Human developer or Codex-style coding agent  
> Locale: 简体中文（zh-CN）— 所有产品 UI 文案遵循 FrontendDesign.md §0.1

---

# 目的（Purpose）

本文档把前端架构转化为一系列小而可验证的实现任务。

它刻意不是：

```text
"把整个前端都建出来。"
```

每个任务都有：

- 一个清晰目标
- 依赖
- 范围
- 明确的非目标（non-goals）
- 验收标准
- 验证
- 停止条件

Coding agent 不得自动继续执行下一个任务。

---

# 事实来源（Sources of Truth）

所有前端任务必须遵循：

```text
AGENTS.md
docs/frontend/FrontendDesign.md
docs/frontend/FrontendArchitecture.md
docs/product/PRD.md
docs/product/PageMap.md
docs/backend/database-design.md（涉及领域字段、枚举、fixture 或状态语义时）
```

原型文件与截图只是视觉参考。

当原型与更新的硬规则冲突时，硬规则获胜。

---

# 通用任务规则（General Task Rules）

每个任务遵循此生命周期：

```text
Read
-> Inspect
-> Plan locally
-> Implement
-> Run
-> Verify
-> Report
-> Stop
```

没有验证的任务不得声称完成。

UI 变更中，仅代码编译成功是不够的。

---

# 当前执行进度（2026-08-25）

| 任务 | 状态 | 已验证证据 | 后续动作 |
| --- | --- | --- | --- |
| FE-001 初始化 Vue 前端基础 | 已完成并提交 | Vue / Vite / TypeScript / Nuxt UI 基线、路由与质量门已建立 | 无 |
| FE-002 Theme Tokens | 已完成并提交 | 亮暗 token、Nuxt UI 语义映射、44px 触控目标与 hover 色阶已验证 | 无 |
| FE-003 开发设计系统页面 | 已完成并提交 | 开发路由、生产剔除测试、组件活体参考与亮暗视觉验证已完成 | 无 |
| FE-004 应用外壳 | 已完成并提交 | 公开路由、Desktop Header、移动 Drawer、Footer、19 项测试与 `pnpm check` 通过；1440px 桌面与 390px 移动真实窄视口视觉验证通过；首页外壳与参考图对齐 | 无 |
| FE-005 首页领域类型与 Fixtures | 已完成并提交 | 首页 9 类领域 View Model、首页 fixtures、共享日期/截止工具与 25 项单测通过；lint / typecheck / test / build 通过 | 无 |
| FE-006 首页 Hero 与快捷入口 | 已完成并提交 | HomeHero 主信息、QuickEntry 四快捷入口、Hero 外壳与移动端 2x2 实现；组件/路由测试通过；1440/768/500px 视觉验证无横向溢出；`pnpm check` 全绿（47/47 测试、含生产路由集成测试） | 精确 390px 截图受 Chrome 最小窗口宽度（500px）限制；窄视口 2x2 已由 500px 截图验证 |
| FE-007 首页轮播 | 已完成并提交 | HomeCarousel（UCarousel，3 张幻灯片、箭头、分页点、自动播放、悬停暂停、触摸/键盘、reduced-motion 关闭自动播放）；统一 16:9 画框 + `object-fit: cover` + 可选 `object-position` 焦点；`pnpm check` 全绿（50/50 测试、含生产路由集成测试）；同步更新 FrontendDesign §19 / database-design §25 | 详情路由（CTA 目标）属 FE-020+；真实校园图片未接入，暂以深色占位 |
| FE-008 首页截止时间区块 | 已完成并提交 | 共享领域标签工具 `domain-labels.ts` 与紧凑日期 `formatCompactDate`；DeadlineText / DeadlineItem / DeadlineGrid；剩余时间由日期派生，紧急用文字 + 语义色（不只靠颜色）；单元测试覆盖未来 / 临近 / 已截止；`pnpm check` 全绿（62/62 测试、含生产路由集成测试） | 无 |
| FE-009 首页竞赛区块 | 已完成并提交 | CompetitionCard / HomeCompetitionSection；默认封面受控模板（名称 + 分类处理 + 低调几何，不生成随机 AI 图）；最多 3 个徽标（级别 + 参赛形式 + 状态）；官网外链用 external-link 图标；单元测试覆盖状态派生与徽标上限；`pnpm check` 全绿 | 详情路由（卡片详情 / 官网）属 FE-020+；真实竞赛封面未接入，暂以受控默认封面 |
| FE-010 首页信息栏 | 已完成并提交 | AnnouncementList / GuideList（列表而非卡片，单条底边分隔）；指南不显示虚构浏览量，只展示标题 / 类型 / 更新日期；单元测试覆盖列表结构；`pnpm check` 全绿 | 无 |
| FE-011 首页社区区块 | 已完成并提交 | TeamRecruitmentList / OrganizationRecruitmentList / ActivityList / FaqList（均为紧凑列表而非卡片墙，单条底边分隔）；主栏三列社区 + 右侧栏常见问题；组队/组织/活动的招募与报名状态由日期或人数派生；不展示点赞 / 热度 / 回答数等虚构指标；`pnpm check` 全绿（67/67 测试、含生产路由集成测试） | 详情路由（组队 / 招新 / 活动 / Q&A）属对应 FE-0xx；真实 logo / 封面未接入，暂以图标占位 |

FE-001 至 FE-003 已作为提交 `2e6ab93` 推送至 `origin/main`；FE-004 已作为提交 `c3dea20` 推送；FE-005 已作为提交 `f7029da` 推送；FE-006 已作为提交 `4a4ba4d` 推送；FE-007 已作为提交 `766e3c9` 推送；FE-008 / FE-009 / FE-010 已作为提交 `c1cc9ed` 推送；FE-011 将作为后续提交推送。

---

# 阶段图（Phase Map）

```text
Phase F0  Repository & Frontend Foundation（仓库与前端基础）
Phase F1  Design System Foundation（设计系统基础）
Phase F2  Application Shell（应用外壳）
Phase F3  Homepage（首页）
Phase F4  Competition Experience（竞赛体验）
Phase F5  Team Plaza（组队广场）
Phase F6  Organizations & Recruitment（组织与招新）
Phase F7  Activities（活动）
Phase F8  Q&A / Guides（咨询与指南）
Phase F9  Account Experience（账号体验）
Phase F10 Organization Management（组织管理）
Phase F11 Platform Operations（平台运营）
Phase F12 API Integration（API 集成）
Phase F13 Hardening & Release Readiness（加固与发布就绪）
```

后端集成前当前推荐的停止点：

```text
F8 或更早（如果产品设计仍在变化）
```

---

# 里程碑 M0：文档门禁（Documentation Gate）

状态：

```text
planned / document phase（规划中 / 文档阶段）
```

必需文件：

```text
AGENTS.md
docs/frontend/FrontendDesign.md
docs/frontend/FrontendArchitecture.md
docs/frontend/FrontendImplementationPlan.md
```

验收：

- 架构与设计互不矛盾
- 当前技术栈明确
- 任务边界明确
- Codex 可以在不臆造架构的情况下执行 FE-001

---

# FE-001：初始化 Vue 前端基础

## 目标（Goal）

在以下位置创建真实前端应用：

```text
frontend/
```

使用已批准的技术栈。

## 先读（Read First）

```text
AGENTS.md
docs/frontend/FrontendArchitecture.md
docs/frontend/FrontendDesign.md
```

## 范围（Scope）

创建并配置：

```text
Vue 3
Vite
TypeScript
pnpm
Nuxt UI v4
Tailwind CSS v4
Vue Router
Pinia
ESLint
Vitest baseline
```

创建最小文件：

```text
App.vue
main.ts
router
home placeholder route
global stylesheet
```

创建脚本：

```text
dev
build
lint
typecheck
test
check
```

## 推荐脚手架方向

优先使用官方当前的 Vue / Vite 配置与 Nuxt UI v4 的 Vue 集成。

不要使用已归档的旧 Nuxt UI v3 starter。

使用当前的 Nuxt UI 文档 / 仓库指引。

## 范围内（In Scope）

- package 配置
- TypeScript strict 模式
- Vite alias `@ -> src`
- Nuxt UI Vite plugin
- Nuxt UI Vue plugin
- Tailwind / Nuxt UI CSS 导入
- Vue Router
- Pinia
- 干净的占位首页
- `.env.example`
- `.gitignore`
- 基线测试配置

## 范围外（Out of Scope）

不要实现：

- 最终 header
- 首页设计
- mock 竞赛卡片
- API 调用
- 认证
- Django 集成
- 运营页面
- 自定义动画系统

## 验收标准（Acceptance Criteria）

```text
frontend/ 存在
pnpm install 成功
pnpm dev 启动应用
home route 渲染
Nuxt UI 组件正确渲染
Pinia 已安装并注册
Vue Router history mode 可用
TypeScript strict 已启用
未安装第二套 UI 库
```

验证：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
```

## 停止条件（Stop Condition）

验证成功后：

- 报告变更文件
- 报告运行的命令
- 报告已安装版本
- 停止

不要开始 FE-002。

---

# FE-002：建立主题与设计 Token

## 目标（Goal）

把 `FrontendDesign.md` 转化为真实的前端主题基础。

## 依赖（Depends On）

```text
FE-001
```

## 范围（Scope）

实现：

- primary color（主色）
- semantic colors（语义色）
- neutral surfaces（中性表面）
- text colors（文字色）
- border colors（边框色）
- radius scale（圆角）
- spacing conventions（间距约定）
- focus ring（焦点环）
- typography baseline（排版基线）
- page container behavior（页面容器行为）
- dark mode token 映射（FrontendDesign.md §7.4，含 `.dark` scope）

使用 Nuxt UI 主题定制与集中 CSS。

## 创建（Create）

建议：

```text
src/shared/styles/main.css
src/shared/styles/tokens.css
```

如果初始化后的应用结构等价，确切位置可以跟随。

## 要求（Requirements）

- 无页面级主题
- 无重复硬编码蓝色定义
- 焦点状态可见
- 正文与标题遵循设计文档
- 默认 canvas 与 surface 颜色正确
- 存在 reduced-motion 基线
- 亮色与暗色 token 都从共享主题派生（暗色映射遵循 FrontendDesign.md §7.4）

## 范围外（Out of Scope）

- 业务组件
- 首页布局
- 真实 logo
- 响应式导航
- API

## 验收标准（Acceptance Criteria）

最小路由演示：

```text
body background
surface
text hierarchy
button
link
focus
badge
input
```

全部从共享设计系统派生。

验证：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

视觉验证：

```text
desktop
mobile
keyboard focus
dark mode（通过 UColorModeButton 或 devtools 切换，检查 token 映射）
```

FE-002 后停止。

---

# FE-003：开发设计系统页面

## 目标（Goal）

为已实现的设计系统创建活体视觉参考。

## 依赖（Depends On）

```text
FE-002
```

## 路由（Route）

仅开发环境：

```text
/dev/design-system
```

生产导航不得链接到它。

## 展示（Show）

- typography scale
- color tokens（亮色与暗色）
- buttons
- badges
- inputs
- select
- textarea
- checkbox / radio
- avatar
- modal
- drawer
- toast
- tooltip
- skeleton
- empty state
- icon examples
- focus states

## 图标要求（Icon Requirement）

使用：

```text
UIcon
Lucide names
```

无 emoji。

无手绘通用 SVG 图标。

## 验收标准（Acceptance Criteria）

该页面让开发者能视觉回答：

```text
我们的主按钮长什么样？
warning badge 长什么样？
我们使用哪个图标家族？
正常字段高度是多少？
焦点长什么样？
暗色模式下这些表现如何？
```

验证：

```bash
pnpm lint
pnpm typecheck
pnpm build
```

视觉验证：

```text
1440 desktop
768-ish tablet
390-ish mobile
dark mode 下检查 color tokens 与组件
```

FE-003 后停止。

---

# FE-004：应用外壳（Application Shell）

## 目标（Goal）

实现 Desktop / Tablet / Phone 共用的响应式应用外壳。

## 依赖（Depends On）

```text
FE-003
```

## 实现（Implement）

```text
AppHeader
AppLogo
DesktopNavigation
TabletNavigationDrawer
MobileBottomNav
MobilePageHeader
MobileActionBar
SearchButton
NotificationButton
UserMenu placeholder
AppFooter
PublicLayout
PageContainer
```

## Desktop

```text
>= 1024px
```

要求：

- 64–68px Header
- 顶部一级导航
- active route indicator
- 搜索
- 通知
- 头像

## Tablet

```text
768–1023px
```

要求：

- Compact Header
- `UDrawer` 一级导航
- 不显示 Phone Bottom Navigation

## Phone

```text
< 768px
```

### Root Tab Shell

Bottom Navigation 固定五项：

```text
首页
竞赛
组队
活动
我的
```

路由：

```text
/
/competitions
/teams
/activities
/me
```

### Detail Shell

```text
Back Header
Content
MobileActionBar(optional)
```

不显示 Bottom Navigation。

### Form / Task Shell

```text
Back Header
Focused Task
Sticky Submit(optional)
```

不显示 Bottom Navigation。

## Route Meta

引入：

```ts
mobileShell: 'tab' | 'detail' | 'form' | 'manage'
mobileTab?: 'home' | 'competitions' | 'teams' | 'activities' | 'me'
```

不得建立 `/mobile/*` 重复路由。

## Safe Area

配置：

```text
viewport-fit=cover
env(safe-area-inset-bottom)
100dvh when genuinely needed
```

## 使用（Use）

优先 Nuxt UI：

```text
UButton
UIcon
UAvatar
UDropdownMenu
UDrawer
```

## 范围外（Out of Scope）

- 真实认证
- 通知 API
- 全局搜索结果
- 业务页面内容
- Capacitor
- APK
- uni-app
- 微信小程序
- PWA

## 验收标准（Acceptance Criteria）

- Desktop 顶部导航可用
- Tablet Drawer 可用
- Phone 五项 Bottom Navigation 可用
- active tab 正确
- Detail / Form Shell 隐藏全局 Bottom Navigation
- Safe Area 不遮挡内容
- Back behavior 正确
- 360 / 390 / 430px 无横向溢出
- 768 / 1024 边界切换稳定
- 焦点状态可见
- Touch target >= 44 x 44 CSS px
- 无 emoji 产品图标
- 无 core action 依赖 hover

验证：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

视觉验证：

```text
360
390
430
768
1024
1440
```

FE-004 后停止。

---

# FE-004M：既有前端的 Mobile Web 适配任务

> 如果 FE-004 已经在代码中完成但仍采用“Mobile Drawer + Desktop Layout Shrink”方案，则执行本任务。  
> 如果 FE-004 尚未实现，则把本节验收要求直接合并进 FE-004，不重复实现两次。

## 目标

把既有 Web Shell 调整为最新版 `FrontendDesign.md` 的 Phone / Tablet / Desktop 导航模型。

## 必须修改

```text
Phone Bottom Navigation
Phone Root / Detail / Form Shell
Tablet Drawer
Mobile Safe Area
Mobile Header
Sticky Action infrastructure
```

## 禁止

- 不重写业务 API
- 不引入 Capacitor
- 不引入 uni-app
- 不创建 phone-only duplicate routes
- 不改变 Desktop 已批准视觉方向
- 不启动后续业务页面重构

## 验收

同 FE-004 Mobile 验收。

完成后停止。

---

# FE-005：定义首页领域类型与 Fixtures

> 字段、枚举和持久化语义必须对照 `docs/backend/database-design.md`；不要把手机端 display state 建成新的数据库字段。

## 目标（Goal）

在构建首页业务 UI 之前，定义首页所需的类型化前端数据。

## 依赖（Depends On）

```text
FE-004
```

## 为以下内容创建类型（Create Types For）

首页摘要：

```text
CompetitionSummary
DeadlineItem
TeamRecruitmentSummary
OrganizationRecruitmentSummary
ActivitySummary
AnnouncementSummary
GuideSummary
FaqSummary
CarouselSlide
```

## Fixture 位置

```text
src/mocks/fixtures/
```

## 规则（Rules）

- 无虚假官方统计
- 真实但明确是开发 fixtures
- 无巨型数据数组
- 日期内部使用 ISO 值
- 可推导的 UI 格式化字符串不存储

错误示例：

```ts
remainingText: '还有 3 天'
```

更好：

```ts
deadline: '2026-09-01T23:59:59+08:00'
```

并计算显示状态。

## 同时创建（Also Create）

需要时创建共享日期 / 截止时间工具。

为非平凡截止时间逻辑添加单元测试。

## 范围外（Out of Scope）

- 首页布局
- API
- Pinia 领域 store

## 验收标准（Acceptance Criteria）

- fixtures 通过 typecheck
- 倒计时逻辑已测试
- 页面组件将不需要硬编码数据数组

FE-005 后停止。

---

# FE-006：首页 Hero 与快捷入口

## 目标（Goal）

按照已批准的设计方向实现首页顶部区域。

## 依赖（Depends On）

```text
FE-005
```

## 实现（Implement）

```text
HomeHero
QuickEntry
```

快捷入口：

```text
找竞赛
找队友
找组织
找活动
```

## 设计要求（Design Requirements）

遵循 `FrontendDesign.md`。

特别是：

- 无 emoji
- Lucide SVG 图标
- 克制的边框与圆角
- 无紫色渐变 hero
- 无虚假 KPI 指标
- 文案保持事实性
- 移动端 2x2 快捷入口
- 简体中文文案（§0.1 / §43）

## Phone Requirements

- Hero 主标题 24–28px
- Hero copy 明显短于 Desktop
- Quick Entry 2 x 2
- 首屏应快速暴露 Quick Entry
- 不复制 Desktop split hero
- 无 Hover-only behavior

## 范围外（Out of Scope）

- 轮播
- 截止时间区块
- 竞赛区块

## 验收标准（Acceptance Criteria）

视觉层级匹配已批准的首页方向。

桌面端与移动端都可用。

FE-006 后停止。

---

# FE-007：首页轮播

## 目标（Goal）

用生产组件替换原型轮播。

## 依赖（Depends On）

```text
FE-006
```

## 实现（Implement）

```text
HomeCarousel
```

使用：

```text
UCarousel
```

不要保留手写原型轮播 JavaScript。

## 必需行为（Required Behavior）

- 3 个 mock slides
- 箭头控制
- 分页指示
- 触摸滑动
- 键盘支持
- 自动播放 5 到 6 秒
- 悬停暂停
- reduced motion 禁用自动播放
- 图片尺寸预留

## 内容类型（Content Types）

幻灯片代表：

```text
campus innovation season（校园科创季）
competition topic（竞赛专题）
organization recruitment season（组织招新季）
```

## 无障碍（Accessibility）

- 图片 alt
- 有 label 的控制
- 当前 slide 可理解
- reduced motion

## 验收标准（Acceptance Criteria）

无控制台错误。

在以下环境可用：

```text
desktop
mobile
可用时的触摸模拟
```

FE-007 后停止。

---

# FE-008：首页截止时间区块

## 目标（Goal）

实现高优先级截止时间摘要。

## 依赖（Depends On）

```text
FE-005
```

## 实现（Implement）

```text
DeadlineGrid
DeadlineItem
DeadlineText
```

展示：

```text
type
title
remaining time
deadline date
```

## 规则（Rules）

- 剩余时间由日期计算
- 紧急状态用文字 + 颜色，不只靠颜色
- 无装饰性状态圆点
- 移动端保持截止时间可见

为以下情况添加测试：

```text
future（未来）
near deadline（临近截止）
expired（已截止）
```

FE-008 后停止。

---

# FE-009：首页竞赛区块

## 目标（Goal）

实现首页使用的竞赛发现卡片。

## 依赖（Depends On）

```text
FE-005
FE-003
```

## 实现（Implement）

```text
CompetitionCard
HomeCompetitionSection
```

## 卡片信息（Card Information）

```text
cover
name
level
format
status
deadline
official site or detail action
```

最大可见 badges：

```text
3
```

## 要求（Requirements）

- 无随机 AI 生成卡片图片
- 默认封面系统一致
- 外链使用 SVG external-link 图标
- 图片宽高比预留

FE-009 后停止。

---

# FE-010：首页信息栏

## 目标（Goal）

实现公告与指南的紧凑列表。

## 实现（Implement）

```text
AnnouncementList
GuideList
```

## 重要设计规则

这些是列表。

不要把每一行都变成独立卡片。

需要图标时使用 SVG 图标。

FE-010 后停止。

---

# FE-011：首页社区区块

## 目标（Goal）

实现：

```text
TeamRecruitmentList
OrganizationRecruitmentList
ActivityList
FaqList
```

## 设计（Design）

优先紧凑结构化列表，而不是四堵大卡片墙。

每个区块有：

```text
section title
view all
2 到 4 个摘要项
```

## 范围外（Out of Scope）

- 详情页
- 申请表单

FE-011 后停止。

---

# FE-012：全局搜索外壳

## 目标（Goal）

使用 mock 数据实现全站搜索交互。

## 触发（Trigger）

```text
header search button
Ctrl + K
Cmd + K
```

## 使用（Use）

```text
UModal
UCommandPalette
```

## 搜索分类（Search Categories）

```text
competitions
organizations
team posts
activities
FAQ
guides
announcements
```

## 要求（Requirements）

- 键盘导航
- escape 关闭
- 焦点处理正确
- 紧凑结果行
- 无卡片墙
- 显示结果类型

FE-012 后停止。

---

# FE-013：首页集成与视觉门禁

## 目标（Goal）

组装所有首页区块并进行第一次正式设计评审。

## 依赖（Depends On）

```text
FE-006 through FE-012
```

## 对照评审（Review Against）

```text
FrontendDesign.md
已批准的参考图
仅用于构图的已批准 HTML 原型
```

## 必需评审（Required Review）

桌面端：

```text
1440-ish
```

移动端：

```text
390-ish
```

平板：

```text
768-ish
```

暗色模式：

```text
首页全部区块在 dark mode 下检查（§7.4 token 映射）
```

检查：

- 层级
- 间距
- 图标一致性
- 无 emoji
- 无通用 AI 模式
- 截止时间可读性
- 轮播
- 导航
- 搜索
- 焦点
- 溢出
- 控制台
- 简体中文文案（全角标点、日期格式，§0.1 / §43）
- 暗色模式表现

## 输出（Output）

创建简短评审记录：

```text
docs/frontend/reviews/homepage-v1.md
```

对结论分类：

```text
Blocking
Major
Minor
```

在完成任务前修复 blocking 问题。

FE-013 后停止。

---

# 里程碑 M1

M1 在以下条件满足时完成：

- 真实 Vue 前端存在
- 设计系统已实现（含暗色模式）
- 应用外壳存在
- 首页存在
- 首页响应式
- 全局搜索 mock 可用
- lint / typecheck / tests / build 通过
- 首页设计评审无 blocking 问题

在 M1 时，不要自动开始后端集成。

先评审产品方向。

---

# FE-020：竞赛列表页

## 目标（Goal）

使用 fixture 数据构建竞赛发现。

## 必需 UX

- 搜索
- 状态筛选
- 分类筛选
- 有用的格式筛选
- 分页
- URL 承载的筛选状态
- empty state
- loading skeleton
- 开发用 error fixture 状态

使用现有 CompetitionCard / 列表变体。

FE-020 后停止。

---

# FE-021：竞赛详情页

## 必需区块（Required Sections）

```text
title and status
deadline
basic information
competition introduction
who should join
timeline
official links
related guides
team recruitment preview
```

主任务必须保持明显。

不要用卡片容器重载页面。

适用时使用：

```text
UTimeline
```

FE-021 后停止。

---

# FE-030：组队广场列表

构建：

- 组队招人列表
- 按竞赛筛选
- 招募中 / 已关闭状态
- "找队伍" vs "队伍招人"
- 分页
- 创建 CTA

使用 URL 承载筛选。

FE-030 后停止。

---

# FE-031：队伍详情与申请 Mock 流程

构建：

```text
Team detail
Application modal
Success state
Owner action state
```

无真实后端。

不要实现聊天。

FE-031 后停止。

---

# FE-032：创建组队帖子表单

使用 Nuxt UI 表单系统。

字段遵循 PRD。

包含：

```text
validation
loading submit state
success mock response
field error rendering
```

FE-032 后停止。

---

# FE-040：组织列表

构建：

```text
organization discovery
type filter
recruitment state
organization card
```

FE-040 后停止。

---

# FE-041：组织详情

构建：

```text
organization identity
introduction
direction
leader
current recruitment
recent activity preview
```

组织可以有视觉身份媒体，但不得重新定义平台 UI 系统。

FE-041 后停止。

---

# FE-042：招新详情与申请 Mock

构建：

```text
recruitment positions
requirements
deadline
application
status
```

FE-042 后停止。

---

# FE-050：活动列表

构建：

```text
activity list
status
date
location
registration state
```

FE-050 后停止。

---

# FE-051：活动详情与报名 Mock

构建：

```text
activity detail
registration modal / inline action
capacity display（仅在存在真实数据时）
cancel registration mock
```

FE-051 后停止。

---

# FE-060：Q&A 与指南

构建：

```text
FAQ
guides
search
question category
question detail
```

如果产品流程未定，私密咨询可以保留为后续功能。

FE-060 后停止。

---

# FE-070：账号外壳

构建：

```text
profile
follows
team posts
applications
activities
questions
organizations
settings
```

使用占位 fixture 数据。

除非 API 契约冻结，不要实现真实认证。

FE-070 后停止。

---

# FE-080：组织管理外壳

构建组织负责人界面。

区块：

```text
organization profile
recruitments
applications
```

权限 UX：

- 负责人可见管理
- 成员不可见
- 学生不可见

仅 mock 权限上下文。

真实权限由后端在后续强制。

FE-080 后停止。

---

# FE-090：平台运营外壳

构建运营人员体验。

使用更工具化的模式：

```text
tables
filters
forms
compact navigation
```

区块：

```text
competitions
activities
questions
guides
announcements
```

不要构建视觉无关的管理主题。

FE-090 后停止。

---

# Phase F12：API 契约门禁

在此门禁之前不要连接生产 API。

必需文档：

```text
docs/api/APIContract.md
```

它必须定义：

- endpoint
- method
- request
- response
- pagination
- error shape
- auth expectation
- permission errors
- date format

只有在 API 契约评审后，才能开始 API 集成任务。

---

# FE-100：共享 HTTP 客户端

实现：

```text
base URL
JSON handling
AppError normalization
AbortSignal support
CSRF support（如果认证设计已就绪）
```

页面不得直接 fetch。

FE-100 后停止。

---

# FE-101：竞赛 API 集成

用 API 调用替换竞赛 fixtures。

保持：

```text
loading
empty
error
```

在 fixtures 对测试 / 开发有用之前，不要移除它们；或者有意用更好的 mock 策略替换。

FE-101 后停止。

---

# FE-102：队伍 API 集成

集成：

```text
list
detail
create
apply
application state
```

FE-102 后停止。

---

# FE-103：组织 API 集成

集成组织与招新流程。

FE-103 后停止。

---

# FE-104：活动 API 集成

集成活动列表、详情与报名。

FE-104 后停止。

---

# FE-105：认证与权限集成

只在后端认证冻结后执行。

实现：

```text
current user
session state
login / logout
route UX guard
organization memberships
platform role
```

安全仍由后端强制。

FE-105 后停止。

---

# Phase F13：加固（Hardening）

## FE-120：无障碍审计

检查：

```text
keyboard
focus
ARIA
labels
contrast（亮色与暗色两种模式）
200% zoom
reduced motion
touch targets
```

修复 blocking 问题。

---

# FE-121：响应式审计

检查代表性宽度。

聚焦：

```text
long Chinese titles（长中文标题）
navigation
forms
tables
modals
drawers
deadline rows
cards
```

---

# FE-122：性能审计

检查：

- 资源体积
- 图片加载
- 路由 chunk
- 不必要的依赖
- 重复库
- 布局位移
- 首页请求

---

# FE-123：浏览器冒烟测试

高价值流程：

```text
homepage navigation
global search
competition browse
team apply
organization apply
activity register
mobile menu
```

---

# FE-124：发布前端构建

必需：

```bash
pnpm check
pnpm build
```

验证：

```text
dist/
```

适合 Nginx 静态托管。

记录 SPA fallback 要求。

---

# Codex 任务模板（Codex Task Template）

将此模板用于实际的 coding agent 任务分配。

```text
Task: FE-XXX — <任务名称>

先读：
- AGENTS.md
- docs/frontend/FrontendDesign.md
- docs/frontend/FrontendArchitecture.md
- docs/frontend/FrontendImplementationPlan.md 中的 FE-XXX 章节

目标（Goal）：
<一个清晰目标>

范围（Scope）：
<可以改动什么>

范围外（Out of scope）：
<不得改动什么>

重要约束：
- 遵循仓库现有模式
- 创建自定义基础组件前先使用 Nuxt UI
- 产品图标无 emoji
- 仅 Lucide SVG 图标系统
- 未检查 package.json 并说明理由前，不添加新依赖
- 不修改后端契约
- 不继续执行下一个 FE 任务
- UI 文案使用简体中文（FrontendDesign.md §0.1 / §43）
- 暗色模式遵循 FrontendDesign.md §7.4，不得页面级硬编码暗色样式

验收标准：
<复制任务特定标准>

验证：
- 运行 lint
- 运行 typecheck
- 运行相关测试
- 运行 build
- UI 变更需渲染并验证 desktop / mobile / dark mode

完成报告：
- 摘要
- 变更文件
- 运行过的命令与结果
- 执行的视觉验证
- 偏差
- 已知问题

在本任务后停止。
```

---

# 首个 Codex 任务（First Codex Assignment）

仓库文档就位后，第一个实际任务应该是：

```text
只执行 FE-001。

编辑前先读 AGENTS.md 与 FE-001 引用的文档。

先检查仓库。

在 frontend/ 下初始化 Vue 3 + Vite + TypeScript + Nuxt UI v4 前端基础。

暂不实现首页。

运行 FE-001 全部验证。

报告并停止。
```

在这个阶段，不要要求 Codex：

```text
"把整个平台都建出来"
```

项目应通过可验证的增量成长，而不是一次巨型生成。
