# MobileWebHandoff.md

> 用途：把最新版文档交给 coding agent 时的执行入口。  
> 本文件不是新的设计事实来源；实际规则以 AGENTS.md、FrontendDesign.md、FrontendArchitecture.md、PageMap.md 和 ImplementationPlan 为准。

## Coding Agent Assignment

```text
执行 FE-004M（如果 FE-004 尚未完成，则执行最新版 FE-004，而不是重复执行 FE-004M）。

开始前必须阅读：
- AGENTS.md
- docs/frontend/FrontendDesign.md
- docs/frontend/FrontendArchitecture.md
- docs/frontend/FrontendImplementationPlan.md 中 FE-004 / FE-004M
- docs/product/PageMap.md
- docs/product/PRD.md

先检查当前仓库与现有 App Shell，不要重写无关业务。

目标：
把当前 Web 前端升级为正式 Responsive Mobile Web：

Phone <768px
- Root pages 使用五项 Bottom Navigation：首页 / 竞赛 / 组队 / 活动 / 我的
- Detail / Form pages 隐藏全局 Bottom Navigation
- 实现 MobilePageHeader 与可复用 MobileActionBar
- 处理 safe-area-inset-bottom
- 处理 100dvh 需要场景
- 不依赖 hover

Tablet 768–1023px
- Compact Header
- Drawer Navigation
- 不使用 Phone Bottom Navigation

Desktop >=1024px
- 保留现有顶部导航和已批准视觉

不要：
- 修改 API contract
- 修改 database schema
- 引入 Capacitor
- 引入 uni-app / Taro
- 创建 /mobile 重复路由
- 启动下一 FE task

验证：
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm build
- 360 / 390 / 430 / 768 / 1024 / 1440 渲染检查
- Phone Root / Detail / Form 三种 Shell
- Safe Area
- Light / Dark
- Console errors
- Primary navigation interactions

完成后按 AGENTS.md Completion Report 汇报并停止。
```
