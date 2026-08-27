# AGENTS.md

> 在 `campus-innovation-hub` 仓库中工作的 coding agent 的权威指引（source of truth）。

本文件刻意保持精简。

它告诉 Codex、Claude Code 及其他 coding agent 如何在该仓库中工作。

详细的产品、设计与架构知识存放在引用的文档中，不要在本文重复那些文档的内容。

---

# 项目（Project）

`campus-innovation-hub` 是人工智能学院的科创与就业服务平台，面向简体中文用户（简体中文（zh-CN）是唯一产品语言，见 FrontendDesign.md §0.1）。

学生端核心工作流：

```text
发现竞赛（discover competitions）
寻找队友（find teammates）
发现社团组织与招新（organizations and recruitment）
浏览并报名活动（activities）
阅读指南 / FAQ（guides / FAQ）
接收通知（notifications）
```

初始生产架构：

```text
Vue SPA -> Nginx -> Django REST API -> PostgreSQL
```

前端生产产物为静态文件（static）。

生产服务器资源受限，约 2 CPU / 2 GB RAM，因此明确不鼓励引入非必要的基础设施与运行时服务。

---

# 必读文档（Required Reading）

前端工作开始前，阅读以下文档的相关部分：

```text
docs/frontend/FrontendDesign.md
docs/frontend/FrontendArchitecture.md
docs/frontend/FrontendImplementationPlan.md
docs/product/PRD.md
docs/product/PageMap.md
docs/backend/database-design.md（领域模型、Django Model、API、fixture、状态机或数据约束相关任务必读）
```

如果部分文件尚不存在，不要凭空编造其内容，改为报告缺失的源文件。

对于限定范围的任务，只需阅读完成任务所必需的章节。

---

# 文档语言（Documentation Language）

仓库内所有文档使用简体中文书写，专业术语保留英文原文：

- 正文、说明、决策理由使用简体中文
- 专业术语保留英文（例如 Vue 3、Nuxt UI、Tailwind CSS、TypeScript、composable、design token、fixture、WCAG、ARIA、ADR）
- 代码块、命令、文件路径、包名、组件名保持原样，不翻译
- 产品 UI 文案遵循 FrontendDesign.md §0.1 语言政策
- 新增或修改文档时必须保持中文书写约定，不要把新内容写成英文

---

# 指令优先级（Instruction Priority）

当来源冲突时：

```text
1. 当前明确的任务
2. 本 AGENTS.md
3. FrontendDesign.md（UI / UX 决策）
4. FrontendArchitecture.md（工程结构）
5. FrontendImplementationPlan.md（任务范围 / 顺序）
6. PRD 与 PageMap（产品行为）
7. 原型、截图与 demo HTML
```

当新版规范明确取代旧版时，不要保留过时原型的行为。

---

# 仓库结构（Repository Orientation）

目标仓库结构：

```text
campus-innovation-hub/
├── AGENTS.md
├── README.md
├── docs/
│   ├── product/
│   ├── frontend/
│   ├── backend/
│   ├── api/
│   └── adr/
├── frontend/
├── backend/
├── deploy/
└── scripts/
```

前端工作属于：

```text
frontend/
```

不要把应用源代码放在仓库根目录。

---

# 前端技术栈（Frontend Stack）

除非当前任务明确修改架构，只使用已批准的基线：

```text
Vue 3
Vite
TypeScript
Nuxt UI v4
Tailwind CSS v4
Vue Router
Pinia
Iconify / Lucide icon names
pnpm
```

不要引入第二个完整 UI 框架。

未经批准的架构变更，禁止使用：

```text
Element Plus
Ant Design Vue
PrimeVue
Arco Design
Vuetify
shadcn-vue（作为第二套组件系统）
```

---

# 前端包管理器（Frontend Package Manager）

使用：

```text
pnpm
```

执行包管理命令前：

1. 检查 `package.json`
2. 检查 package-manager 字段
3. 尊重锁定的版本
4. 不要生成 npm 或 yarn lockfile

不要替换 `pnpm-lock.yaml`。

## 后端包管理（Backend Package Manager）

`backend/` 使用：

```text
uv
pyproject.toml
uv.lock
```

执行 Python 依赖、管理命令或 CI 命令前，确认 `backend/pyproject.toml` 与 `backend/uv.lock` 一致，并优先使用：

