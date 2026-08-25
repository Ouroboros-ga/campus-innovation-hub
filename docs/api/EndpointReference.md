# EndpointReference.md

> 产品：人工智能学院科创与就业服务平台
> 文档版本：1.0
> 状态：V0.1 API 详细参考（待后端实现）
> 规范总览：[`APIContract.md`](APIContract.md)
> 字段与持久化约束：[`../backend/database-design.md`](../backend/database-design.md)
> 产品行为：[`../product/PRD.md`](../product/PRD.md) 与 [`../product/PageMap.md`](../product/PageMap.md)

---

# 0. 使用边界

本文件把 `APIContract.md` 的端点总览展开为实现和联调可用的 HTTP 契约。每个端点均明确：

```text
method / path
权限
Query 或 request body
成功状态码与 response
可预期错误码
业务副作用、事务或隐私边界
```

本文件不定义新的数据库字段、页面路由、权限角色或基础设施。若其与数据库设计冲突，必须先修订数据库设计和本文件，再实现 Serializer、View 或前端 API 模块。

## 0.1 通用传输规则

```text
Base path                 /api
Content-Type              application/json; charset=utf-8
写入 Content-Type         multipart/form-data（仅媒体上传）或 JSON
字段命名                  snake_case
ID                         UUID v4 字符串
时间                       ISO 8601，含时区偏移
认证                       同源 Django Session cookie
写请求 CSRF                X-CSRFToken header（POST / PATCH / DELETE）
```

`{id}`、`{orgId}`、`{rid}`、`{aid}`、`{eid}` 均表示 UUID v4。非法 UUID 或 Query 类型不合法返回 `400 VALIDATION_ERROR`。

除非端点明确另述：

- `GET` 不接受 request body；
- `POST` 创建资源，成功返回 `201` 与创建后的 DTO；
- `PATCH` 是部分更新，未出现的字段保持不变，字段显式传 `null` 仅在该字段可空时清空；
- 不支持 V0.1 `PUT` 全量替换、JSON Patch、`If-Match`/ETag 条件写入或客户端幂等键；
- 操作成功但没有可用 response body 时返回 `204`；前端不得尝试解析 `204` 的 JSON；
- 服务器生成 `id`、`created_at`、`updated_at`、`published_at`、派生状态、审计字段与申请快照，客户端不得写入；
- 所有 URL 字段必须是 `http://` 或 `https://`，最大 500 字符；Markdown 不接受 raw HTML，服务端渲染/净化边界见 `BackendArchitecture.md` §7。

## 0.2 分页、排序与筛选

可分页列表的成功 response 固定为：

```json
{
  "count": 57,
  "next": "/api/competitions?page=3&page_size=20",
  "previous": "/api/competitions?page=1&page_size=20",
  "results": []
}
```

```text
page                     正整数，默认 1
page_size                正整数，公开列表默认 20、运营表格默认 30、最大 100
q                        去首尾空白后的关键词；空字符串等同于未传
ordering                 仅各端点明确列出的值；其他值返回 400 VALIDATION_ERROR
布尔 Query               true / false；其他值返回 400 VALIDATION_ERROR
```

未列出 `ordering` 的端点只采用 `database-design.md` §22 的冻结默认排序。列表结果只包含调用者当前有权读取的记录；不会用一个资源的权限错误污染整页列表。

## 0.3 成功、错误与下载 response

所有非 2xx response 使用：

```json
{
  "code": "VALIDATION_ERROR",
  "message": "活动标题不能为空",
  "fieldErrors": {
    "title": ["活动标题不能为空"]
  },
  "requestId": "uuid"
}
```

`fieldErrors` 只出现于字段校验，`requestId` 可由部署层提供。具体错误码见 `APIContract.md` §4；本参考中只列端点可能出现的非通用业务错误。

运营报名导出成功时不是 JSON：

```text
200 OK
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="activity-<id>-registrations.csv"
文件编码：UTF-8 with BOM
```

导出只包含当前运营角色依法可见的报名快照列，禁止把密码、私人联系方式或 AuditLog `changes_json` 写入文件。

## 0.4 权限与写入副作用

| 标记 | 后端必须验证的事实 |
|---|---|
| PUBLIC | 无 Session 要求；只能读取已发布且公开的资源 |
| LOGIN | `request.user.is_authenticated` 且账号可用 |
| LEADER(org) | 当前用户是该 `orgId` 的 active `OrganizationMembership(role=LEADER)`，或为 SUPERADMIN |
| OPERATOR | 有效平台角色为 `OPERATOR` 或 `SUPERADMIN` |
| SUPERADMIN | `is_superuser=true`；不等于组织头衔或 OPERATOR |

`OPERATOR` 不自动通过组织负责人校验，`LEADER` 也不自动获得运营 API。`/admin/` 是 Django Admin 的内部 UI，不创建 `/api/ops/users`、`/api/ops/platform-roles` 或通过管理 API 授予 LEADER 的端点。

会改变发布状态、推荐状态、组织资料、招新、申请处理、活动和内容的管理写操作必须写 `AuditLog`；审计 JSON 不得保存密码、私人联系方式、完整申请正文或其他 SENSITIVE 字段。

## 0.5 共用 DTO

### MediaRef

```json
{
  "id": "uuid",
  "url": "https://media.example.edu/path/image.webp"
}
```

`MediaRef` 为 `null` 表示没有配置媒体。公开 DTO 不返回 `object_key`、`sha256`、上传者或储存供应商。

### ActorSummary 与 ObjectLink

```json
{
  "id": "uuid",
  "nickname": "阿三",
  "avatar": null,
  "major": "人工智能",
  "grade": 2
}
```

```json
{
  "type": "COMPETITION | ACTIVITY | ORGANIZATION | RECRUITMENT",
  "id": "uuid",
  "title": "关联对象标题",
  "path": "/activities/uuid"
}
```

`ActorSummary` 不包含真实姓名、学号、班级、邮箱和联系方式。`ObjectLink` 可为 `null`，且 `path` 是前端导航建议，不是权限绕过凭据。

### 当前用户与权限上下文

```json
{
  "user": {
    "id": "uuid",
    "username": "20240001",
    "student_no": "20240001",
    "real_name": "张三",
    "platform_role": "STUDENT | OPERATOR",
    "is_superuser": false,
    "profile": {
      "nickname": "阿三",
      "avatar": null,
      "major": "人工智能",
      "grade": 2,
      "bio": "一句话简介",
      "skills": ["Python", "Vue"]
    }
  },
  "permissions": {
    "platform_role": "STUDENT | OPERATOR | SUPERADMIN",
    "organization_memberships": [
      { "organization_id": "uuid", "role": "MEMBER | LEADER", "title": "技术部干事" }
    ]
  }
}
```

