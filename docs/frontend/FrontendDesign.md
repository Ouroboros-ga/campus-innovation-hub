# FrontendDesign.md

> 人工智能学院科创与就业服务平台前端设计与实现规范  
> Version: 0.3  
> Status: Design Baseline  
> Visual Direction: GitHub Education + Devpost + Modern Campus Public Service  
> Scope: Student Web, Organization Management, Platform Operations  
> Primary UI Stack: Vue 3 + Vite + TypeScript + Nuxt UI v4 + Tailwind CSS  
> Locale: 简体中文（zh-CN）— the only supported product locale  
> Versioning note: the document version (0.3) is independent from the product milestone (V0.1). Every "V0.1" in this document refers to the first shippable product iteration, not to the document version.

---

## 0. Document Purpose

This document is the single design contract for the frontend of the 科创与就业服务平台.

It is not a mood board.

It defines:

- what the interface should feel like
- what components may be used
- how color, spacing, icons, type and motion are controlled
- what visual patterns are prohibited
- how responsive and accessible behavior should work
- how new pages should be reviewed before merge
- how AI coding agents and human developers should make UI decisions
- the language rules for all user-facing content

## 0.1 Language Policy

The platform is a Simplified Chinese campus service. All user-facing UI copy, content pages, notifications, emails and documents are written in 简体中文（zh-CN）.

This policy is not optional:

- use Simplified Chinese characters（简体）in product UI; never Traditional Chinese（繁體）
- dates, times and numbers use Chinese formatting conventions（例如 2026年8月25日、还有 3 天截止）
- do not mix Simplified and Traditional Chinese on the same surface
- Latin text is allowed only inside recognized technical terms, course names, competition names, abbreviations and proper nouns（例如 Vue 3、ACM 竞赛）
- Chinese copy must follow Chinese typographic conventions, not English ones（见 §11.3、§11.4、§11.5 与 §43）
- repository technical documents（AGENTS.md、FrontendArchitecture.md、FrontendImplementationPlan.md、docs/adr/ 等）use Simplified Chinese prose with English technical terms, per the Documentation Language section of AGENTS.md; this document is the same contract
- if a second locale is ever needed, raise a design decision first; V0.1 ships Simplified Chinese only

When a page implementation conflicts with this document, the implementation should be changed unless a newer approved design decision explicitly overrides this specification.

The design goal is not to make every page visually impressive.

The goal is:

> Students can quickly find opportunities and complete tasks, organization leaders can manage content safely, and the product still looks credible after several years of use.

---

# 1. Reference Principles

This design system borrows principles from several mature frontend design and review approaches.

The important ideas adapted into this project are:

- design for a specific user task instead of starting from decorative layout
- establish one intentional visual direction and maintain it consistently
- use a design system instead of local one-off styles
- use design tokens instead of hardcoded colors and spacing
- avoid generic AI-generated layout patterns
- minimize decorative cards, pills, gradients and floating visual noise
- make keyboard navigation and visible focus states part of the baseline
- treat responsive behavior as part of component design
- use one coherent icon family
- do not use emoji as product UI iconography
- keep interaction and motion purposeful
- visually verify implemented pages rather than trusting code alone

For this product, those principles are adapted to a campus public-service context.

This means we deliberately choose restraint over experimental visual spectacle.

---

# 2. Product Design Direction

The platform is not:

- a university publicity website
- an AI SaaS landing page
- a data dashboard
- a social media product
- a cyberpunk technology showcase

The platform is:

> A modern campus service product for competitions, teams, organizations, activities and student guidance.

The visual personality is:

**Trustworthy**
- information should feel official enough to rely on
- dates and status must be clear
- actions must be predictable
- no fake statistics or promotional claims

**Young**
- spacing and typography should feel contemporary
- organization and team sections can feel more active than administrative systems
- real campus photography is preferred over generic illustration

**Efficient**
- scanability is more important than spectacle
- dense information may use lists and tables
- cards are used only when the content benefits from them

**Restrained**
- limited color
- limited radius
- limited shadow
- limited animation
- limited badge usage

---

# 3. Non-Negotiable Hard Rules

These rules apply to every production page unless there is explicit design approval for an exception.

## 3.1 No Emoji in Product UI

Emoji must not be used as:

- navigation icons
- section icons
- status indicators
- button icons
- list markers
- feature icons
- empty-state graphics
- dashboard decorations

Bad:

```text
🏆 热门竞赛
🔔 通知公告
📚 热门指南
🔥 即将截止
```

Good:

```text
[SVG Trophy] 热门竞赛
[SVG Bell] 通知公告
[SVG BookOpen] 热门指南
[SVG Clock] 即将截止
```

Emoji is only allowed inside user-generated content where it is part of the user's text.

Emoji is not a component primitive.

---

## 3.2 Icons Must Be SVG Components

All normal interface icons must render as SVG through the approved icon system.

Primary icon source:

```text
Iconify
Icon family: Lucide
```

Examples:

```text
i-lucide-search
i-lucide-bell
i-lucide-trophy
i-lucide-users
i-lucide-calendar-days
i-lucide-building-2
i-lucide-book-open
i-lucide-chevron-right
```

Rules:

- one icon family per application surface
- default icon size: 16, 18 or 20px
- Quick Entry icons may use 20 to 22px
- stroke weight must remain visually consistent
- icon color inherits `currentColor`
- icons align optically with text, not only mathematically
- icon-only buttons require `aria-label`

Do not mix Lucide, Heroicons, Font Awesome and Material icons in the same product.

Do not use Unicode arrows such as `→`, `▶`, `★`, `●` as substitutes for UI icons when an SVG glyph exists.

Use:

```text
ChevronRight
ExternalLink
Star
Circle
```

instead.

---

## 3.3 Do Not Hand-Draw Common UI Icons

Do not manually write custom SVG path data for common actions such as:

- search
- close
- menu
- chevron
- calendar
- user
- upload
- download
- edit
- delete
- settings
- notification

