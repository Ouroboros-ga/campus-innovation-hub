# API Map — campus-auto-ops

严格遵守服务端 StrictSerializer，不发送未声明字段。

## Agent Context

```http
GET /api/ops/agent/context
```

## Homepage

```http
GET   /api/ops/homepage
PATCH /api/ops/homepage
```

Scopes：

```text
homepage:read
homepage:write
```

PATCH 必须完整发送：

```json
{
  "featured_competitions": [],
  "featured_announcements": [],
  "featured_guides": [],
  "featured_faqs": []
}
```

最大：竞赛 8、公告 6、指南 6、FAQ 6。

## Banner

```http
GET  /api/ops/banners
POST /api/ops/banners
GET  /api/ops/banners/{id}
PATCH /api/ops/banners/{id}
```

Scopes：`banner:read` / `banner:write`

Create：

```json
{
  "title": "2026 秋季科创活动季",
  "subtitle": "竞赛 · 活动 · 招新",
  "category_label": "校园推荐",
  "image_asset_id": "uuid",
  "alt_text": "科创活动季首页横幅",
  "link_type": "INTERNAL",
  "internal_path": "/competitions/<uuid>",
  "external_url": null,
  "start_at": "2026-09-01T00:00:00+08:00",
  "end_at": "2026-10-01T00:00:00+08:00",
  "is_active": true,
  "sort_order": 0
}
```

`link_type`: `NONE | INTERNAL | EXTERNAL`

## Competition

目标 Agent endpoints：

```http
GET    /api/ops/competitions
POST   /api/ops/competitions
GET    /api/ops/competitions/{id}
PATCH  /api/ops/competitions/{id}
POST   /api/ops/competitions/{id}/publish
POST   /api/ops/competitions/{id}/timeline-events
PATCH  /api/ops/competitions/{id}/timeline-events/{event_id}
```

Scopes：

```text
competition:read
competition:write
competition:publish
```

不对 Agent 开放：`cancel / archive / import / timeline DELETE / 单条 featured`

Create 最少：

```json
{
  "name": "赛事名称",
  "edition": "2026 / 第十七届",
  "category": "PROGRAMMING",
  "level": "NATIONAL",
  "participation_mode": "INDIVIDUAL",
  "description_md": "基于官方资料整理的赛事简介。",
  "college_organized": false
}
```

Optional：

```text
suitable_grade_min
suitable_grade_max
direction
summary
suitable_for_md
preparation_advice_md
registration_start_at
registration_end_at
event_start_at
event_end_at
college_contact_name
college_contact_text
official_url
registration_url
official_notice_url
cover_asset_id
```

Enums：

```text
category: AI | PROGRAMMING | INNOVATION | MATHEMATICAL_MODELING | ELECTRONICS | ROBOTICS | OTHER
level: SCHOOL | PROVINCIAL | NATIONAL | INTERNATIONAL | OTHER
participation_mode: INDIVIDUAL | TEAM
```

Timeline：

```json
{
  "title": "报名截止",
  "event_at": "2026-09-30T23:59:00+08:00",
  "end_at": null,
  "description": "以官方报名系统为准",
  "sort_order": 0
}
```

只有来源给出足够精确时间时创建。

## Activity

目标：

```http
GET   /api/ops/activities
POST  /api/ops/activities
GET   /api/ops/activities/{id}
PATCH /api/ops/activities/{id}
POST  /api/ops/activities/{id}/publish
```

Scopes：`activity:read / activity:write / activity:publish`

不开放：`cancel / archive / close-registration / registrations / export / activity-with-announcement`

Create：

```json
{
  "title": "活动标题",
  "activity_type": "TECH_SHARING",
  "summary": "简洁摘要",
  "description_md": "活动介绍",
  "organizer_organization_id": null,
  "organizer_name": "主办方",
  "speaker": null,
  "location": "明确地点或线上方式",
  "start_at": "2026-09-10T14:00:00+08:00",
  "end_at": "2026-09-10T16:00:00+08:00",
  "registration_required": false,
  "registration_start_at": null,
  "registration_end_at": null,
  "capacity": null,
  "notes_md": null,
  "cover_asset_id": null
}
```

ActivityType：

```text
COMPETITION_BRIEFING
TECH_SHARING
RESEARCH_LECTURE
FURTHER_STUDY
ENTERPRISE
TRAINING
OTHER
```

`registration_required=false` 时报名时间与 capacity 必须为 null。

## Announcement

目标：

```http
GET   /api/ops/announcements
POST  /api/ops/announcements
GET   /api/ops/announcements/{id}
PATCH /api/ops/announcements/{id}
POST  /api/ops/announcements/{id}/publish
```

Scopes：`content:read / content:write / content:publish`

Create：

```json
{
  "title": "通知标题",
  "summary": "摘要",
  "body_md": "正文",
  "publisher_scope": "ACADEMY",
  "external_url": "https://official.example/notice",
  "is_pinned": false,
  "competition_id": null,
  "activity_id": null,
  "organization_id": null,
  "recruitment_id": null
}
```

`publisher_scope`: `ACADEMY | UNIVERSITY | PLATFORM`。最多关联一个核心对象。

## Guide

目标：

```http
GET   /api/ops/guides
POST  /api/ops/guides
GET   /api/ops/guides/{id}
PATCH /api/ops/guides/{id}
POST  /api/ops/guides/{id}/publish
```

Create：

```json
{
  "title": "大学生竞赛参与指南",
  "category": "COMPETITION",
  "summary": "面向首次参赛学生的流程说明",
  "body_md": "...",
  "competition_ids": [],
  "is_featured": false,
  "featured_order": 0
}
```

Category：

```text
COMPETITION
RESEARCH
FURTHER_STUDY
CERTIFICATE
PROCESS
EXPERIENCE
OTHER
```

## FAQ

目标：

```http
GET   /api/ops/faq
POST  /api/ops/faq
GET   /api/ops/faq/{id}
PATCH /api/ops/faq/{id}
POST  /api/ops/faq/{id}/publish
```

Create：

```json
{
  "category": "COMPETITION",
  "question": "如何找到适合自己的竞赛？",
  "answer_md": "...",
  "sort_order": 0,
  "is_featured": false,
  "featured_order": 0
}
```

## Media Upload

建议专门：

```http
POST /api/ops/media/upload
Scope: media:upload
Content-Type: multipart/form-data
```

Fields：

```text
file=<binary>
kind=IMAGE
```

返回 `id` 和 `url`。

不要通过 `/api/media/upload` 绕过 Ops scope。

## Public Verification

最终 smoke 用公开 API：

```http
GET /api/home
GET /api/competitions
GET /api/competitions/{id}
GET /api/activities
GET /api/activities/{id}
GET /api/announcements
GET /api/announcements/{id}
GET /api/guides
GET /api/guides/{id}
GET /api/faqs
```

## Errors

```text
400 VALIDATION_ERROR
401 AUTH_REQUIRED
403 PERMISSION_DENIED
404 NOT_FOUND
429 RATE_LIMITED
5xx server error
```

403 不绕过。