`student_no`、`real_name` 只在当前用户自己的 session response 中出现。`permissions.platform_role` 是后端计算值：`is_superuser=true` 时为 `SUPERADMIN`，否则等于 `user.platform_role`。

## 0.6 写入对象与字段边界

以下对象仅用于相应的创建或 PATCH body；没有列出的字段一律不可写。

### CompetitionWrite

| 字段 | 必填 | 类型 / 约束 |
|---|---:|---|
| `name` | 创建是 | string，2–120 |
| `edition` | 创建是 | string，1–40；与 name 唯一 |
| `category` | 创建是 | `AI` / `PROGRAMMING` / `INNOVATION` / `MATHEMATICAL_MODELING` / `ELECTRONICS` / `ROBOTICS` / `OTHER` |
| `level` | 创建是 | `SCHOOL` / `PROVINCIAL` / `NATIONAL` / `INTERNATIONAL` / `OTHER` |
| `participation_mode` | 创建是 | `INDIVIDUAL` / `TEAM` |
| `suitable_grade_min/max` | 否 | integer 1–4；同时存在时 min <= max |
| `direction` | 否 | string <= 300 |
| `summary` | 否 | string <= 300 |
| `description_md` | 创建是 | Markdown，1–20000 |
| `suitable_for_md` | 否 | Markdown <= 10000 |
| `preparation_advice_md` | 否 | Markdown <= 10000 |
| `registration_start_at/end_at` | 否 | ISO 时间；同时存在时 start <= end |
| `event_start_at/end_at` | 否 | ISO 时间；同时存在时 start <= end |
| `college_organized` | 创建是 | boolean |
| `college_contact_name/text` | 否 | string <= 100 / <= 200 |
| `official_url/registration_url/official_notice_url` | 否 | http(s) URL <= 500 |
| `cover_asset_id` | 否 | 已 ACTIVE 的 IMAGE MediaAsset UUID |

### TeamPostWrite 与 TeamApplicationWrite

`TeamPostWrite`：`competition_id`、`post_type`（`TEAM_RECRUITING` / `PERSON_LOOKING`）、`title`（4–120）、`team_name`（<=100，可空）、`direction`（2–500）、`members_summary`（<=3000，可空）、`base_member_count`（>=1）、`target_member_count`（>= base）、`goal`（<=3000，可空）、`weekly_commitment`（<=200，可空）、`contact_method`（`WECHAT` / `QQ` / `PHONE` / `EMAIL` / `OTHER`）、`contact_value`（1–200）、`notes_md`（<=5000，可空）及 `roles`。

`roles` 是完整数组；每项为 `{name, headcount, requirements, skills, sort_order?}`，其中 `name` 1–60、`headcount` > 0、`requirements` <= 1000、`skills` <= 500。创建未提供 `sort_order` 时按数组顺序从 0 生成；PATCH 提供 roles 时为该 TeamPost 的全量替换，已接受申请所引用的岗位不得被静默删除。

`TeamApplicationWrite`：

```json
{
  "desired_role_id": "uuid 或 null",
  "self_intro": "5–3000 字符",
  "skills": "最多 1000 字符，可空",
  "experience": "最多 5000 字符，可空",
  "motivation": "5–3000 字符",
  "weekly_commitment": "最多 200 字符，可空",
  "contact_method": "WECHAT | QQ | PHONE | EMAIL | OTHER",
  "contact_value": "1–200 字符"
}
```

### RecruitmentWrite 与 OrganizationProfilePatch

`RecruitmentWrite`：`title`（2–120）、`intro_md`（1–10000）、`apply_start_at`（可空）、`apply_end_at`（创建必填）、`target_grade_min/max`（可空 1–4，必须成对合法）、`notes_md`（可空 <=5000）和 `positions`。

`positions` 是完整数组；每项为 `{id?, name, headcount, description_md?, requirements_md?, sort_order?}`，`name` 1–60、`headcount` > 0、Markdown 各 <=3000。PATCH 提交 `positions` 时按 `id` 更新已有岗位、无 `id` 新建、未出现的岗位删除；存在 PENDING 或 ACCEPTED 申请的岗位不可删除，删除请求返回 `409 INVALID_STATE`。

`OrganizationProfilePatch` 只接受：

```json
{
  "short_intro": "最多 200 字符或 null",
  "description_md": "最多 10000 字符或 null",
  "logo_asset_id": "uuid 或 null",
  "banner_asset_id": "uuid 或 null",
  "advisor_name": "最多 100 字符或 null",
  "public_contact": "最多 200 字符或 null"
}
```

### ActivityWrite 与 AnnouncementWrite

`ActivityWrite`：

```json
{
  "title": "2–120 字符",
  "activity_type": "COMPETITION_BRIEFING | TECH_SHARING | RESEARCH_LECTURE | FURTHER_STUDY | ENTERPRISE | TRAINING | OTHER",
  "summary": "最多 300 字符或 null",
  "description_md": "1–20000 字符 Markdown",
  "organizer_organization_id": "uuid 或 null",
  "organizer_name": "最多 120 字符或 null",
  "speaker": "最多 200 字符或 null",
  "location": "1–200 字符",
  "start_at": "ISO 8601",
  "end_at": "ISO 8601 或 null",
  "registration_required": true,
  "registration_start_at": "ISO 8601 或 null",
  "registration_end_at": "ISO 8601 或 null",
  "capacity": 100,
  "notes_md": "最多 5000 字符或 null",
  "cover_asset_id": "uuid 或 null"
}
```

`end_at >= start_at`；两个报名时间同时存在时 start <= end；`capacity` 为 null 或正整数。报名不需要时，报名时间和 capacity 必须为 null；否则返回 `400 VALIDATION_ERROR`。

`AnnouncementWrite`：

```json
{
  "title": "2–160 字符",
  "summary": "最多 300 字符或 null",
  "body_md": "1–20000 字符 Markdown",
  "publisher_scope": "ACADEMY | UNIVERSITY | PLATFORM",
  "external_url": "http(s) URL 或 null",
  "is_pinned": false,
  "competition_id": "uuid 或 null",
  "activity_id": "uuid 或 null",
  "organization_id": "uuid 或 null",
  "recruitment_id": "uuid 或 null"
}
```

四个关联字段非 null 的数量最多为一；全部为 null 表示通用公告。外链只提供明确站外跳转，不抓取、镜像或 iframe 外部官网正文。

### GuideWrite、FaqWrite、BannerWrite 与 ConsultationWrite