```text
uv sync --frozen --group dev
uv run --frozen python manage.py <command>
```

不要直接使用 `pip install`，不要新建 requirements 的第二套可编辑依赖真源，也不要手改 `uv.lock`。新增依赖必须更新 `pyproject.toml` 后由 `uv lock` 生成锁文件。

---

# 依赖规则（Dependency Rule）

引入第三方依赖前：

1. 检查该依赖是否已安装
2. 检查 Nuxt UI / Vue / 浏览器 API 是否已能解决问题
3. 说明为什么需要新依赖
4. 选择最小且合适的依赖
5. 正常更新 lockfile

不要为一个小视觉效果而添加包。

不要添加与现有能力重复的第二个库。

---

# 前端设计硬规则（Frontend Design Hard Rules）

`FrontendDesign.md` 是权威。

修改任何前端 UI（组件、页面、样式、交互、文案）之前，必须阅读 `docs/frontend/FrontendDesign.md` 的相关章节；未阅读前不得开始前端修改。该要求对一切前端 UI 变更强制生效，不只适用于全新页面。

至少必须遵守：

- 产品 UI 图标不使用 emoji
- 通过批准的图标系统使用 SVG 图标
- 只使用一个连贯的图标家族（Lucide）
- 不要手绘通用 UI 图标
- 不要用 Unicode 箭头替代图标
- 使用 design token，而不是随意硬编码颜色
- 避免通用 AI 风格的渐变与 glassmorphism
- 避免装饰性状态圆点
- 避免过度使用 pill / badge
- 避免卡片套卡片的视觉嵌套
- 不要使用虚假的 KPI 指标
- 不要添加滚动提示（scroll cue）
- 尊重 reduced motion（§33）
- 保持可见的键盘焦点
- 移动端行为是组件定义的一部分

暗色模式（dark mode）：

- 使用 Nuxt UI 原生 Color Mode（FrontendDesign.md §7.4）
- 组件消费设计 token，页面不得自行实现暗色样式
- 暗色下的对比度必须满足 WCAG AA，与亮色同等验证

语言要求：

- 所有产品 UI 文案使用简体中文，遵循 FrontendDesign.md §0.1 与 §43

用户生成内容中允许出现 emoji，产品界面（product chrome）不得把 emoji 当作图标使用。

---

# 架构规则（Architecture Rules）

遵循 `FrontendArchitecture.md`。

核心依赖方向：

```text
pages -> features -> shared
```

shared 代码不得导入业务 feature。

页面负责组合 feature。

页面不直接实现原始 API 调用。

feature 的 API 模块调用共享 HTTP 层。

Pinia 用于跨页面的客户端状态，不是所有服务端数据的垃圾场。

需要可分享或可恢复的 URL 状态属于 Vue Router。

---

# 组件规则（Component Rules）

创建基础组件前：

1. 检查 Nuxt UI
2. 如果适用，使用 Nuxt UI 基础组件
3. 需要业务语义时，用业务组件包裹它
4. 只有在必要时才创建自定义基础组件

不要手动重造：

```text
button
modal
drawer
toast
tooltip
dropdown
table
pagination
carousel
command palette
标准表单控件（standard form controls）
```

当 Nuxt UI 已经提供它们时。

---

# Vue 规则（Vue Rules）

使用 Composition API。

优先：

```text
<script setup lang="ts">
```

使用：

```text
ref
computed
watch（仅在需要时）
composables
```

避免不必要的 watcher。

不要修改 props。

使用类型化 emits 与类型化 props。

保持副作用（side effects）清晰可见。

---

# TypeScript 规则（TypeScript Rules）

必须开启 TypeScript strict 模式。

不要用 `any` 掩盖类型错误。

优先：

```text
unknown
narrowing
显式接口（explicit interfaces）
泛型（generics）
对关键外部数据（用户 / 会话、表单提交、复杂响应）做运行时 schema 校验
```

如果 `any` 不可避免，在本地添加注释说明原因。

不要将 API 响应宽泛地断言（cast）为受信任的领域类型。

---

# API 规则（API Rules）

页面组件不得直接调用 `fetch()`。

预期调用链：

```text
Page
-> composable
-> feature API module
-> shared HTTP client
-> backend
```

不要静默改变 API 契约。

如果前后端契约不一致：

