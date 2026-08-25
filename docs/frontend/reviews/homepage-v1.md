# 首页 V1 评审记录（Homepage V1 Review）

> 任务：FE-013 首页集成与视觉门禁
> 日期：2026-08-26
> 对象：`frontend/src/pages/home/HomePage.vue` 及其首页区块（FE-006 ~ FE-012）
> 对照：`docs/frontend/FrontendDesign.md`、已批准参考图（ChatGPT 参考图）、`docs/product/PageMap.md`

## 评审范围

- 桌面端（≈1440px）、平板（≈768px）、移动端（≈390px）
- 暗色模式（`§7.4` token 映射）
- 检查项：层级、间距、图标一致性、无 emoji、无通用 AI 模式、截止时间可读性、轮播、导航、搜索、焦点、溢出、控制台、简体中文文案、暗色模式

## 验证方法（如实说明）

本次「视觉门禁」受环境限制：

- 已执行 `pnpm check`：`74/74` 测试、lint、typecheck、build 全部通过。
- 已用无头 Chrome `--dump-dom` 抓取渲染后 DOM（约 334KB），确认 8 个首页区块标题（即将截止 / 热门竞赛 / 通知公告 / 热门指南 / 正在组队 / 正在招新的组织 / 近期活动 / 常见问题）全部在渲染结果中，且无 `NaN` / `undefined` 泄漏。
- 未完成像素级 / 截图级视觉对比：环境代理策略拒绝 headless Chrome 子进程访问本地回环（`--screenshot` / `--headless=new` 被拦截），无法产出真实视觉图。因此**间距、配色、比例、对比度等上的逐像素核验未完成**，相关结论主要基于代码审查与 DOM 结构检查。

> 说明：本记录中「通过」仅代表 **代码检查 + DOM 结构 + 测试** 层面的符合度，不代表像素级一致。

## 结论分类

### Blocking（阻断）

- 无。未发现会阻断首页渲染或违反已接受设计规则的阻塞问题。

### Major（重要，建议后续处理）

1. **手机端信息顺序 vs §18.2 / PageMap**
   当前手机端顺序为「精简 Hero → 快捷入口 2×2 → 校园轮播 16:9 → 即将截止 → 热门竞赛 → …」。`FrontendDesign.md §18.2 / PageMap` 要求 `即将截止` **优先于**大图轮播（action/deadline 先行，轮播后移）。
   处置：按用户 2026-08-25 的明确指示（"把'即将截止'这一栏放在下面"）保留为**已确认偏差**。建议在后续手机端专项评审中评估是否将截止区块上移。

2. **数据区缺少 loading / empty / error 状态（§40–§42）**
   首页各区块直接消费 fixtures，未实现加载中 / 空 / 错误态。Mock-first 阶段可接受；接入 API（FE-100+）前需补齐（如 `USkeleton` / `UEmpty` / 可操作错误态）。

3. **控制台路由警告（mock 阶段预期）**
   首页列表 / 竞赛卡 / 搜索结果的详情目标路由（`/competitions/<id>`、`/announcements`、`/qa/...` 等）尚未建立，渲染时产生 `[VUE_ROUTER_R0004] No match found` 警告。属 mock 阶段预期，需在对应 FE-0xx 建立路由后消除；不阻断当前版。

### Minor（次要）

1. **紧凑日期格式与 §43 的差异**
   列表 / 卡片使用 `YYYY.MM.DD`（如 `2026.08.31`），与 `§43` 示例的 `2026年8月31日` 不一致；但与已批准参考图一致（参考图即用点号日期），保留。

2. **竞赛默认封面使用渐变式网格纹理**
   `CompetitionCard` 默认封面以 `repeating-linear-gradient`（8% 白、135°）作 `§39` 允许的「subtle brand geometry」。非多色 AI 渐变，可接受；如需更克制可后续改为纯色 + 分类几何。

3. **`查看全部` 等小号链接触控目标偏小**
   区块头 `查看全部` 链接为 `text-sm`，高度约 20px，低于 `§35` 的 44px 触控目标；移动端建议加大内边距。

4. **走查项确认**
   - 图标：全站 Lucide（`i-lucide-*`），单一图标家族，无 emoji、无 Unicode 箭头。
   - 层级：桌面分栏 Hero → 主栏（截止/竞赛/社区三列）→ 右侧栏（公告/指南/FAQ），与 §18.1 一致。
   - 暗色：本轮修复了图标芯片在暗色下使用未映射的浅色 token（`bg-primary-50` → `dark:bg-primary-950/40`，图标 `dark:text-primary-400`），组件消费 token、无页面级硬编码暗色样式。
   - 截止可读性：剩余时间用文字 + 语义色（`text-danger-600 dark:text-danger-500`），日期不截断。
   - 焦点：全局 `:focus-visible` 轮廓于 `main.css`，Nuxt UI 组件自带焦点样式。

## 本轮已修复

- 暗色模式：6 处首页图标容器（QuickEntry、正在组队、正在招新的组织、近期活动、热门指南、常见问题）补 `dark:bg-primary-950/40`，图标补 `dark:text-primary-400`，与 `MobileNavigation` 既有暗色模式一致，消除暗色下浅色药丸问题。

## 结论

- **可用的视觉门禁结论：首页在结构、内容正确性、与参考图桌面构图的符合度上通过；在像素级 / 暗色实际观感上未完成截图核验（环境限制）。**
- 无 Blocking；Major 3 项（1 项为用户已确认偏差，2 项为 mock/API 阶段可后置）；Minor 4 项。
- 建议把 Major 1（手机端顺序）与 Minor 3（触控目标）纳入后续手机端专项，Major 2/3 在 API 与列表页任务中落实。

> 结束语：不声称 `fully verified / pixel perfect / production ready`；本轮为结构 + 功能 + 内容层面的首轮门禁。