`GuideWrite`：`title`（2–160）、`category`（`COMPETITION` / `RESEARCH` / `FURTHER_STUDY` / `CERTIFICATE` / `PROCESS` / `EXPERIENCE` / `OTHER`）、`summary`（可空 <=300）、`body_md`（1–50000）、`competition_ids`（可空 UUID 数组，去重，最多 20）、`is_featured`（boolean）和 `featured_order`（非负整数）。

`FaqWrite`：`category`（与 Guide category 相同）、`question`（2–300）、`answer_md`（1–20000）、`sort_order`（非负整数）和 `is_featured`（boolean）。

`BannerWrite`：`title`（1–80）、`subtitle`（可空 <=160）、`category_label`（可空 <=30）、`image_asset_id`（ACTIVE IMAGE UUID）、`alt_text`（可空 <=160）、`link_type`（`NONE` / `INTERNAL` / `EXTERNAL`）、`internal_path`（仅 INTERNAL，站内绝对路径 <=500）、`external_url`（仅 EXTERNAL，http(s) URL <=500）、`start_at/end_at`（可空 ISO，合法时间序）、`is_active`（boolean）、`sort_order`（非负整数）。`NONE` 不接受两个链接字段，`INTERNAL` 不接受 external_url，`EXTERNAL` 不接受 internal_path。

`ConsultationWrite`：`category`（`COMPETITION` / `TEAM` / `ORGANIZATION` / `ACTIVITY` / `FURTHER_STUDY` / `CERTIFICATE` / `OTHER`）、`competition_id`（可空 UUID）、`title`（4–120）、`body_md`（10–5000）、`visibility`（`PUBLIC` / `PRIVATE`）。`ConsultationReplyWrite` 只接受 `{ "body_md": "1–10000 字符 Markdown" }`。

---

# 1. Auth 与个人中心

## 1.1 `GET /api/auth/csrf`

| 项 | 契约 |
|---|---|
| 权限 | PUBLIC |
| Request | 无 body |
| Success | `204`；Set-Cookie 确保浏览器取得 CSRF cookie |
| Error | `500 INTERNAL_ERROR` |
| 副作用 | 不创建 Session；cookie 不是登录凭据 |

## 1.2 `POST /api/auth/register`

| 项 | 契约 |
|---|---|
| 权限 | PUBLIC + CSRF |
| Body | `{student_no, real_name, password}`；长度分别 2–32、1–80、使用 Django password validator |
| Success | `201 {"status":"pending_approval","message":"注册已提交，请等待管理员审核。"}` |
| Error | `400 VALIDATION_ERROR`、`409 ACCOUNT_EXISTS` |
| 副作用 | 单一事务创建 `User(username=student_no, platform_role=STUDENT, is_active=false)` 与空 `UserProfile`；不登录，不发送审核原因或已有账号资料 |

## 1.3 `POST /api/auth/login` 与 `POST /api/auth/logout`

| 端点 | 权限 | Body | Success | Error / 规则 |
|---|---|---|---|---|
| `POST /api/auth/login` | PUBLIC + CSRF | `{username, password}` | `200`，Set-Cookie Session，body 为 `CurrentUser` | 凭据错误 `401 AUTH_REQUIRED`；inactive 统一 `403 ACCOUNT_UNAVAILABLE` |
| `POST /api/auth/logout` | LOGIN + CSRF | 无 | `204`，清理当前 Session | `401 AUTH_REQUIRED` |

登录不返回 bearer token、密码哈希或 CSRF token。忘记密码不提供 API，产品只显示“请联系管理员”。

## 1.4 `GET /api/auth/me`

| 项 | 契约 |
|---|---|
| 权限 | LOGIN |
| Success | `200 CurrentUser`（见 §0.5） |
| Error | `401 AUTH_REQUIRED` |
| 规则 | 仅当前用户取得 `student_no`、`real_name`；`organization_memberships` 只返回 active 身份 |

## 1.5 个人中心 API

| 端点 | 权限 | Query / Body | 成功 response | 规则与错误 |
|---|---|---|---|---|
| `GET /api/me` | LOGIN | 无 | `200 {profile, organization_memberships, unread_notification_count}` | 聚合当前用户信息；不取代 `/api/auth/me` 的权限上下文 |
| `GET /api/me/profile` | LOGIN | 无 | `200 Profile` | 只返回本人允许读取的资料 |
| `PATCH /api/me/profile` | LOGIN + CSRF | `{nickname?, avatar_asset_id?, major?, grade?, bio?, skills?}` | `200 Profile` | `skills` 是去重字符串数组，最多 20 项；不可改真实姓名、学号、班级；字段非法 `400` |
| `GET /api/me/follows` | LOGIN | page/page_size | `200 Page<CompetitionListItem>` | 仅当前用户关注记录 |
| `GET /api/me/teams` | LOGIN | page/page_size | `200 Page<TeamPostOwnerItem>` | 返回本人所有状态的 TeamPost |
| `GET /api/me/applications` | LOGIN | `kind=team|recruitment` 可选，page/page_size | `200 Page<MyApplicationItem>` | kind 非法 `400`；每项带 `action_path` |
| `GET /api/me/activities` | LOGIN | page/page_size | `200 Page<MyActivityItem>` | 带本人 `registration_status`，不返回其他人的报名快照 |
| `GET /api/me/questions` | LOGIN | page/page_size | `200 Page<MyConsultationItem>` | 包含公开与私密的本人咨询 |
| `GET /api/me/organizations` | LOGIN | 无 | `200 OrganizationMembershipItem[]` | 无身份返回 `[]`；为 `/organizations` “我的组织”区块供数，不对应独立学生路由 |

`Profile` 的写入字段与 `accounts_user_profile` 一致：

```json
{
  "nickname": "阿三",
  "avatar": { "id": "uuid", "url": "https://media.example.edu/avatar.webp" },
  "major": "人工智能",
  "grade": 2,
  "bio": "一句话简介",
  "skills": ["Python", "Vue"]
}
```

`OrganizationMembershipItem`：

```json
{
  "organization_id": "uuid",
  "organization_name": "人工智能协会",
  "organization_type": "STUDENT_CLUB",
  "role": "MEMBER | LEADER",
  "title": "技术部干事",
  "is_active": true
}
```

---

# 2. 首页、竞赛与关注

## 2.1 `GET /api/home`

| 项 | 契约 |
|---|---|
| 权限 | PUBLIC |
| Query | 无；不分页 |
| Success | `200 HomeReadModel` |
| Error | `500 INTERNAL_ERROR` |
| 规则 | 后端一次查询聚合，不允许前端用九个首屏请求替代 |