Use the icon library.

Custom SVG is appropriate for:

- official platform logo
- school / organization logos
- original illustrations
- diagrams
- unique branded symbols unavailable in the library

Custom SVG must have:

```text
viewBox
semantic size
clean paths
currentColor when appropriate
accessible title or aria-hidden
```

---

## 3.4 No Hardcoded Design Values in Page Components

Page components must not introduce arbitrary design values when a token exists.

Avoid:

```css
color: #1768ef;
margin-top: 17px;
border-radius: 13px;
```

Prefer semantic tokens or the approved spacing scale.

Hardcoded values are acceptable only for:

- unique media aspect ratios
- one-off chart dimensions
- documented optical corrections
- browser / platform workarounds

Any exception should have a comment explaining why.

---

## 3.5 No Generic AI UI Patterns

Do not ship the following patterns by default:

- purple-to-blue gradient hero
- neon glow
- glassmorphism without real layering purpose
- large gradient text
- floating AI orb
- oversized rounded cards everywhere
- every section presented as a card grid
- icon + heading + one sentence repeated six times
- three fake KPI cards on pages that are not dashboards
- fake "trusted by" logos
- fake view counts or user counts
- decorative "AI powered" badges
- random sparkles
- confetti for routine actions
- ambient animated blobs
- meaningless dotted backgrounds
- generic 3D illustration packs

This platform should look designed for campus services, not generated from a generic SaaS prompt.

---

## 3.6 No Decorative Status Dots

A colored dot may only be used when it conveys an actual state.

Allowed:

```text
server online
unread notification
live event
```

Not allowed:

```text
blue dot before every section title
orange dot before every list row
random green dot beside labels for decoration
```

Status should usually be expressed by text, icon, or badge.

---

## 3.7 No Scroll Cues

Do not add:

```text
Scroll
Scroll to explore
↓ Scroll
mouse wheel animation
```

Users understand scrolling.

---

## 3.8 Avoid Nested Card Interfaces

Do not build:

```text
Page Card
  -> Section Card
      -> Item Card
          -> Inner Info Card
```

Prefer:

```text
Page
  -> Section
      -> List / Table / Card where appropriate
```

Maximum recommended visual surface nesting:

```text
2 levels
```

---

# 4. Technology Contract

Production frontend:

```text
Vue 3
Vite
TypeScript
Nuxt UI v4
Tailwind CSS
Pinia
Vue Router
Iconify
```

Backend integration:

```text
Django
Django REST Framework
PostgreSQL
```

Optional future dependency:

```text
Motion
```

Motion is not required in the V0.1 product milestone.

---

# 5. Component Library Policy

Nuxt UI is the single primary component library.

Use Nuxt UI for:

```text
Button
Input
Textarea
Select
Checkbox
Radio
Badge
Avatar
Dropdown
Modal
Drawer
Slideover
Toast
Tabs
Table
Pagination
Timeline
Carousel
Command Palette
Tooltip
Skeleton
Empty
Form
Dashboard primitives
```

Do not install a second full UI framework.

Forbidden parallel libraries unless the architecture is formally changed:

```text
Element Plus
Ant Design Vue
PrimeVue
Arco Design
Vuetify
```

`shadcn-vue` is a visual reference only.

Do not copy shadcn components into the codebase while also using Nuxt UI for equivalent primitives.

---

# 6. Dependency Verification Rule

Before importing any third-party package:

1. check `package.json`
2. verify the package already exists
3. if it does not exist, document why it is needed
4. prefer existing project dependencies
5. avoid adding a package for one small UI effect

Do not assume a package is installed because a code example uses it.

One feature should not introduce an entire UI library.

---

# 7. Design Tokens

Tokens are the source of truth.

Pages consume tokens.

Pages do not invent colors.

## 7.1 Brand Color

```css
--color-primary-50: #EEF6FF;
--color-primary-100: #DDEBFF;
--color-primary-200: #B8D7FF;
--color-primary-300: #86BBFF;
--color-primary-400: #4D9BFF;
--color-primary-500: #1677FF;
--color-primary-600: #0F6FE8;
--color-primary-700: #0B5FC7;
--color-primary-800: #094FAD;
--color-primary-900: #083E88;
--color-primary-950: #052857;
```

完整色阶以现有 50、100、500、600、700 为锚点补齐；400 同时作为暗色模式的高对比交互色。色阶从 50 到 950 的相对亮度必须单调递减，不允许局部跳色。

Primary blue is used for:

- selected navigation
- main CTA
- links
- active controls
- keyboard focus
- selected tabs
- important official information

Contrast rule (WCAG AA, both color modes):

- text-level links must use `--color-primary-600` or darker. primary-500 is 4.1:1 on white, below the 4.5:1 AA threshold for normal-size text, so it is not allowed for body links
- filled primary buttons (white label on blue) must use `--color-primary-600` fill, which gives a 4.7:1 label contrast; primary-500 is reserved for large text, icons, selected states and decorative accents where 3:1 is sufficient
- hover state darkens one step (primary-600 -> primary-700); in dark mode hover lightens one step (primary-500 -> primary-400, see §7.4)
- any future change to primary shades must pass a WCAG contrast check against the surfaces they appear on

Do not use large primary-blue backgrounds on ordinary content pages.

---

## 7.2 Neutral Colors

```css
--color-canvas: #F5F7FB;
--color-surface: #FFFFFF;
--color-surface-subtle: #F8FAFC;

--color-text-strong: #111827;
--color-text: #3F4A5A;
--color-text-muted: #6B7280;
--color-text-disabled: #A8B0BD;

--color-border: #E5E9F0;
--color-border-strong: #D8DEE8;
```

Contrast check: `--color-text-muted` was deepened from #7C8799 to #6B7280 so that 12-13px metadata text reaches 4.5:1 on white (it was approximately 3.6:1 before). Any future change to neutral colors must pass a WCAG AA contrast check against the surfaces they appear on, in both color modes.

---