1. 停止
2. 记录不一致之处
3. 提出最小契约变更
4. 不要凭空编造缺失字段

---

# Mock 数据（Mock Data）

在 API 集成之前，使用类型化 fixtures。

存放在：

```text
frontend/src/mocks/fixtures/
```

不要把大型 mock 数组直接放在页面组件内。

Mock 数据不得被呈现为真实的官方统计。

---

# 认证与权限规则（Authentication and Permission Rules）

前端权限检查只用于 UX。

后端始终是权威（authoritative）。

不要把以下内容当作安全强制：

```text
隐藏按钮（hidden button）
路由守卫（route guard）
禁用菜单（disabled menu）
```

默认不要将长期有效的认证密钥存放在 localStorage。

在认证契约获批前，不要臆造最终认证方案。

---

# 产品角色模型（Product Role Model）

不要把组织头衔扁平化为全局角色。

概念模型：

```text
平台角色（Platform role）:
student
operator
superadmin

组织成员关系（Organization membership）:
member
leader

头衔（Title）:
部长
会长
干事
技术部成员
...
```

头衔（Title）是展示数据，不是权限原语。

---

# 文件职责（File Responsibility）

每个文件应有明确的存续理由。

避免：

```text
2000 行的页面组件
巨型 utils 文件
巨型 composables 文件
misc.ts
包含无关函数的 helpers.ts
```

优先使用聚焦的命名。

不要提取没有行为或语义价值的小包装组件。

---

# 样式规则（Styling Rules）

使用已批准的 token。

优先使用 Tailwind 语义化 scale 与集中式主题配置。

不要引入页面级颜色体系。

当 token 存在时，避免任意值（arbitrary values）。

如果需要光学微调的一次性值，保持局部并说明原因。

除非处理已文档化的第三方限制，不要使用 `!important`。

---

# 图标规则（Icon Rules）

通过 Nuxt UI / Iconify 使用已批准的 Lucide 图标名。

不要使用：

```text
emoji
Unicode 箭头字形
随机的图标库
手写通用操作的 SVG path
```

自定义 SVG 保留给：

```text
平台 logo
学校 logo
组织 logo
原创图表 / 插图
独特的品牌符号
```

---

# 无障碍（Accessibility）

每个 UI 任务都必须考虑：

- 键盘导航
- 可见焦点
- 语义化 HTML
- 正确的 label
- 纯图标按钮的 aria-label
- modal 焦点行为
- 颜色对比度（含暗色模式）
- 200% 缩放
- reduced motion
- 触摸目标尺寸
- 状态不只通过颜色传达

在没有提供已批准的替代方案前，不要移除浏览器焦点轮廓。

---

# 响应式要求（Responsive Requirements）

检查：

```text
desktop
tablet
mobile
```

移动端不是桌面的缩小版。

不要为了保留装饰性媒体而隐藏核心信息：

```text
deadline（截止时间）
status（状态）
primary action（主操作）
```

避免横向滚动，除非该组件中的横向滚动是刻意的可用模式。

---

# 移动端 Web 规则（Mobile Web Rules）

响应式移动端 Web 是 V0.1 的生产面（production surface），不是后续打磨步骤。

设备布局分级：

```text
Phone   < 768px
Tablet  768–1023px
Desktop >= 1024px
```

Phone 根级导航固定五项：

```text
首页
竞赛
组队
活动
我的
```

使用 `MobileBottomNav` 仅限已批准的根级 Tab 路由。

Phone 详情 / 表单路由必须隐藏全局 Bottom Navigation，改用：

```text
MobilePageHeader
MobileActionBar（有用时）
```

Tablet 使用 Drawer 导航。

不要：

- 把桌面顶部导航压缩成手机 Header
- 在底部栏放六个或更多同级 Tab
- 创建 `/mobile/*` 重复路由
- 用机型 / 浏览器指纹判断布局
- 核心操作依赖 hover
- 把长移动表单放进小 Modal
- 让固定底部 UI 遮挡内容
- 忽略 iOS safe area（`env(safe-area-inset-bottom)`）
- 在任务未明确要求分发目标时引入 Capacitor、uni-app、Taro、微信 SDK 或 PWA 依赖

Phone UI 变更至少验证：

```text
360
390
430
768
1024
1440
```

并检查：