```json
{
  "banners": [],
  "deadlines": [],
  "featured_competitions": [],
  "announcements": [],
  "featured_guides": [],
  "team_posts": [],
  "recruiting_organizations": [],
  "activities": [],
  "faqs": []
}
```

各数组条目采用对应公开 DTO，最大数依次为 Banner 4、截止 6、竞赛 8、公告 6、指南 6、组队 6、组织 6、活动 6、FAQ 6。首页公告是公开内容预览，不是 `/api/notifications` 的个人消息。

## 2.2 `GET /api/competitions`

| 项 | 契约 |
|---|---|
| 权限 | PUBLIC |
| Query | `q`、`status=UPCOMING|OPEN|IN_PROGRESS|ENDED`、`category`、`participation_mode=INDIVIDUAL|TEAM`、page/page_size、`ordering=registration_end_at|-registration_end_at|event_start_at|-event_start_at` |
| Success | `200 Page<CompetitionListItem>` |
| Error | 非法 enum、ordering 或分页参数为 `400 VALIDATION_ERROR` |

```json
{
  "id": "uuid",
  "name": "全国大学生数学建模竞赛",
  "edition": "2026",
  "category": "MATHEMATICAL_MODELING",
  "level": "NATIONAL",
  "participation_mode": "TEAM",
  "suitable_grade_min": 1,
  "suitable_grade_max": 4,
  "direction": "数学建模",
  "summary": "……",
  "cover": null,
  "registration_start_at": "2026-09-01T00:00:00+08:00",
  "registration_end_at": "2026-10-01T23:59:59+08:00",
  "event_start_at": "2026-11-01T00:00:00+08:00",
  "event_end_at": null,
  "publication_state": "PUBLISHED",
  "registration_state": "UPCOMING | OPEN | CLOSED | NOT_AVAILABLE",
  "event_phase": "UPCOMING | IN_PROGRESS | ENDED",
  "official_url": "https://example.edu/competition",
  "followed": null
}
```

游客的 `followed` 必须为 `null`；登录用户为 boolean。公开列表不返回 DRAFT、CANCELLED 或 ARCHIVED。

## 2.3 `GET /api/competitions/{id}`

| 项 | 契约 |
|---|---|
| 权限 | PUBLIC |
| Success | `200 CompetitionListItem` 加 `description_md`、`suitable_for_md`、`preparation_advice_md`、`registration_url`、`official_notice_url`、`college_organized`、`college_contact_name`、`college_contact_text`、`timeline`、`related_guides`、`related_announcements`、`team_posts` |
| Error | 不存在或不公开 `404 NOT_FOUND` |
| 规则 | `timeline` 以 `sort_order`、时间排序；`team_posts` 仅 RECRUITING，最多 4；相关公告只含已发布公开记录 |

时间线项为 `{id,title,event_at,end_at,description,sort_order}`；相关内容数组使用公开摘要 DTO，不输出管理审计字段。

## 2.4 `POST /api/competitions/{id}/follow` 与 `DELETE /api/competitions/{id}/follow`

| 端点 | 权限 | Body | Success | 错误与副作用 |
|---|---|---|---|---|
| POST follow | LOGIN + CSRF | 无 | `204` | 已关注 `409 ALREADY_FOLLOWED`；公开竞赛不存在 `404`；创建唯一 Follow 行 |
| DELETE follow | LOGIN + CSRF | 无 | `204` | 未关注 `404 NOT_FOUND`；物理删除 Follow 关联，不删除竞赛 |

---

# 3. 组队广场

## 3.1 读取 TeamPost

| 端点 | 权限 | Query | Success | 规则 |
|---|---|---|---|---|
| `GET /api/teams` | PUBLIC | `q`、`competition_id`、`post_type=TEAM_RECRUITING|PERSON_LOOKING`、`status=RECRUITING|FULL|CLOSED`、page/page_size | `200 Page<TeamPostListItem>` | 未传 status 时默认 RECRUITING；按创建时间倒序 |
| `GET /api/teams/{id}` | PUBLIC | 无 | `200 TeamPostDetail` | 非公开资源不存在 `404`；登录用户可见自己的 `my_application_status` |
| `GET /api/teams/{id}/applications` | LOGIN（作者） | `status` 可选，page/page_size | `200 Page<TeamApplicationOwnerItem>` | 非作者 `403`；联系方式只向作者返回 |

`TeamPostListItem` 包含：

```json
{
  "id": "uuid",
  "post_type": "TEAM_RECRUITING",
  "title": "寻找两名算法队友",
  "competition_id": "uuid",
  "competition_name": "全国大学生数学建模竞赛",
  "team_name": "数模小分队",
  "direction": "数学建模方向",
  "base_member_count": 1,
  "target_member_count": 3,
  "current_member_count": 2,
  "members_summary": "目前两名成员……",
  "goal": "冲击国奖",
  "weekly_commitment": "每周 8 小时",
  "roles": [{"id":"uuid","name":"算法","headcount":1,"requirements":"……","skills":"Python","sort_order":0}],
  "status": "RECRUITING",
  "author": {"id":"uuid","nickname":"阿三","avatar":null},
  "created_at": "2026-09-01T10:00:00+08:00"
}
```

`TeamPostDetail` 在此基础上增加 `notes_md`、`updated_at`、`my_application_status`；`contact_method/contact_value` 仅作者或已接受申请的双方可见。`TeamApplicationOwnerItem` 使用申请写入字段加 `id`、申请人 `ActorSummary`、`status`、`processed_at`、`created_at`；作者可见申请人提交的联系方式，公开端点绝不返回。

## 3.2 创建、编辑与关闭 TeamPost

| 端点 | 权限 | Body | Success | 错误 / 副作用 |
|---|---|---|---|---|
| `POST /api/teams` | LOGIN + CSRF | `TeamPostWrite` | `201 TeamPostDetail` | `competition_id` 不存在/不可用 `404`；字段非法 `400` |
| `PATCH /api/teams/{id}` | LOGIN（作者）+ CSRF | `TeamPostWrite` 的任意可编辑子集 | `200 TeamPostDetail` | 非作者 `403`；CLOSED 不允许编辑 `409 INVALID_STATE`；roles 规则见 §0.6 |
| `POST /api/teams/{id}/close` | LOGIN（作者）+ CSRF | 无 | `204` | 已 CLOSED `409 INVALID_STATE`；置 CLOSED/closed_at 并审计 |

编辑容量不得使当前已接受人数超过目标人数；若由 FULL 调整到仍有名额且状态机允许，Service 在事务中重新计算后转为 RECRUITING 并审计。

## 3.3 TeamApplication 操作