## 7.3 Semantic Colors

```css
--color-success: #12A36D;
--color-warning: #F08A24;
--color-danger: #E5484D;
--color-info: #1677FF;
```

Nuxt UI semantic color alias 使用以下适配：

```text
primary -> primary
success -> success
info    -> primary
warning -> warning
error   -> danger
neutral -> neutral（由项目覆盖完整 `--color-neutral-*` 色阶）
```

项目领域与设计文档继续使用 `danger` 表示危险、错误和破坏性状态；只有 Nuxt UI adapter 层使用组件库约定的 `error` 名称。表单校验错误可以消费 `error` alias，但破坏性操作仍必须同时使用明确文案和交互确认，不能只靠红色表达。

Semantic colors are not decorative palette colors.

Use them only when they describe state.

## 7.4 Color Mode (Dark Theme)

Dark mode uses Nuxt UI's native Color Mode support（底层为 @nuxtjs/color-mode，文档亦适用纯 Vue + Vite 集成）:

- a `dark` / `light` class is toggled on the `<html>` element
- `useColorMode()` composable reads and writes the preference; `UColorModeButton` / `UColorModeSwitch` are the approved UI controls
- three preferences are supported: `light`, `dark` and `system`（跟随操作系统）. The default is `system`

Theming is implemented through the Nuxt UI theme layer, never per-page classes:

- semantic color roles（primary、neutral、success 等）在 plain Vue + Vite 项目中通过 `vite.config.ts` 的 `ui({ ui: { colors } })` 映射；如果未来迁移到 Nuxt Framework，再使用 `app.config.ts`
- dark overrides redeclare the same CSS custom properties from §7.1-7.3 inside the `.dark` scope in `tokens.css`
- components consume the variables, so page components do not implement dark styles themselves（与 §52 集中配置一致）

Dark token mapping（基线值，发布前必须逐项通过对比度验证）:

```text
Token                  Light            Dark
--color-canvas         #F5F7FB          #0F1319
--color-surface        #FFFFFF          #161B22
--color-surface-subtle #F8FAFC          #1C232D
--color-text-strong    #111827          #F2F4F7
--color-text           #3F4A5A          #D3D9E2
--color-text-muted     #6B7280          #9AA4B2
--color-text-disabled  #A8B0BD          #5C6672
--color-border         #E5E9F0          #2A3342
--color-border-strong  #D8DEE8          #3B4657
--color-primary-400    （暗色新增）        #4D9BFF
--color-primary-500    #1677FF          #3D8DFF
--color-primary-600    #0F6FE8          #1677FF
--color-primary-700    #0B5FC7          #0F6FE8
--color-success        #12A36D          #2FBF8F
--color-warning        #F08A24          #F7A825
--color-danger         #E5484D          #F05E63
--color-info           #1677FF          #4D9BFF
```

Dark mode rules:

- dark surfaces use elevated grays, never pure black（#000），降低长时间阅读的刺眼感
- text colors invert（暗色底上使用浅色文字），muted 色在暗色下提亮而非压暗，保证 12px 级文字仍满足 4.5:1
- primary 与语义色在暗色下整体提亮一档：文字级对比保持 4.5:1，大文本 / 图标 / 状态指示保持 3:1；最终取值必须用对比度工具验证
- 阴影在暗色背景上几乎不可见，改用 `--color-border-strong` 与表面层级（surface 逐级提亮）来区分层次
- 图片、轮播遮罩与默认竞赛封面必须逐一在暗色模式下检查
- `prefers-reduced-motion` 与 §33 的规则在暗色模式下同样生效
- 不实现独立的"暗色管理后台主题"：学生端与运营端共用同一套暗色 token

---

# 8. Spacing Scale

Approved spacing values:

```text
4
8
12
16
20
24
32
40
48
64
```

Recommended usage:

```text
Icon to text: 6 to 8
Control internal gap: 8
Compact list row: 10 to 12 vertical
Card padding: 12 to 16
Section internal gap: 16
Section to section: 20 to 32
Large page region: 32 to 48
```

Avoid arbitrary spacing such as:

```text
13
17
19
23
27
```

unless an optical correction is documented.

---

# 9. Radius Budget

Radius is a budget, not a decoration.

```text
Small control: 8px
Button / input: 8px
Normal content card: 10px
Major surface: 12px
Hero carousel: 12 to 14px
Avatar: circular
```

共享 token 固定为：

```css
--radius-control: 8px;
--radius-card: 10px;
--radius-surface: 12px;
```

Nuxt UI 的 `--ui-radius` 是圆角比例基数，而不是控件的最终圆角值。项目将其设为
`calc(var(--radius-control) / 1.5)`，使标准控件默认使用的 `rounded-md` 精确落在 8px；
普通卡片与主要表面仍分别直接消费 `--radius-card` 与 `--radius-surface`。

Avoid:

```text
rounded-2xl everywhere
24px cards
pill buttons for normal actions
```

Pill shape is reserved for:

- compact status badges
- chips
- segmented controls when appropriate

---

# 10. Shadow Budget

Default content card:

```text
border: 1px
shadow: none
```

Shadow is allowed for overlays:

- Modal
- Command Palette
- Popover
- Dropdown
- floating menu
- carousel when separation from background is required

Hoverable cards may gain a very light shadow.

No dramatic shadows.

No colored glow shadows.

---

# 11. Typography

This platform is a Chinese campus service system.

Readability and local rendering consistency are more important than a distinctive Latin display font.

Recommended stack:

```css
font-family:
ui-sans-serif,
system-ui,
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
"PingFang SC",
"Hiragino Sans GB",
"Microsoft YaHei",
sans-serif;
```

Do not load a heavy Chinese webfont for ordinary body text.

Use a webfont only if:

- branding requires it
- licensing is confirmed
- Chinese fallback behavior is tested
- performance cost is acceptable

## 11.1 Type Scale