```text
safe area
touch targets（触摸目标）
scroll（滚动）
keyboard focus（键盘焦点）
light mode（亮色）
dark mode（暗色）
primary task completion（主任务完成路径）
```

当响应式行为与旧原型冲突时，以最新 `FrontendDesign.md` 与 `PageMap.md` 为准。

---

# 加载与失败状态（Loading and Failure States）

对于数据驱动的 UI，实现或明确考虑：

```text
loading
success
empty
error
```

不要只交付成功状态。

错误必须可操作（actionable）。

不要把 toast 作为字段校验的唯一呈现位置。

---

# 动效（Motion）

默认使用：

```text
CSS transitions
Nuxt UI 内置动效
```

没有具体需求时，不要引入 Motion / GSAP / Anime.js。

禁止持续装饰性动画。

禁止过度页面加载交错（page-load stagger）。

尊重：

```text
prefers-reduced-motion
```

---

# 生产约束（Production Constraints）

前端是静态生产构建。

未经明确架构批准，不要引入：

```text
前端 Node 生产服务器
SSR 需求
微前端（micro-frontends）
WebSocket 需求
service worker
PWA
```

2C2G 服务器约束是真实的。

优先更少的服务与更少的运行时依赖。

---

# 数据库规则（Database Rules）

涉及 Django Model、Serializer 字段、fixture、API 数据结构、Migration 或数据库查询时，必须先读：

```text
docs/backend/database-design.md
```

规则：

- 不创建文档未定义的业务持久字段来"方便页面"
- 派生状态与展示文本不重复存入数据库
- 不用一个万能 JSONField 替代稳定关系模型
- 不用 GenericForeignKey 承载核心业务关系
- 不修改已进入共享历史的 Migration
- 关键唯一性必须有数据库 Constraint，不只靠前端检查
- 跨表状态流转、名额检查和申请通过使用事务 Service
- 不将业务历史通过 CASCADE 批量删除
- 新增或改变数据库语义时先更新 `database-design.md`，再写 Migration
- 涉及 PostgreSQL partial unique、jsonb、行锁的测试不能只依赖 SQLite

---

# 命令（Commands）

前端就绪后，预期命令契约：

```text
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
```

声明完成前，运行与本次变更相关的命令。

普通前端实现任务至少运行：

```text
pnpm lint
pnpm typecheck
pnpm build
```

当存在与被变更行为相关的测试时，运行测试。

后端任务在 `backend/` 内使用由 `uv` 管理的 `.venv` 执行相关命令：

```powershell
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py makemigrations --check --dry-run
.\.venv\Scripts\python.exe manage.py test -v 2
```

服务器隔离验证应使用 `uv` 创建临时环境，使用 PostgreSQL 测试数据库；不要以 SQLite 替代 PostgreSQL 验证。

---

# 开发与部署工作流（Development & Deployment Workflow）

当前为开发阶段，采用 Git 驱动的部署流程：

```text
本地修改（local edit）
-> 本地验证（local verification）
-> 提交并推送（commit & push）
-> 服务器拉取（server pull）
-> 部署（deploy）
-> 服务器验证（server verification）
```

## 本地修改与验证

- 修改前按本文件"代理任务协议"阅读必读文档；
- UI 变更按"完成前验证"执行；非 UI 变更至少过 lint / typecheck / build；
- 前端全量验证：`pnpm check`（lint + typecheck + test + build）；
- 后端：运行相关 pytest / `manage.py test`；涉及数据库行为的用例必须跑 PostgreSQL，不能只依赖 SQLite；
- 契约变更：若修改 API 或数据库语义，先更新 `APIContract.md` / `database-design.md` 再改代码，禁止单侧静默修改。

## 提交与推送

- 只推送经过本地验证的提交；commit message 使用简体中文，注明关键变更；
- 开发阶段直接推 `main`（单人 / 小团队），不创建长期 feature 分支；
- 禁止把本地密钥、`*.env`、未渲染模板推入仓库。

## 服务器拉取与部署

- 通过 SSH 到服务器；部署遵循 `deploy/README.md`（release 目录 + 目标 SHA 回滚）；
- 以目标 Git SHA 在 `/opt/campus-innovation-hub-dev/releases/<SHA>` 做干净 checkout，再运行 provision 脚本（development 环境）；
- 开发阶段不得触碰生产 systemd unit、Nginx TLS 模板与 production env；生产发布走 `deploy/README.md` §2 的单独授权流程；
- 临时公网展示需单独授权后使用 `deploy/scripts/provision-temporary-public.sh`；
- 数据库变更：先 `deploy/scripts/backup-postgres.sh` 备份，migration 由 provision 流程执行。