| 端点 | 权限 | Body | Success | 错误 / 副作用 |
|---|---|---|---|---|
| `POST /api/teams/{id}/applications` | LOGIN + CSRF | `TeamApplicationWrite` | `201 TeamApplicationSelfItem` | 申请自己 `422 CANNOT_APPLY_OWN`；已有 PENDING/ACCEPTED `409 DUPLICATE_APPLICATION`；非 RECRUITING/名额不可用 `422` |
| `POST /api/team-applications/{id}/accept` | LOGIN（TeamPost 作者）+ CSRF | 无 | `204` | 非 PENDING、非 RECRUITING 或满员 `409/422`；事务锁 post+application，接受后可能转 FULL，并通知申请人 |
| `POST /api/team-applications/{id}/reject` | LOGIN（TeamPost 作者）+ CSRF | 无 | `204` | 非 PENDING `409 INVALID_STATE`；置 REJECTED，通知申请人，审计 |
| `POST /api/team-applications/{id}/withdraw` | LOGIN（申请人）+ CSRF | 无 | `204` | 非本人 `403`；非 PENDING `409 INVALID_STATE`；置 WITHDRAWN |

`TeamApplicationSelfItem` 不包含其他申请人的资料，仅含 `{id, team_post_id, desired_role_id, status, created_at, updated_at}`。接受和拒绝不是 PATCH status；防止客户端绕过权限、容量和通知副作用。

---

# 4. 组织与招新

## 4.1 公开 Organization / Recruitment 读取

| 端点 | 权限 | Query | Success | 错误 / 规则 |
|---|---|---|---|---|
| `GET /api/organizations` | PUBLIC | `q`、`organization_type`、`recruiting=true|false`、page/page_size | `200 Page<OrganizationListItem>` | 仅 is_active；recruiting 是查询派生值 |
| `GET /api/organizations/{id}` | PUBLIC | 无 | `200 OrganizationDetail` | 不存在/停用 `404`；LOGIN 可带 `is_leader` boolean |
| `GET /api/organizations/{id}/recruitments` | PUBLIC | `status`、page/page_size | `200 Page<RecruitmentListItem>` | 只返回公开可读招新 |
| `GET /api/recruitments/{id}` | PUBLIC | 无 | `200 RecruitmentDetail` | DRAFT、CANCELLED、ARCHIVED 对公众 `404` |

`OrganizationListItem`：`{id,name,organization_type,short_intro,logo,is_recruiting}`。`OrganizationDetail` 增加 `description_md`、`banner`、`advisor_name`、`public_contact`、`current_recruitments`（最多 4）、`recent_activities`（最多 3）和 `is_leader`（仅 LOGIN）。

`RecruitmentListItem`：`{id,organization_id,organization_name,title,apply_start_at,apply_end_at,application_state,position_count}`。`RecruitmentDetail` 增加 `intro_md`、年级范围、`notes_md` 与完整 `positions[]`；`application_state` 为 DRAFT / UPCOMING / OPEN / CLOSED / COMPLETED / CANCELLED / ARCHIVED 的后端派生值。

## 4.2 学生招新申请

| 端点 | 权限 | Body | Success | 错误 / 副作用 |
|---|---|---|---|---|
| `POST /api/recruitments/{id}/applications` | LOGIN + CSRF | `{position_id,self_intro,skills?,experience?,motivation}` | `201 RecruitmentApplicationSelfItem` | 招新未 OPEN、岗位不属于该招新或年级不符 `422 TIME_WINDOW_CLOSED` / `400`; 有效重复申请 `409 DUPLICATE_APPLICATION` |
| `POST /api/recruitment-applications/{id}/withdraw` | LOGIN（申请人）+ CSRF | 无 | `204` | 非本人 `403`；非 PENDING `409 INVALID_STATE`；更新 WITHDRAWN |

`RecruitmentApplicationSelfItem`：`{id,recruitment_id,position_id,status,created_at,processed_at}`。V0.1 不提供 `POST /api/organizations/{id}/applications`；唯一申请链为 Recruitment + Position。

---

# 5. 校园动态与公共内容

## 5.1 公开 Activity

| 端点 | 权限 | Query / Body | Success | 错误 / 规则 |
|---|---|---|---|---|
| `GET /api/activities` | PUBLIC | `q`、`status=OPEN|UPCOMING|ENDED`、`activity_type`、page/page_size | `200 Page<ActivityListItem>` | 只返回 PUBLISHED 未取消活动；未来按 start_at 升序，历史倒序 |
| `GET /api/activities/{id}` | PUBLIC | 无 | `200 ActivityDetail` | 不公开/不存在 `404` |
| `POST /api/activities/{id}/register` | LOGIN + CSRF | 无 | `201 RegistrationSelfItem` | 报名未开放、无需报名、已取消 `422 TIME_WINDOW_CLOSED`；重复 `409`；满员 `422 CAPACITY_FULL` |
| `POST /api/activities/{id}/cancel-registration` | LOGIN + CSRF | 无 | `204` | 未报名 `404`；更新同一 Registration 行为 CANCELLED |

`ActivityListItem`：

```json
{
  "id": "uuid",
  "title": "大模型技术分享会",
  "activity_type": "TECH_SHARING",
  "summary": "……",
  "organizer_organization_id": null,
  "organizer_name": "人工智能学院",
  "speaker": "张教授",
  "location": "信息楼 A101",
  "start_at": "2026-09-10T14:00:00+08:00",
  "end_at": "2026-09-10T16:00:00+08:00",
  "cover": null,
  "registration_required": true,
  "registration_state": "OPEN",
  "capacity": 100,
  "registered_count": null,
  "publication_state": "PUBLISHED"
}
```

`registered_count` 仅登录用户可见且可为 null。`ActivityDetail` 加 `description_md`、`registration_start_at/end_at`、`notes_md`、`event_phase`、`registered`（仅 LOGIN）和 `related_announcements`（已发布公告摘要）。报名事务锁定 Activity，读取或复用当前用户唯一 Registration，并写姓名/学号/班级快照；这些快照永不在公开 response 中返回。

## 5.2 公开 Announcement、Guide、FAQ 与公开咨询

