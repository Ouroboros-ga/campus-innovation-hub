# Initialization Runbook — 第一次真实内容初始化

目标是建立一批真实、当前、可验证、对人工智能学院学生有用的初始内容，不是把数据库填满。

## Phase A — Capability & Inventory

1. GET Agent Context；
2. 检查 scopes；
3. capability probe；
4. GET 当前 competitions / activities / announcements / guides / faq / homepage / banners；
5. 保存 inventory。

已有真实内容不清空、不覆盖、不批量归档，采取 merge。

## Phase B — Research Plan

研究窗口：

```text
过去 30 天仍有效通知
+
未来 6~12 个月明确赛事
+
当前报名 / 即将报名
```

首次建议量：

```text
Competition: 8~12
Activity: 0~8，真实多少录多少
Announcement: 3~8
Guide: 3~6
FAQ: 5~10
Banner: 0~4
```

不是 KPI，证据不足就少录。

## Phase C — Competition Research

重点领域：

```text
编程 / 算法
AI
数学建模
创新创业
机器人
电子
软件工程 / 服务外包
```

必须通过 Web Search 发现当前真实届次。

示例发现 query：

```text
2026 全国大学生 程序设计 竞赛 官方 报名
2026 人工智能 大学生 竞赛 官方
2026 数学建模 大学生 官方 报名
2026 创新创业 大学生 竞赛 官方 通知
2026 服务外包 创新创业 大赛 官方
2026 蓝桥杯 官方 通知
```

这些 query 不代表必须录入某一赛事。

## Phase D — Campus Activity Research

先搜学校官网、学院官网、正式校内通知。

```text
site:<official-domain> 2026 人工智能学院 讲座
site:<official-domain> 2026 竞赛 说明会
site:<official-domain> 2026 科研 项目 讲座
site:<official-domain> 2026 培训
```

找不到达到标准的当前活动就录 0 条。

## Phase E — Create Drafts

顺序：

```text
Competition
↓
Competition Timeline
↓
Activity
↓
Announcement
↓
Guide
↓
FAQ
```

Announcement / Guide 因此可以引用前面真实 UUID。

每个 POST 后：

1. 保存 ID；
2. GET 回读；
3. 比较核心字段；
4. 记录 X-Request-Id。

## Phase F — Quality Check

Competition：
- 当前官方届次；
- 无 name+edition 重复；
- official URL 可访问；
- 时间无旧届误用；
- college_organized 未误标 true。

Activity：
- 当前 / 未来；
- 时间地点主办真实；
- registration 字段一致。

Announcement：
- publisher_scope 不冒充；
- external_url 正式；
- 关联 UUID 正确。

Guide：
- 有参考来源；
- 建议与官方规则分离。

FAQ：
- 长期稳定；
- 不塞短期日期。

## Phase G — Publish

AUTO_PUBLISH=false 时一次性给发布清单，用户确认后再发布。

LOW confidence 永不发布。

## Phase H — Homepage Curation

发布后重新 GET `/api/ops/homepage`。

首次可选：

```text
Featured Competition: 4~6
Announcement: 3~5
Guide: 3~5
FAQ: 3~5
```

PATCH 必须完整四组数组。

自动聚合模块不改。

## Phase I — Banner

检查 `CAMPUS_OPS_ASSET_DIR` 或已有 MediaAsset。

只有“合法图片 + 已存在跳转对象 + 链接通过 + 内容当前有效”才创建。

否则 0 Banner 可接受。

## Phase J — Public Smoke Test

用公开 API 验证首页、竞赛、活动、通知、指南、FAQ。

检查 UUID 路由、外链、时间状态。

## Phase K — Artifact

```text
artifacts/campus-auto-ops/init-YYYYMMDD-HHMMSS/
├ inventory.json
├ research.json
├ actions.json
└ summary.md
```

不得保存 Authorization。