```text
Hero H1: 32 to 36px
Page H1: 28 to 32px
Section H2: 18 to 22px
Panel H3: 15 to 18px
Card title: 14 to 16px
Body: 14 to 16px
Metadata: 12 to 13px
Minimum UI text: 11px
```

Never use text below 11px.

## 11.2 Weight

Prefer:

```text
400 normal body
500 medium UI
600 navigation / labels
650 to 720 important item title
700 to 760 page heading
```

Do not use 900 weight as the default way to create hierarchy.

## 11.3 Line Length

Long explanatory body text should target:

```text
40 to 60 Chinese characters per line（约 640-720px 容器 + 15-16px 正文）
```

45-75 characters was the first draft value and is too wide for Chinese: Chinese glyphs are square and dense, so lines beyond 60 characters fatigue readers quickly. Do not stretch article text across the entire 1440px container.

Article pages（公告、指南、FAQ 答案）use a reading container capped at `max-width: 720px` on desktop, and the standard mobile gutter（§12）on small screens.

## 11.4 Vertical Rhythm and Container Padding

Chinese text needs more vertical breathing room than Latin text.

- body line-height: `1.7` to `1.8` for 14-16px Chinese body text; never below `1.6`
- paragraph spacing: `1.5em` between paragraphs; the last element in a block carries no bottom margin
- heading spacing: `2em` above a heading, `1em` below it（compact panels may tighten to 1.5em / 0.75em）
- metadata（12-13px）line-height: `1.5` to `1.6`
- content container padding: `16px` on mobile, `24px` on desktop（matches §12 gutters）
- compact list rows: `10-12px` vertical spacing（matches §8）
- do not apply `letter-spacing` to Chinese body text. Chinese glyphs are already visually uniform; added tracking reduces readability. `letter-spacing` is allowed only for short Latin labels and all-caps eyebrows, max `0.05em`

## 11.5 Prose (Rich Text) Typography

Announcements, guides, FAQ answers and other long-form content are rendered from rich text / Markdown. They must use a dedicated prose style, never raw component styles.

Approved implementation:

```text
@tailwindcss/typography（prose 类）
- article wrapper: class="prose prose-slate max-w-none"
- dark mode: add dark:prose-invert（与 §7.4 配合）
```

Prose rules:

- body text: 15-16px, line-height 1.75, `--color-text`（亮色 #3F4A5A / 暗色 #D3D9E2）
- heading hierarchy inside articles: h2 -> h3 -> h4 only（h1 is the page title）
- lists: proper `ul` / `ol` with visible markers, `0.5em` between items
- blockquote: 1px left border, muted text; reserved for quotes or callouts
- tables: same divider strategy as §31（subtle dividers, no boxed cells）
- images: follow §38（dimensions reserved, object-fit, lazy load）
- code blocks: only for genuine code or data; monospace stack, prose code styling
- links inside prose: primary-600（亮色）/ primary-400（暗色）with underline
- no emoji decorations, gradient text or floating effects inside prose content（同 §3 硬规则）

Simplified Chinese punctuation and spacing rules inside prose:

- use full-width punctuation（，。：；？！“”‘’）for Chinese text; never half-width commas/periods in Chinese sentences
- line-breaking: punctuation must not open a line（行首禁则：，。！？；：”等不得出现在行首）; verify at 200% zoom
- spacing: no space between Chinese characters; one half-width space between Chinese and Latin/digits（例如 Vue 3 框架、2026 年、第 2 名）
- quotes: use Chinese double quotes “ ” and single quotes ‘ ’ in Chinese text, not straight ASCII quotes
- dash: use Chinese dash ——（两个 em dash 字符）in Chinese prose, not a single em dash
- numbers and dates follow §43 formatting

---

# 12. Layout and Grid

Use CSS Grid for page-level composition.

Prefer:

```text
grid-template-columns
gap
minmax()
```

Avoid complicated flex percentage calculations.

Bad:

```text
width: calc(33.333% - 17px)
```

Good:

```text
grid-template-columns: repeat(3, minmax(0, 1fr))
```

Desktop maximum content width:

```text
1440px
```

Default desktop page gutters:

```text
24px
```

Mobile gutter:

```text
16px
```

---

# 13. Viewport Stability

Do not use:

```css
height: 100vh;
```

for full-height mobile sections.

If a full-height layout is required, prefer:

```css
min-height: 100dvh;
```

This reduces layout jumps caused by mobile browser chrome.

The campus platform generally does not require full-screen hero sections.

---

# 14. Page Action Hierarchy

Each view should have one obvious primary action.

Examples:

Competition Detail:

```text
Primary: 关注竞赛 / 报名入口
Secondary: 查看官网
Tertiary: 分享
```

Organization Recruitment:

```text
Primary: 申请加入
Secondary: 查看组织主页
```

Team Post:

```text
Primary: 申请加入队伍
Secondary: 收藏
```

Do not display four visually equal blue buttons.

---

# 15. Interaction Budget

For core workflows, aim for completion in 3 meaningful interactions after the relevant page is reached.

Examples:

Activity registration:

```text
打开活动详情
-> 报名
-> 确认
```

Team application:

```text
打开组队详情
-> 申请加入
-> 填写并提交
```

Do not create multi-step wizard flows unless the data genuinely needs multiple stages.

---

# 16. Navigation

Desktop Header height:

```text
64 to 68px
```

Navigation:

```text
首页
竞赛
社团组织
组队广场
活动
咨询指南（Q&A）
```

Utilities:

```text
Search
Notifications
Avatar
```

Active route style:

```text
primary text
2px bottom indicator
```

Do not use:

- large filled tab background
- glowing navigation
- icon above every navigation label

Mobile navigation uses a Drawer.

Approved components:

```text
UNavigationMenu
UButton
UAvatar
UDropdownMenu
UDrawer
```

---

# 17. Icon Policy

This is a strict project rule.

## 17.1 One Family

Use:

```text
Lucide through Iconify
```

Do not mix families casually.

## 17.2 Default Sizes