| 端点 | 权限 | Query | Success | 规则 |
|---|---|---|---|---|
| `GET /api/announcements` | PUBLIC | `q`、`publisher_scope=ACADEMY|UNIVERSITY|PLATFORM`、page/page_size | `200 Page<AnnouncementListItem>` | 只含 PUBLISHED；置顶后按发布时间倒序 |
| `GET /api/announcements/{id}` | PUBLIC | 无 | `200 AnnouncementDetail` | 非发布/不存在 `404` |
| `GET /api/guides` | PUBLIC | `q`、`category`、page/page_size | `200 Page<GuideListItem>` | 只含 PUBLISHED |
| `GET /api/guides/{id}` | PUBLIC | 无 | `200 GuideDetail` | 加 body_md、related_competitions |
| `GET /api/faqs` | PUBLIC | `q`、`category`、page/page_size | `200 Page<FaqItem>` | 只含 PUBLISHED，按 sort_order |
| `GET /api/qa/public` | PUBLIC | `q`、`category`、page/page_size | `200 Page<PublicConsultationItem>` | 只含 visibility=PUBLIC 且 status=ANSWERED/CLOSED |

`AnnouncementListItem` 是 `{id,title,summary,published_at,is_pinned,publisher_scope,external_url,linked_object}`；`AnnouncementDetail` 增加 `body_md`。它不是个人消息：发布公告不向所有 `/api/notifications` 写记录。

`GuideListItem` 为 `{id,title,category,summary,published_at,is_featured,featured_order}`，详情增加 `body_md` 和 `related_competitions: ObjectLink[]`。`FaqItem` 为 `{id,category,question,answer_md,sort_order,is_featured}`。`PublicConsultationItem` 为 `{id,category,title,body_md,status,answered_at,replies}`，回复作者只输出 `ActorSummary`。

## 5.3 学生咨询、个人消息、上传与搜索

| 端点 | 权限 | Request | Success | 错误 / 规则 |
|---|---|---|---|---|
| `POST /api/consultations` | LOGIN + CSRF | `ConsultationWrite` | `201 ConsultationSelfItem` | competition 不存在 `404`；字段非法 `400`；初始 status=OPEN |
| `GET /api/consultations/{id}` | PUBLIC（已答复公开）/ LOGIN（本人或运营） | 无 | `200 ConsultationDetail` | PRIVATE 对非作者/非运营返回 `404`，不泄露存在性 |
| `GET /api/notifications` | LOGIN | `unread=true|false`、`type=SYSTEM|COMPETITION|TEAM|ACTIVITY|ORGANIZATION|CONSULTATION`、page/page_size | `200 Page<NotificationItem>` | 只返回 recipient 为当前用户，按 created_at DESC |
| `GET /api/notifications/unread-count` | LOGIN | 无 | `200 {"count":3}` | count 仅当前用户 |
| `POST /api/notifications/{id}/read` | LOGIN + CSRF | 无 | `204` | 非本人或不存在 `404`；重复标已读仍 `204` |
| `POST /api/notifications/read-all` | LOGIN + CSRF | 无 | `204` | 将当前用户全部未读设 read_at=now；不影响别人 |
| `POST /api/media/upload` | LOGIN + CSRF | multipart `file`, `kind=IMAGE|DOCUMENT` | `201 MediaUploadResult` | 非法 MIME/内容/尺寸 `400 UNSUPPORTED_MEDIA` |
| `GET /api/search` | PUBLIC | `q`、page/page_size | `200 Page<SearchResult>` | 空 q 或超过 100 字符 `400 VALIDATION_ERROR` |

`ConsultationSelfItem` 包含本人咨询全部可见字段和正式 `replies[]`；`ConsultationDetail` 对公开访问者隐藏作者身份和任何 PRIVATE 信息。`NotificationItem` 为 `{id,notification_type,title,body,action_path,read_at,created_at}`，`action_path` 只能是站内路径或 null。

`MediaUploadResult`：

```json
{
  "id": "uuid",
  "url": "https://cdn.example.edu/image.webp",
  "original_name": "photo.jpg",
  "mime_type": "image/jpeg",
  "size_bytes": 102400,
  "width": 1200,
  "height": 675
}
```

IMAGE 仅接受 jpg/jpeg/png/webp/avif，单文件 <= 5 MB；DOCUMENT 在 V0.1 尚未启用，传入时返回 `400 UNSUPPORTED_MEDIA`。`SearchResult` 为 `{type,id,title,subtitle,path,matched_field}`，type 只能是 `COMPETITION`、`ORGANIZATION`、`RECRUITMENT`、`TEAM_POST`、`ACTIVITY`、`FAQ`、`GUIDE`、`ANNOUNCEMENT`；只检索公开可读的已发布实体。

---

# 6. 运营 API（OPERATOR / SUPERADMIN）

所有本节端点均需要 OPERATOR 或 SUPERADMIN Session 和 CSRF（GET 除外）。管理读取可以看 DRAFT/ARCHIVED 和内部创建/更新时间，但不得输出密码、会话、SENSITIVE 联系方式或完整 AuditLog。

## 6.1 Competition 管理

| 端点 | Request | Success | 错误 / 副作用 |
|---|---|---|---|
| `GET /api/ops/competitions` | `q,status=DRAFT|PUBLISHED|CANCELLED|ARCHIVED,category,level,page,page_size` | `200 Page<CompetitionManagementDetail>` | 管理排序可按 `created_at`、`registration_end_at`；非法筛选 400 |
| `POST /api/ops/competitions` | `CompetitionWrite` | `201 CompetitionManagementDetail` | 初始 DRAFT，写 AuditLog CREATE |
| `GET /api/ops/competitions/{id}` | 无 | `200 CompetitionManagementDetail` | 不存在 404 |
| `PATCH /api/ops/competitions/{id}` | `CompetitionWrite` 的部分字段 | `200 CompetitionManagementDetail` | 不接受 `publication_state`、审计字段；字段合法性 400，写 AuditLog UPDATE |
| `POST /api/ops/competitions/{id}/publish` | 无 | `204` | 仅 DRAFT -> PUBLISHED；缺少必填发布资料 422；其他状态 409 INVALID_STATE，审计 |
| `POST /api/ops/competitions/{id}/cancel` | 无 | `204` | PUBLISHED -> CANCELLED，审计 |
| `POST /api/ops/competitions/{id}/archive` | 无 | `204` | PUBLISHED 或 CANCELLED -> ARCHIVED，审计 |
| `PATCH /api/ops/competitions/{id}/featured` | `{is_featured:boolean, featured_order?:non-negative integer}` | `200 {id,is_featured,featured_order}` | DRAFT/ARCHIVED 不可推荐 409；审计 |
| `POST /api/ops/competitions/{id}/timeline-events` | `{title,event_at,end_at?,description?,sort_order}` | `201 TimelineEvent` | title 1–100、description <=500、时间序合法；审计 |
| `PATCH /api/ops/competitions/{id}/timeline-events/{eid}` | 上一对象部分字段 | `200 TimelineEvent` | 节点不属于该竞赛 404；审计 |
| `DELETE /api/ops/competitions/{id}/timeline-events/{eid}` | 无 | `204` | 节点不属于该竞赛 404；审计 |

