# Research Policy — Web Search 与事实核验

## 1. Source Classes

### A. PRIMARY_OFFICIAL
最高优先级：

- 竞赛主办方官网；
- 官方报名系统；
- 教育部 / 政府 / 主办单位正式页面；
- 学校官网；
- 学院官网；
- 官方校内通知平台。

适合支持名称、届次、报名时间、比赛时间、资格、官方入口、校园活动时间地点。

### B. OFFICIAL_SECONDARY

- 主办单位官方公众号可访问正式页；
- 其他高校完整转载的原始官方通知；
- 官方合作机构公告。

用于交叉验证。

### C. REPUTABLE_SECONDARY

高校新闻、权威媒体、高质量赛事介绍。只能辅助理解，不能独立决定截止日期等高风险字段。

### D. DISCOVERY_ONLY

搜索结果摘要、CSDN、知乎、小红书、贴吧、培训机构、商业聚合站、主体不明网站。只能发现关键词，不能作为最终事实来源。

## 2. Search Workflow

1. broad discovery
2. 找 canonical official page
3. 打开正文
4. 逐字段抽取事实
5. 高风险字段交叉验证
6. 冲突解析

示例 query：

```text
"蓝桥杯" 2026 官方 报名
"全国大学生数学建模竞赛" 2026 官方 通知
site:edu.cn "<赛事名>" 2026
site:<学校官方域名> 2026 人工智能学院 活动
```

## 3. High-risk Fields

```text
registration_start_at
registration_end_at
event_start_at
event_end_at
location
eligibility
报名费用 / 资格规则
```

若有第二个官方来源，应交叉验证。

冲突优先级：

```text
最新官方通知
>
官方报名系统当前页面
>
主办方年度规则
>
学校转载通知
>
其他来源
```

无法确认就 unknown。

## 4. Freshness

旧届页面可解释赛事定位，不能直接作为当前届日期依据。

当前届次、报名入口、截止时间必须重新核验。

## 5. Dates

国内高校 / 国内赛事未标时区时按 `Asia/Shanghai` 理解。

API 使用 ISO 8601：

```text
2026-09-30T23:59:00+08:00
```

如果只写“9 月底”“预计 10 月”，不要伪造精确时间。

如果只给日期但没给时刻，不自动补 23:59，除非项目已有明确日末规则。

## 6. Competition Mapping

Category：

```text
AI
PROGRAMMING
INNOVATION
MATHEMATICAL_MODELING
ELECTRONICS
ROBOTICS
OTHER
```

Level：

```text
SCHOOL
PROVINCIAL
NATIONAL
INTERNATIONAL
OTHER
```

Participation：

```text
INDIVIDUAL
TEAM
```

不要因为名字里出现“全国”就偷懒推断当前参赛阶段。

## 7. Activity Standard

Activity 必须同时有：

```text
明确名称
明确时间
明确地点 / 线上方式
明确主办主体
明确可参与对象
官方来源
```

缺关键项就跳过。

## 8. Content Synthesis

允许转述，不允许长篇复制。

经验建议和官方要求必须语言区分：

```text
建议...
可优先...
```

vs.

```text
官方通知明确...
本届规则要求...
```

## 9. Provenance Artifact

写：

```text
artifacts/campus-auto-ops/research-YYYYMMDD-HHMMSS.json
```

每条包括 source URL、source class、checked_at、supports、confidence、conflicts、unknown_fields。

HIGH 可以进入草稿。LOW 默认跳过。

## 10. Never Fabricate to Fill UI

“首页太空”“去年有”“通常会举办”都不是造数据的理由。

0 条真实活动，比 4 条漂亮假活动更好。