```text
Inline metadata: 14 to 16
Buttons: 16 to 18
Navigation utility: 18 to 20
Quick Entry: 20 to 22
Empty state: 28 to 36
```

## 17.3 Icon Containers

Do not automatically place every icon in a colorful rounded square.

Use icon containers only for:

- Quick Entry
- organization logo fallback
- clearly grouped utility shortcuts

For normal list headings, use the SVG icon directly.

Bad:

```text
[rounded colored square with icon] 通知公告
[rounded colored square with icon] 热门指南
[rounded colored square with icon] 常见问题
```

Preferred:

```text
Bell SVG  通知公告
BookOpen SVG  热门指南
CircleHelp SVG  常见问题
```

---

# 18. Homepage Composition

Homepage baseline:

```text
Header

Hero
├─ Main message
├─ Quick Entry
└─ Campus Carousel

Primary Content
├─ Deadline
├─ Competition
└─ Right Rail
   ├─ Announcements
   └─ Guides

Secondary Content
├─ Team Recruitment
├─ Organization Recruitment
├─ Activities
└─ FAQ

Footer
```

Do not add unrelated dashboard statistics.

Do not add a second carousel below the first.

One hero carousel is the maximum on the homepage.

---

# 19. Carousel

Use:

```text
UCarousel
```

Carousel content:

- important campus theme
- competition campaign
- organization recruitment season
- major activity
- official special topic

Not:

- random promotional graphics
- advertising
- fake achievements
- decorative AI art

Desktop target ratio:

```text
approximately 2.6:1 to 2.9:1
```

Mobile:

```text
approximately 16:9
```

Behavior:

```text
5 to 6 second autoplay
pause on hover
manual arrows
pagination indicators
touch swipe
keyboard accessible
```

If `prefers-reduced-motion` is enabled:

```text
disable autoplay
```

Each slide should contain at most:

- one optional category label
- one headline
- one short supporting sentence
- one optional CTA

Do not put multiple independent buttons on a single slide.

---

# 20. Surface and Card Budget

Before creating a `UCard`, ask:

> Does this content need a card boundary?

Use cards for:

- competition items
- organization items
- Quick Entry
- deadline summaries
- independent activity objects

Use lists for:

- announcements
- FAQ
- guides
- notifications
- compact team recruitment
- operation logs

Use tables for:

- registrations
- management data
- member lists
- audit records

Not everything is a card.

---

# 21. Competition Card

Required information:

```text
competition cover or default cover
competition name
level
individual / team
status
deadline
official website or detail action
```

Optional:

```text
skill / category tags
```

Maximum recommended visible tags:

```text
3
```

Do not fill the card with six or more labels.

A competition card should be scannable within 2 seconds.

---

# 22. Team Recruitment UI

Team recruitment should visually resemble a structured community posting, not a social feed.

Show:

```text
title
competition
current members / target
needed roles
skills
author
publish time
status
```

Primary action:

```text
查看详情
```

Detail page primary action:

```text
申请加入
```

Do not add:

- like count
- follower count
- popularity score
- meaningless ranking
- social reaction emojis

---

# 23. Organization UI

Organization List:

```text
logo
name
organization type
short description
recruitment state
```

Organization Detail may contain:

```text
banner
introduction
direction
leader
recent activities
current recruitment
```

Organizations may have their own brand imagery.

They may not redefine:

- button style
- body font
- global navigation
- form style
- platform spacing system

Brand freedom is contained inside media and organization identity areas.

---

# 24. Badge and Chip Rules

Use `UBadge` for semantic status and short classifications.

Good:

```text
报名中
国家级
团队赛
招新中
已结束
```

Bad:

```text
创新
青春
梦想
热门
推荐
AI
校园
```

unless these are meaningful searchable categories.

Badge budget:

```text
normally <= 3 visible badges per card
```

Avoid stacking multiple badge rows.

---

# 25. Buttons

Primary button:

```text
filled primary blue
```

Secondary:

```text
neutral / outline
```

Tertiary:

```text
text / ghost
```

Danger:

```text
red, only for destructive actions
```

Button labels must describe the action.

Good:

```text
提交申请
保存修改
取消报名
发布招新
```

Bad:

```text
确定
继续
点击这里
GO
Explore
```

when a more specific label is possible.

Icon-only buttons require tooltip for unfamiliar actions.

---

# 26. Forms

Use:

```text
UForm
UFormField
UInput
UTextarea
USelect
USelectMenu
UCheckbox
URadioGroup
UFileUpload
```

Rules:

- visible label above field
- placeholder is example, not label
- required state is clear
- validation message appears near the field
- error state includes text, not only red border
- controls should have consistent height
- submit buttons appear at a predictable location
- large forms are grouped by meaningful sections

Do not put 20 fields into one undifferentiated card.

---

# 27. Modal and Drawer Rules

Modal is suitable for:

- short application
- confirmation
- compact edit
- quick search
- small creation flow

Do not place a large multi-section form inside a small modal.

Use a page or Slideover when content is complex.

Never show an automatic modal on page load for:

- announcements
- newsletter
- "new feature"
- cookie-like marketing
- promotion

Critical notices should use an inline Alert or dedicated notice.

---

# 28. Toast Policy

Toast is for transient confirmation.

Use for:

```text
保存成功
申请已提交
报名已取消
复制成功
```

Do not use Toast for:

- form validation
- long error explanations
- required user decisions
- persistent warnings

Those should remain inline.

---

# 29. Tooltip Policy

Use tooltip when:

- an icon-only control may be unfamiliar
- truncated content needs full text
- a specialized abbreviation needs explanation

Do not use tooltip for obvious buttons that already have labels.

Tooltips must not contain essential workflow information.

---

# 30. Search

Global search is a core utility.

Desktop trigger:

```text
Search icon
Ctrl + K
Cmd + K
```

Recommended implementation:

```text
UModal
UCommandPalette
```

Search domains:

```text
Competition
Organization
Recruitment
Team
Activity
FAQ
Guide
Announcement
```