`CompetitionManagementDetail` 是公开详情加 `publication_state`、`is_featured`、`featured_order`、`created_at`、`updated_at`、`created_by_id`、`updated_by_id`；它仍不返回 User 的 SENSITIVE 字段。

## 6.2 Activity 与报名管理

| 端点 | Request | Success | 错误 / 副作用 |
|---|---|---|---|
| `GET /api/ops/activities` | `q,status=DRAFT|PUBLISHED|CANCELLED|ARCHIVED,activity_type,page,page_size` | `200 Page<ActivityManagementDetail>` | 管理列表含所有发布状态 |
| `POST /api/ops/activities` | `ActivityWrite` | `201 ActivityManagementDetail` | 初始 DRAFT，审计 CREATE |
| `GET /api/ops/activities/{id}` | 无 | `200 ActivityManagementDetail` | 不存在 404 |
| `PATCH /api/ops/activities/{id}` | `ActivityWrite` 的部分字段 | `200 ActivityManagementDetail` | 不接受 publication_state；已开始活动修改时间/容量须满足现有报名约束；审计 UPDATE |
| `POST /api/ops/activities/{id}/publish` | 无 | `204` | DRAFT -> PUBLISHED，发布资料缺失 422；审计 |
| `POST /api/ops/activities/{id}/cancel` | 无 | `204` | PUBLISHED -> CANCELLED；向 REGISTERED 用户创建定向 ACTIVITY Notification；审计 |
| `POST /api/ops/activities/{id}/archive` | 无 | `204` | PUBLISHED 或 CANCELLED -> ARCHIVED；审计 |
| `POST /api/ops/activities/{id}/close-registration` | 无 | `204` | 仅 PUBLISHED 且报名仍 OPEN；拒绝之后的新报名，保留既有 Registration；审计 |
| `PATCH /api/ops/activities/{id}/featured` | `{is_featured:boolean, featured_order?:non-negative integer}` | `200 {id,is_featured,featured_order}` | 非 PUBLISHED 不能推荐 409；审计 |
| `GET /api/ops/activities/{id}/registrations` | `status=REGISTERED|CANCELLED` 可选，page/page_size | `200 Page<ActivityRegistrationManagementItem>` | SENSITIVE，仅运营；活动不存在 404 |
| `POST /api/ops/activities/{id}/export-registrations` | `status=REGISTERED|CANCELLED` 可选 | CSV `200` | 同 §0.3；审计导出行为 |

`ActivityManagementDetail` 是 `ActivityDetail` 加 `publication_state`、推荐字段和审计时间/操作者 ID。`ActivityRegistrationManagementItem` 为 `{id,user_id,name_snapshot,student_no_snapshot,class_name_snapshot,major_snapshot,grade_snapshot,status,registered_at,cancelled_at}`，严禁用于公开端点。

## 6.3 Campus Dynamics 组合发布

### `POST /api/ops/dynamics/activity-with-announcement`

| 项 | 契约 |
|---|---|
| Body | `{ "activity": ActivityWrite, "announcement": AnnouncementWrite（客户端不得传 activity_id）, "publish": boolean }` |
| Success | `201 {"activity": ActivityManagementDetail, "announcement": AnnouncementManagementDetail}` |
| Error | 任一嵌套字段错误 `400 VALIDATION_ERROR`；发布资料不完整 `422`；权限 `403` |
| 事务 | `transaction.atomic` 创建两个对象；服务端把新 Activity UUID 写入 Announcement.activity_id；`publish=true` 时两个均 PUBLISHED，否则两个均 DRAFT；任一步失败整个回滚 |
| 副作用 | 分别写两条 AuditLog；不因公开 Announcement 向全体用户创建 Notification |

该端点不替代单独活动/公告 API，也不接受既有 Activity ID 追加公告。

## 6.4 Announcement、Guide、FAQ 与 Banner 管理

| 资源 | 读取 | 创建 / 编辑 | 生命周期与推荐 |
|---|---|---|---|
| Announcement | `GET /api/ops/announcements?q=&status=&publisher_scope=&page=&page_size=`；`GET /api/ops/announcements/{id}` | `POST /api/ops/announcements`、`PATCH /api/ops/announcements/{id}`，body 为 `AnnouncementWrite` | `POST /api/ops/announcements/{id}/publish`、`POST /api/ops/announcements/{id}/archive` |
| Guide | `GET /api/ops/guides?q=&status=&category=&page=&page_size=`；`GET /api/ops/guides/{id}` | `POST /api/ops/guides`、`PATCH /api/ops/guides/{id}`，body 为 `GuideWrite` | `POST /api/ops/guides/{id}/publish`、`POST /api/ops/guides/{id}/archive`、`PATCH /api/ops/guides/{id}/featured` body `{is_featured,featured_order?}` |
| FAQ | `GET /api/ops/faq?q=&status=&category=&page=&page_size=`；`GET /api/ops/faq/{id}` | `POST /api/ops/faq`、`PATCH /api/ops/faq/{id}`，body 为 `FaqWrite` | `POST /api/ops/faq/{id}/publish`、`POST /api/ops/faq/{id}/archive`、`PATCH /api/ops/faq/{id}/featured` body `{is_featured}` |
| Banner | `GET /api/ops/banners?active=true|false&page=&page_size=`；`GET /api/ops/banners/{id}` | `POST /api/ops/banners`、`PATCH /api/ops/banners/{id}`，body 为 `BannerWrite` | `PATCH` 的 is_active、时间窗和 sort_order 是唯一启停/排序写法 |

所有表中 `status` 只接受资源的 `publication_state` 枚举（Announcement/Guide/FAQ：DRAFT/PUBLISHED/ARCHIVED；Banner 使用 `is_active`，无 publication_state）。创建默认 DRAFT，只有 `/publish` 可置 PUBLISHED，`/archive` 可置 ARCHIVED；PATCH 不接受 `publication_state`。成功状态：创建 `201` 返回管理详情、读取/编辑/featured `200`、publish/archive `204`。不存在 `404`，状态冲突 `409 INVALID_STATE`，字段非法 `400`；每次写操作审计。

`AnnouncementManagementDetail` 为公开详情加 `publication_state`、`created_at`、`updated_at`、`created_by_id`、`updated_by_id`；Guide/FAQ/Banner 管理详情同理增加内部生命周期与审计字段。Banner 永不进入公开通用列表，只通过 `GET /api/home` 暴露当前有效项。

## 6.5 Consultation 运营处理