## 服务器验证

- 健康检查：`/api/health` 与 `/api/ready` 可达；
- 冒烟：登录、核心读接口、目标页面可访问；
- 记录实际执行的命令与结果，不虚构验证。

## 回滚

- 部署以 release 目录 + 目标 SHA 为准；回滚即切回前一 SHA 并重新 provision；
- 回滚前确认 migration 是否向后兼容（deploy/README.md §3）。

---

# 完成前验证（Verification Before Completion）

不要仅凭代码检查就报告成功。

UI 任务：

1. 运行应用
2. 检查渲染后的页面
3. 测试主要交互
4. 检查桌面端
5. 检查移动端
6. 检查控制台错误
7. 运行 lint / typecheck / build
8. 与已批准的视觉源与设计规则对比

如果浏览器工具不可用，明确说明。

不要虚构未发生的视觉验证。

非 UI 变更（纯逻辑、类型、配置、文档）只需运行相关命令与测试，不要求视觉检查步骤。

---

# 变更范围（Change Scope）

保持在分配的任务范围内。

不要：

- 自动开始实施计划中的下一个任务
- 重构无关 feature
- 重设计无关页面
- 无必要地重命名大型目录树
- 不必要地变更依赖
- 作为副作用改变后端契约
- 因为个人偏好替换已批准的架构

如果阻塞项需要超出范围的工作，停止并报告。

---

# Git 安全（Git Safety）

不要：

- 删除无关的用户工作
- 强制重置
- 重写历史
- 强制推送
- 删除分支
- 未读取就覆盖现有文档

优先小且可审查的 diff。

不要提交生成的本地密钥。

---

# 文档同步（Documentation Sync）

如果变更修改了：

- 架构
- 设计系统规则
- 标准命令
- 目录归属
- 开发工作流

在同一个任务中更新相关文档。

不要让 `AGENTS.md` 声称不存在的命令。

新增或修改的文档必须使用简体中文书写（见上文"文档语言"章节）。

---

# 测试哲学（Testing Philosophy）

测试重要的行为。

优先测试：

- 权限辅助函数
- 日期 / 状态逻辑
- 有分支行为的 composables
- 表单
- 用户操作
- 错误处理

避免只断言静态标记存在的低价值测试。

不要用 snapshot 测试作为视觉设计的主要保护手段。

---

# 代理任务协议（Agent Task Protocol）

对每个分配的任务：

## 编辑前（Before Editing）

1. 阅读本文件
2. 阅读任务指定的文档；前端 UI 变更必须包含 `docs/frontend/FrontendDesign.md` 的相关章节
3. 检查当前仓库
4. 检查 `package.json`
5. 先识别现有模式，再创建新模式
6. 明确或在内部确认任务边界

## 工作中（During Work）

1. 做最小且连贯的实现
2. 复用项目组件
3. 保持架构方向
4. 保持 UI 可用
5. 在行为值得测试时添加测试

## 完成前（Before Completion）

1. 运行必需的验证
2. 视觉检查 UI 变更
3. 审查 diff 中是否有意外变更
4. 确认未引入被禁止的依赖或 UI 模式
5. 在分配的任务边界处停止

---

# 完成报告（Completion Report）

以如下结构结束编码任务：

```text
Summary（摘要）
- 实现了什么

Changed Files（变更文件）
- 仅重要文件

Validation（验证）
- 实际运行的命令
- 通过 / 失败

Visual Verification（视觉验证）
- 桌面端
- 移动端
- 已测试的主要交互

Deviations（偏差）
- 与设计 / 任务任何已批准的差异

Known Issues（已知问题）
- 剩余阻塞项，或"无"
```

除非所述验证确实支持，否则不要声称：

```text
fully verified（完全验证）
pixel perfect（像素级完美）
production ready（生产就绪）
```

---

# 当前阶段（Current Phase）

项目当前进入：

```text
Frontend Foundation（前端基础）
```

除非任务明确要求，不要实施 Django 集成。

初始实施顺序由以下文档控制：

```text
docs/frontend/FrontendImplementationPlan.md
```