Result rows should be compact.

Do not convert search results into a masonry card wall.

---

# 31. Tables and Management Views

Operations interfaces are tools, not marketing pages.

Use tables when comparing multiple records.

Approved:

```text
UTable
UPagination
USelect
UInput
UDropdownMenu
```

Table design:

- clear column alignment
- compact but touch-safe row height
- one subtle divider strategy
- avoid both full grid borders and boxed cells
- keep row actions at the end
- destructive actions placed inside overflow menu when appropriate

Do not make admin data a grid of cards just to appear modern.

---

# 32. Motion

Motion exists to communicate state.

Default durations:

```text
hover / active: 120 to 160ms
popover / dropdown: 150 to 200ms
modal / drawer: 200 to 280ms
carousel: 350 to 500ms
```

Recommended easing:

```css
cubic-bezier(.2,.8,.2,1)
```

Allowed:

- button color transition
- border transition
- subtle card shadow
- dropdown fade
- modal fade + small translation
- drawer slide
- carousel transition
- selected tab indicator
- accordion open / close

Avoid:

- elements flying in from multiple directions
- page-load stagger on every section
- mouse-following cards
- magnetic buttons
- excessive parallax
- bouncing icons
- breathing glow
- continuous idle animation

In the V0.1 product milestone prefer:

```text
CSS transitions
Nuxt UI built-in transitions
```

Only introduce Motion when a concrete interaction cannot be handled cleanly without it.

---

# 33. Reduced Motion

All non-essential motion must respect:

```css
@media (prefers-reduced-motion: reduce)
```

Reduced mode should:

- stop autoplay
- remove decorative animation
- shorten or remove large transitions
- keep state changes understandable

---

# 34. Responsive Breakpoints

Use consistent breakpoints:

```text
sm: 640
md: 768
lg: 1024
xl: 1280
2xl: 1536
```

Do not create page-specific arbitrary breakpoints unless necessary.

Desktop:

```text
full header
two-column homepage
4-column competition grid where space allows
```

Tablet:

```text
collapsed navigation
hero becomes vertical
2-column cards
right rail moves below or becomes full width
```

Mobile:

```text
single-column
2 x 2 Quick Entry
16:9 carousel
lists preferred over mini-card grids
filters open in Drawer
primary action may use sticky bottom action bar
```

Mobile is not the desktop page shrunk.

---

# 35. Touch Targets

Minimum practical touch target:

```text
44 x 44 CSS px
```

标准 button、input 与 select 的交互高度固定为 44px。Checkbox 与 Radio 的可见
indicator 可以保持 16–20px，但包含 indicator 与 label 的整行可点击区域高度不得低于
44px；纯文本链接在作为独立操作时也使用至少 44px 的交互高度。

Small icon geometry may be 18px, but clickable area should remain large enough.

Do not place multiple tiny actions with 4px gaps on mobile.

---

# 36. Accessibility

Accessibility is a merge requirement.

Required:

- semantic HTML
- keyboard navigation
- visible focus state
- logical tab order
- `aria-label` on icon-only controls
- modal focus trap
- escape closes dismissible overlay
- image alt text
- form labels
- readable color contrast
- status not communicated by color alone
- 200% browser zoom remains usable
- reduced-motion support

Never globally apply:

```css
outline: none;
```

without a replacement focus style.

Target:

```text
WCAG AA for core UI, verified in both light and dark modes
```

Dark mode is not exempt: run the same contrast, keyboard and zoom checks on the `.dark` token set（见 §7.4）before merge.

---

# 37. Focus State

Focus must be visible.

Recommended style:

```text
2px primary ring
2px offset where needed
```

Hover is not a replacement for focus.

Keyboard users must be able to identify:

- current navigation
- active input
- focused card link
- selected menu option
- dialog actions

---

# 38. Image Rules

Prefer real assets:

- campus
- event photography
- official competition banners
- organization logo
- activity photos

Use generated imagery only when no authentic media exists.

Avoid turning the entire platform into an AI-image gallery.

Image delivery:

```text
WebP / AVIF where possible
explicit width and height
object-fit: cover
lazy load below fold
responsive source size
```

Reserve image space to reduce layout shift.

---

# 39. Default Competition Covers

If an official competition banner does not exist:

Use a controlled system template.

A default cover may contain:

```text
competition name
one category treatment
subtle brand geometry
```

Do not generate a random futuristic AI illustration for every competition.

All default covers should feel like one family.

---

# 40. Empty States

Use:

```text
UEmpty
```

Empty states must be factual.

Good:

```text
暂时没有正在招募的队伍
你可以发布新的组队信息。
[发布组队]
```

Bad:

```text
这里空空如也
宇宙正在等待你的第一步
```

Do not use emoji illustrations.

Use a small SVG icon if needed.

---

# 41. Loading States

Prefer:

```text
USkeleton
```

Skeleton should approximately match the target layout.

Avoid full-page spinner for normal list pages.

Do not use AI shimmer effects for ordinary content.

---

# 42. Error States

Errors should be actionable.

Bad:

```text
Something went wrong.
```

Good:

```text
活动列表加载失败。
请检查网络后重试。

[重新加载]
```

HTTP-level error pages:

```text
403
404
500
```

should use the same platform design system.

---

# 43. Content Writing

Use direct campus service language.

Good:

```text
查看竞赛
还有 3 天截止
报名已结束
申请加入
提交咨询
你的申请已通过
```

Avoid marketing copy:

```text
开启你的无限科创旅程
智启未来
释放无限潜力
探索无界可能
```

UI should communicate facts.

Language details（简体中文写作规范，配合 §0.1 语言政策）:

- numbers and dates use Chinese formatting: 2026年8月25日、3 天、第 2 名
- keep Latin terms intact where they are proper nouns: ACM 竞赛、Vue 3、Web 前端
- do not write English sentence structure inside Chinese copy（例如不要出现半角逗号分隔的中文短句）
- button labels must be concrete Chinese verbs: 提交申请、取消报名、保存修改（见 §25）
- status and deadline copy states facts: 报名中、还有 3 天截止、报名已结束
- no Traditional Chinese characters in product copy（繁体仅允许出现在引用的专有名词中）