| 端点 | Request | Success | 错误 / 副作用 |
|---|---|---|---|
| `GET /api/ops/consultations` | `q,status=OPEN|ANSWERED|CLOSED,visibility=PUBLIC|PRIVATE,category,page,page_size` | `200 Page<ConsultationManagementDetail>` | 可读取 PRIVATE；分页/enum 非法 400 |
| `GET /api/ops/consultations/{id}` | 无 | `200 ConsultationManagementDetail` | 不存在 404 |
| `POST /api/ops/consultations/{id}/replies` | `ConsultationReplyWrite` | `201 ConsultationReply` | 仅 OPEN/ANSWERED 可追加；CLOSED `409 INVALID_STATE`；写 Reply、answered_at、status=ANSWERED、定向通知作者、审计 |

`ConsultationManagementDetail` 仅对运营输出作者 `ActorSummary`、visibility、全文和正式回复；不输出学生的学号、班级或联系方式。

---

# 7. 组织负责人工作台 API（LEADER(org) / SUPERADMIN）

所有路径中的 `{orgId}` 都先做组织作用域权限检查；无 active LEADER 的登录用户返回 `403 PERMISSION_DENIED`，不存在或停用组织返回 `404 NOT_FOUND`。SUPERADMIN 可越过 LEADER 身份，但操作仍写 AuditLog。

## 7.1 组织资料

| 端点 | Request | Success | 规则 |
|---|---|---|---|
| `GET /api/manage/organizations/{orgId}/profile` | 无 | `200 OrganizationManagementProfile` | 含公开资料、is_active 和审计时间；不输出其他成员隐私 |
| `PATCH /api/manage/organizations/{orgId}/profile` | `OrganizationProfilePatch` | `200 OrganizationManagementProfile` | 不允许 name、organization_type、is_active、成员关系；字段合法性 400，审计 UPDATE |

负责人不能停用/删除组织，不能通过此 API 授予 LEADER；此类系统级操作只由 Django Admin 的 SUPERADMIN 完成。

## 7.2 招新管理

| 端点 | Request | Success | 错误 / 副作用 |
|---|---|---|---|
| `GET /api/manage/organizations/{orgId}/recruitments` | `status` 可选，page/page_size | `200 Page<RecruitmentManagementDetail>` | 只限当前 org |
| `POST /api/manage/organizations/{orgId}/recruitments` | `RecruitmentWrite` | `201 RecruitmentManagementDetail` | 初始 DRAFT，审计 CREATE |
| `GET /api/manage/organizations/{orgId}/recruitments/{rid}` | 无 | `200 RecruitmentManagementDetail` | rid 不属于 org 404 |
| `PATCH /api/manage/organizations/{orgId}/recruitments/{rid}` | `RecruitmentWrite` 的部分字段 | `200 RecruitmentManagementDetail` | 不接受 publication_state/completed_at；岗位数组规则见 §0.6；审计 |
| `POST /api/manage/organizations/{orgId}/recruitments/{rid}/publish` | 无 | `204` | DRAFT -> PUBLISHED，必须至少有一个岗位和完整时间窗；否则 422 |
| `POST /api/manage/organizations/{orgId}/recruitments/{rid}/cancel` | 无 | `204` | PUBLISHED -> CANCELLED；不改变既有申请历史，审计 |
| `POST /api/manage/organizations/{orgId}/recruitments/{rid}/complete` | 无 | `204` | PUBLISHED、申请窗口结束后可写 completed_at；之后申请拒绝，审计 |
| `POST /api/manage/organizations/{orgId}/recruitments/{rid}/archive` | 无 | `204` | PUBLISHED/CANCELLED/COMPLETED -> ARCHIVED；审计 |

`RecruitmentManagementDetail` 为公开详情加 `publication_state`、`completed_at`、申请统计 `{pending_count,accepted_count,rejected_count,withdrawn_count}`、`created_at`、`updated_at`。统计不是独立持久字段。

## 7.3 招新申请处理

| 端点 | Request | Success | 错误 / 副作用 |
|---|---|---|---|
| `GET /api/manage/organizations/{orgId}/applications` | `recruitment_id`、`position_id`、`status=PENDING|ACCEPTED|REJECTED|WITHDRAWN` 可选，page/page_size | `200 Page<RecruitmentApplicationManagementItem>` | 只返回该 org 的内部申请；申请人联系方式不在此 DTO |
| `POST /api/manage/organizations/{orgId}/applications/{aid}/accept` | 无 | `204` | 事务锁申请/岗位/招新，确认 PENDING 和可处理，检查名额，置 ACCEPTED，创建或重激活 Membership(role=MEMBER,title=position.name)，通知申请人，审计 |
| `POST /api/manage/organizations/{orgId}/applications/{aid}/reject` | 无 | `204` | 仅 PENDING；置 REJECTED，通知申请人，审计 |

`RecruitmentApplicationManagementItem`：

```json
{
  "id": "uuid",
  "applicant": {"id":"uuid","nickname":"阿三","avatar":null,"major":"人工智能","grade":2},
  "recruitment_id": "uuid",
  "position_id": "uuid",
  "position_name": "技术部干事",
  "self_intro": "……",
  "skills": "……",
  "experience": "……",
  "motivation": "……",
  "status": "PENDING",
  "processed_by_id": null,
  "processed_at": null,
  "created_at": "2026-09-01T10:00:00+08:00"
}
```

接受申请绝不授予 LEADER，不能通过客户端 body 改写 `membership.role` 或 `membership.title`。

---

# 8. 实现与契约测试最低要求

每个后端 app 在实现时至少覆盖以下 Contract Test：

```text
未登录写请求 -> 401 AUTH_REQUIRED
缺少 / 失效 CSRF 的写请求 -> 403（统一错误结构）
不具备角色或 orgId 作用域 -> 403 PERMISSION_DENIED
公开详情读取 DRAFT/ARCHIVED/PRIVATE 资源 -> 404 NOT_FOUND
无效枚举、分页、UUID、字段长度 -> 400 VALIDATION_ERROR + fieldErrors
重复关注、重复有效申请、非法状态转移 -> 409 对应 code
活动满员、窗口关闭、申请自己队伍 -> 422 对应 code
接受申请、活动报名、活动并公告组合发布 -> PostgreSQL 事务测试
公开公告发布 -> 不创建全体 Notification
运营和负责人状态操作 -> AuditLog 存在且无 SENSITIVE 内容
```

有 PostgreSQL partial unique、jsonb、行锁和 `select_for_update` 的测试不能只用 SQLite。前端在 FE-100+ 以本文 DTO 建立 runtime schema 和 feature API modules；页面组件不得直接调用 `fetch()`。
