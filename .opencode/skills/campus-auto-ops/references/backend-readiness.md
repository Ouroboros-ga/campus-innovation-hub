# Backend Readiness for Full First Initialization

当前 `main` 已经实现 Agent PAT 基础：

- AgentCredential
- `campus_ops_pat_<token_id>.<secret>`
- SHA256 secret hash
- expires / revoke / allowed CIDR
- 10 分钟 last_used 节流
- AgentTokenAuthentication + SessionAuthentication
- OperatorAPIView 默认 `agent_access=False`
- scope allowlist
- AuditContextMiddleware
- AuditLog agent credential / request id / source ip / agent id
- `/api/ops/agent/context`
- `/api/ops/homepage`
- Banner Agent access

完整第一次初始化仍需以下门禁。

## 1. Restrict PAT to Ops namespace

当前 AgentTokenAuthentication 是全局 DRF authentication。

建议：

```text
campus_ops_pat_* 只允许用于 /api/ops/*
```

否则 PAT 可能在普通 `IsAuthenticated` endpoint 被识别为登录用户。

实现原则：

```python
if raw_token.startswith("campus_ops_pat_") and not request.path.startswith("/api/ops/"):
    raise AuthenticationFailed("Agent PAT 仅可用于 Ops API。")
```

不要允许 Agent 使用 `/api/media/upload`、`/api/me`、`/api/teams` 等作为旁路。

## 2. Dedicated Ops Media Upload

Banner Create 强制 `image_asset_id`。

新增：

```text
POST /api/ops/media/upload
agent_access=True
agent_scopes={"POST": {"media:upload"}}
```

内部复用已有 MediaUploadSerializer / create_image_asset / serialize_media_upload，只允许 IMAGE。

## 3. Open Competition Endpoints

建议：

```text
CompetitionCollectionView
GET  -> competition:read
POST -> competition:write

CompetitionDetailView
GET   -> competition:read
PATCH -> competition:write

CompetitionPublishView
POST -> competition:publish

CompetitionTimelineCollectionView
POST -> competition:write

CompetitionTimelineDetailView
PATCH -> competition:write
DELETE -> 不开放
```

保持关闭：

```text
import
cancel
archive
单条 featured
timeline DELETE
```

首页精选走 `/api/ops/homepage`。

## 4. Timeline Draft Safety

当前 Timeline Service 可修改已发布 Competition 的 Timeline。

在允许 Agent timeline write 前，给：

```text
create_timeline_event
update_timeline_event
delete_timeline_event
```

增加：

```text
competition.publication_state == DRAFT
```

至少 Agent 写路径必须满足。

## 5. Open Activity Endpoints

```text
ActivityCollectionView
GET  -> activity:read
POST -> activity:write

ActivityDetailView
GET   -> activity:read
PATCH -> activity:write

ActivityPublishView
POST -> activity:publish
```

保持关闭：

```text
cancel
archive
close-registration
featured
registrations
export
activity-with-announcement
```

## 6. Open Content Endpoints

Announcement / Guide / FAQ：

```text
Collection GET  -> content:read
Collection POST -> content:write
Detail GET      -> content:read
Detail PATCH    -> content:write
Publish POST    -> content:publish
```

保持 archive 与单条 featured 对 Agent 关闭。

## 7. Token scopes for first initialization

建议创建 30~90 天初始化 token：

```text
homepage:read
homepage:write
banner:read
banner:write
content:read
content:write
content:publish
competition:read
competition:write
competition:publish
activity:read
activity:write
activity:publish
media:upload
```

初始化完成后 revoke，并创建更小的日常运营 token。

## 8. Homepage PATCH warning

当前 HomepageCurationSerializer 对未提交列表 `default=list`，所以 PATCH 实际是完整快照语义。

Skill 已硬性规定先 GET，再完整四组 PATCH。

长期若希望 partial PATCH，应取消默认空列表并区分 omitted 与 empty。