---

# 44. Truncation

Do not truncate important primary content unnecessarily.

For compact cards:

```text
title: max 2 lines
description: max 2 to 3 lines
```

When full text is required:

- provide detail page
- or accessible tooltip when appropriate

Never truncate dates or core status.

---

# 45. Lists and Dividers

Long lists should not resemble spreadsheet prison bars.

Prefer:

```text
single bottom divider between rows
```

Avoid:

```text
border top + border bottom on every row
boxed row inside boxed panel
```

Use whitespace and typography to create hierarchy.

---

# 46. Progress Bars

Do not use progress bars as decoration.

Use only for real progress:

```text
registration capacity
upload
multi-step completion
```

Do not use fake progress bars for:

```text
skill level
competition popularity
organization influence
```

---

# 47. Data Integrity in UI

Do not invent demo metrics on production-like screenshots.

If mock data is used:

- mark it as fixture / mock in development
- do not present fake numbers as official statistics
- prefer realistic structured examples over inflated counts

This matters because the product is a trusted campus information platform.

---

# 48. Student and Operations Surfaces

Student interface:

```text
more visual
more content discovery
more cards and lists
```

Operations interface:

```text
more tables
more filtering
more forms
more compact density
```

They share the same:

- colors
- typography
- buttons
- badges
- form controls
- modals
- icons
- spacing system

Do not build a visually unrelated admin theme.

---

# 49. Business Components

Recommended component structure:

```text
src/
├─ components/
│  ├─ app/
│  │  ├─ AppHeader.vue
│  │  ├─ AppFooter.vue
│  │  ├─ AppLogo.vue
│  │  └─ GlobalSearch.vue
│  │
│  ├─ home/
│  │  ├─ HomeHero.vue
│  │  ├─ HomeCarousel.vue
│  │  ├─ QuickEntry.vue
│  │  └─ DeadlineGrid.vue
│  │
│  ├─ competition/
│  │  ├─ CompetitionCard.vue
│  │  ├─ CompetitionListItem.vue
│  │  ├─ CompetitionFilters.vue
│  │  └─ CompetitionTimeline.vue
│  │
│  ├─ team/
│  │  ├─ TeamPostItem.vue
│  │  └─ TeamApplicationModal.vue
│  │
│  ├─ organization/
│  │  ├─ OrganizationCard.vue
│  │  ├─ RecruitmentItem.vue
│  │  └─ RecruitmentApplication.vue
│  │
│  ├─ activity/
│  │  ├─ ActivityCard.vue
│  │  └─ ActivityRegistrationModal.vue
│  │
│  └─ common/
│     ├─ SectionHeader.vue
│     ├─ StatusBadge.vue
│     ├─ EmptyState.vue
│     ├─ ErrorState.vue
│     └─ DeadlineText.vue
```

Do not create one giant `HomePage.vue` containing the entire interface.

---

# 50. Component Ownership

A component should exist when:

- it is repeated
- it has its own interaction
- it has multiple visual variants
- it represents a business concept
- it has non-trivial responsive behavior

Do not extract every five-line markup block into a component.

Avoid both extremes:

```text
one 2000-line page
```

and:

```text
100 tiny meaningless wrapper components
```

---

# 51. Tailwind Usage

Prefer semantic composition.

Avoid large strings of unexplained arbitrary values.

Good:

```text
gap-4
px-4
py-3
rounded-lg
text-sm
```

Use arbitrary values only for design tokens or documented edge cases.

If a pattern repeats, create:

- a component
- a variant
- a semantic CSS variable
- or a Tailwind layer utility

Do not copy 25 identical utility classes across 12 files.

---

# 52. Theme Configuration

Primary design values should be configured centrally using:

```text
Nuxt UI theme / app config
Tailwind theme
CSS custom properties
```

plain Vue + Vite 的 Nuxt UI role token 对照如下：

```text
Project token          Nuxt UI token
--color-surface        --ui-bg
--color-surface-subtle --ui-bg-muted / --ui-bg-accented
--color-text           --ui-text / --ui-text-toned
--color-text-strong    --ui-text-highlighted
--color-text-muted     --ui-text-muted
--color-text-disabled  --ui-text-dimmed
--color-border         --ui-border / --ui-border-muted
--color-border-strong  --ui-border-accented
--color-danger         --ui-error
```

`--color-canvas` 用于页面 body 背景，不映射为 `--ui-bg`；`--ui-bg` 保持 surface 语义，避免普通 Nuxt UI 组件错误消费页面画布色。

Do not redefine the blue color separately in:

```text
HomePage
CompetitionPage
ActivityPage
AdminPage
```

---

# 53. Semantic HTML

Use native elements first.

Examples:

```text
nav
header
main
section
article
aside
footer
button
a
form
label
table
```

Do not use clickable `<div>` when a `<button>` or `<a>` is correct.

Native semantics reduce accessibility and keyboard bugs.

---

# 54. External Links

Official competition websites and external resources use:

```text
ExternalLink SVG
```

External links should have clear visual indication when context matters.

Do not use plain `↗` Unicode glyph as the only indicator.

---

# 55. Destructive Actions

Examples:

```text
delete recruitment
remove organization member
cancel activity
disable account
```

Rules:

- danger color only on actual destructive actions
- require confirmation when consequences are significant
- confirmation copy describes the consequence
- primary confirm button explicitly names the action

Good:

```text
删除招新
```

Bad:

```text
确定
```

---

# 56. Responsive Content Priority

When space decreases, remove decorative information before functional information.

Priority order:

1. title
2. status
3. deadline / time
4. main action
5. essential metadata
6. tags
7. descriptive supporting content
8. decorative media

Never hide the deadline while preserving a decorative image.

---

# 57. Performance Rules

