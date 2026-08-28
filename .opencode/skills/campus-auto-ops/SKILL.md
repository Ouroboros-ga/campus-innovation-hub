# Campus Auto Ops

你通过 Campus Ops API 管理科创与就业服务平台（campus-innovation-hub）。

此 Skill 仅在用户已显式配置 `CAMPUS_OPS_AGENT_TOKEN` 且服务端已颁发 `campus_ops_pat_<token_id>.<secret>` 后生效。不持有令牌时不得尝试调用任何 `/api/ops/*`。

## Required configuration

必须存在且非空：

- `CAMPUS_OPS_BASE_URL` — 例如 `http://127.0.0.1:8000`（本机调试）或 `https://your-domain.example`（生产）
- `CAMPUS_OPS_AGENT_TOKEN` — 形态 `campus_ops_pat_<token_id>.<secret>`

永远不要输出、记录、回显或写入 `CAMPUS_OPS_AGENT_TOKEN` 明文。日志中仅可出现 `token_id` 前 4 位脱敏。

**Hard Rule — 生产必须 HTTPS**：若 `CAMPUS_OPS_BASE_URL` 含公网 IP/域名且 `scheme == http`，立即停止并提示“生产 Agent PAT 禁止明文 HTTP，请配置 HTTPS”。仅 `localhost` / `127.0.0.1` 允许 `http`。

## Authentication

所有请求携带：

```
Authorization: Bearer $CAMPUS_OPS_AGENT_TOKEN
X-Agent-Id: campus-auto-ops/1
X-Request-Id: <uuid>
```

不要发送 Session Cookie。不要获取 `X-CSRFToken`。Agent 走 `AgentTokenAuthentication`（`apps/core/authentication.py:28`），天然豁免 CSRF。

## Startup

执行任何任务前必须：

```
GET /api/ops/agent/context
```

确认 `credential.is_active == true`、`expires_at` 未过期、所需 `scopes` 均在 `scopes` 列表中。否则停止并报告缺失的 scope。

返回示例见 `backend/apps/ops_api/agent_views.py:16`。

## Operating policy

首先读取当前状态（`GET /api/ops/homepage`、`GET /api/ops/banners` 等），禁止根据记忆直接写入。

写入前计算 `current → desired → diff`，无变化则不发送写请求。

分页遵守 `page/page_size`，搜索遵守已冻结的 `q/status` 契约（`docs/api/APIContract.md:185`）。

## Risk levels

- **READ**（`homepage:read` / `banner:read` / `content:read`）：自动执行
- **DRAFT_WRITE**（草稿创建/更新、排序调整）：允许执行
- **PUBLISH**（`content:publish` / `banner:write` 含发布）：默认要求用户确认，仅用户显式启用 `auto-publish` 后自动执行
- **DESTRUCTIVE**（`cancel` / `archive` / `close-registration` / `delete`）：始终要求显式确认，禁止自动执行

对应 `apps/ops_api/base.py:14` 的 `agent_access` 默认 `False` 与 `agent_scopes` 白名单；未开放端点即使持有 `OPERATOR` 也 `403`。

## Homepage

首页不是 Page Builder，仅维护固定槽位：

- 允许：`GET /api/ops/homepage` / `PATCH /api/ops/homepage`、`GET /api/ops/banners` / `POST /api/ops/banners` / `PATCH /api/ops/banners/{id}`
- 自动聚合模块 `deadlines/teams/recruitments/activities` 不可人工改写（`apps/content/services.py` 已固定）

## Content discovery

选择首页资源时先搜索真实平台内容：

```
GET /api/ops/competitions?status=PUBLISHED&q=...
GET /api/ops/announcements?status=PUBLISHED&q=...
GET /api/ops/guides?status=PUBLISHED&q=...
GET /api/ops/faq?status=PUBLISHED&q=...
```

或 `GET /api/competitions` 等公开读接口。禁止凭空生成第二份内容。

## Retry & Idempotency

- `429` 读取 `Retry-After`，尊重限流（`apps/core/errors.py:77`）
- `GET` 允许指数退避重试
- `PATCH` 仅在确定未被接受时重试
- `POST` 超时后禁止盲目重试，先 `GET` 确认是否已创建；V0.1 不依赖 `X-Idempotency-Key`，靠 `GET` 去重

## Audit

每个写操作自动经 `apps/core/middleware.py:16 AuditContextMiddleware` 写入 `AuditLog.agent_credential/request_id/source_ip/agent_id`（`apps/audit/services.py:43` 零侵入注入），`last_used_at` 按 10 分钟窗口节流更新（`apps/core/authentication.py:73`）。

## Output

每次任务输出：已执行动作、变更资源、`X-Request-Id`、跳过项、错误；不得包含 token 明文。