The UI should remain usable on ordinary student phones and mobile networks.

Requirements:

- route-level code splitting
- lazy-load below-fold images
- do not preload all carousel images at full resolution
- use WebP / AVIF
- set image dimensions
- limit homepage media
- icon tree-shaking / on-demand loading
- pagination for large lists
- avoid heavy animation dependency
- avoid duplicate component libraries
- Nginx caches built static assets

The V0.1 milestone should not require a high-end phone for smooth scrolling.

---

# 58. No Layout Shift by Default

For:

- banner
- avatar
- competition cover
- organization logo
- image
- skeleton

reserve dimensions before content loads.

Avoid large CLS caused by late-loading images.

---

# 59. Review Workflow

A new page is not considered complete when it only compiles.

Review requires:

1. functional flow
2. desktop render
3. mobile render
4. keyboard navigation
5. loading state
6. empty state
7. error state
8. design token compliance
9. icon policy compliance
10. visual comparison with approved design

---

# 60. Frontend Merge Checklist

Before merging a UI change:

## Design System

- [ ] Uses Nuxt UI where a standard component already exists
- [ ] Uses project tokens
- [ ] No random hardcoded color
- [ ] No random radius
- [ ] No second component library
- [ ] New reusable pattern is extracted appropriately
- [ ] Dark mode verified（§7.4 token 映射生效，页面无硬编码暗色值）
- [ ] Simplified Chinese copy（简体中文、全角标点、日期格式符合 §0.1 与 §43）

## Iconography

- [ ] No emoji used as product icon
- [ ] UI icons use Lucide via Iconify
- [ ] No Unicode arrows used as icon substitutes
- [ ] Common icons are not hand-drawn
- [ ] Icon-only actions have `aria-label`
- [ ] Icon sizes and stroke weight are consistent

## AI-Tell Audit

- [ ] No unnecessary purple gradient
- [ ] No glassmorphism
- [ ] No gradient text
- [ ] No fake metrics
- [ ] No decorative status dots
- [ ] No excessive pills
- [ ] No nested card maze
- [ ] No generic feature-card grid without product reason
- [ ] No scroll cue
- [ ] No decorative shimmer

## Interaction

- [ ] One clear primary action per view
- [ ] Core task path is short
- [ ] Hover is not required to discover essential actions
- [ ] Touch targets are large enough
- [ ] Destructive action is clearly labeled

## Accessibility

- [ ] Keyboard reachable
- [ ] Focus visible
- [ ] Correct semantic element
- [ ] Images have alt text
- [ ] Forms have labels
- [ ] Error text is readable and specific
- [ ] State is not conveyed by color alone
- [ ] Reduced motion respected
- [ ] Page remains usable at 200% zoom

## Responsive

- [ ] Desktop checked
- [ ] Tablet checked
- [ ] Mobile checked
- [ ] No horizontal overflow
- [ ] Long Chinese text tested
- [ ] Navigation collapse tested
- [ ] Modal / Drawer works on touch device

## States

- [ ] Loading state
- [ ] Empty state
- [ ] Error state
- [ ] Disabled state where relevant
- [ ] Success feedback where relevant

## Performance

- [ ] Images compressed
- [ ] Dimensions reserved
- [ ] No unnecessary dependency added
- [ ] No huge initial API response
- [ ] No unnecessary animation library

---

# 61. Current Design Baseline

The approved visual baseline remains:

> GitHub Education style trust and clarity + Devpost competition-oriented information architecture + campus public-service usability.

The updated implementation rule is stricter than the first draft:

- no emoji UI
- SVG icon system only
- one icon family
- no random hand-authored common SVG icons
- no decorative status dots
- fewer pills
- fewer cards
- more lists and tables where content demands it
- strict design token usage
- accessible focus and keyboard behavior
- clear primary action
- purposeful motion only
- mobile-first task verification
- rendered visual review before completion

The system should feel:

```text
credible
useful
structured
young
calm
maintainable
```

It should not feel:

```text
AI-generated
promotional
over-designed
dashboard-for-everything
template-driven
```

---

# 62. Next Implementation Step

Before designing more pages, update the existing homepage prototype to comply with this document.

Specifically replace any remaining:

```text
Emoji section markers
Unicode arrows used as icons
one-off inline SVG common icons
hardcoded visual values that should become tokens
```

Then rebuild the homepage as real Vue components with Nuxt UI and Iconify.

Recommended first implementation order:

```text
Theme Tokens（亮色 + 暗色，§7）
AppLogo
AppHeader
GlobalSearch
HomeCarousel
QuickEntry
SectionHeader
StatusBadge
CompetitionCard
CompactList
AppFooter
```

Once those shared components are stable, build:

```text
Homepage
Competition List
Competition Detail
Team Plaza
Organization List
Organization Detail
Activity List
Activity Detail
```

After those pages are visually stable, connect Django REST APIs.

---

# 63. Source Principle Summary

The following open-source frontend skill patterns were intentionally adapted:

**Anthropic frontend-design**
- intentional visual direction
- avoid generic AI aesthetics
- production-grade quality
- visual decisions must serve the specific brief

**ByteDance DeerFlow frontend-design**
- real working frontend, not static design-only output
- deliberate design direction
- production quality
- responsive and cohesive implementation

**Microsoft frontend-design-review**
- design-system compliance
- design token usage instead of hardcoded values
- efficient task completion (≤3 interactions, one clear primary action)
- responsive design checks
- accessibility review
- blocking / major / minor issue grading
- avoid generic AI aesthetics

Source: https://github.com/microsoft/skills/blob/main/.github/skills/frontend-design-review/SKILL.md

**Strict anti-template frontend skills**
- discourage emoji in product UI
- use a coherent icon family
- replace symbols with SVG icon components
- avoid decorative status dots
- avoid card-grid-of-nothing
- avoid default gradient and glass treatments
- responsive behavior and dependency verification as engineering requirements

These references are principles, not code dependencies.

The project remains governed by this document and the actual product requirements.
