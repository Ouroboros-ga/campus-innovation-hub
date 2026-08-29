# Backend API（BE-001 至 BE-068 实现资产）

本目录包含 Django / Django REST Framework 基础设施、账户与同源 Session 认证、V0.1 全部领域 Model、Django Admin、权限和事务 Service，以及公开浏览、学生写入、组织负责人和平台运营的 DRF Serializer / View / URL。实现基线为 `main@5fd5ed3bc284276057cf3442ec203412839237dc`；前端 fixture 是否切换仍由对应 FE 阶段决定。

这不表示已具备生产发布条件。BE-050A 已注册组队作者的申请列表、接受与拒绝，以及全部 `/api/me/*` 个人中心 API；前端 fixture 不因此自动切换。BE-060 至 BE-068 已提供认证节流、Default Deny、production settings、上传重编码、S3-compatible client、部署/备份模板、uv 锁文件、CI 与数据治理文档，但尚未取得预发布、恢复或目标提交 CI 的运行证据。详见 `../docs/backend/ProductionReadinessPlan.md`、`../docs/backend/SecurityBaseline.md` 与 `../docs/backend/release-evidence/`。

## 运行环境

```text
Python 3.12
Django 5.2.17
Django REST Framework 3.18.0
PostgreSQL 16 或兼容版本
```

在 `backend/` 内只使用 `uv` 与提交的 `uv.lock`：

```powershell
uv sync --frozen --group dev
uv run --frozen python manage.py check
```

Linux / 服务器同样使用 `uv sync --frozen --group dev`。`pyproject.toml` 与 `uv.lock` 是唯一可编辑依赖真源；不直接使用 `pip install`，也不保留第二套 requirements 声明。

## 环境变量

以 `.env.example` 为变量清单。Django 设置只读取进程环境变量，仓库不会自动加载 `.env` 文件；本地开发可由 IDE、shell 或安全的环境变量加载工具注入。

必填变量：

```text
DJANGO_SETTINGS_MODULE=config.settings.development
DJANGO_SECRET_KEY=<仅本地或部署环境持有的随机密钥>
DJANGO_DEBUG=true|false
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DJANGO_CSRF_TRUSTED_ORIGINS=http://localhost:5173
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
AUTH_THROTTLE_HMAC_KEY=<生产环境必须与 DJANGO_SECRET_KEY 独立>
```

`DATABASE_URL` 只接受 `postgres://` 或 `postgresql://`。SQLite URL 会在启动时被拒绝，防止 PostgreSQL 语义被本地替代掩盖。

无域名的远程开发使用 `config.settings.development`：它只允许带端口的 `http://localhost` 或 `http://127.0.0.1` CSRF origin。前端通过 Vite 将同源 `/api` 代理到本机 SSH 隧道；不要将浏览器指向服务器公网 IP，也不要用 development settings 启动公网服务。完整运行命令见 `../deploy/README.md`。

## 媒体存储

当前服务器使用本地文件存储：`MEDIA_STORAGE_BACKEND=local`、`MEDIA_ROOT=<服务器媒体目录>`，由 Nginx 将同源 `MEDIA_URL=/media/` 映射为可公开读取的静态文件。公开 API 只返回 `{id, url}`，不会返回 `object_key`、哈希、上传者或媒体状态。

S3-compatible 写入由 `boto3` adapter 提供，但只在 `MEDIA_STORAGE_BACKEND=s3` 时加载。部署必须提供 endpoint、region、单一 bucket、access key、secret、object prefix 与包含该 prefix 的 `MEDIA_PUBLIC_BASE_URL`；Model 和 Serializer 不导入云 SDK。图片会在服务器完整解码、限制为 5 MB / `16_777_216` 像素、重编码后才保存。真实 bucket 上传、公开读取和失败补偿删除必须在获得单独预发布写入授权后验证；不要在 2C2G 应用服务器部署 MinIO。

## 本地检查与测试

在 PowerShell 为当前会话注入上述变量后执行：

```powershell
uv run --frozen python manage.py check
uv run --frozen python manage.py test -v 2
```

测试会基于 `DATABASE_URL` 创建并清理 Django 的 PostgreSQL test database；数据库用户须具有创建测试库的权限。不要将真实密钥或生产数据库 URL 写入 `.env.example`、测试代码或 Git。

## 健康检查与错误结构

```text
GET /api/health
200 {"status":"ok"}
```

API 路由的非 2xx 响应使用冻结错误结构：

```json
{
  "code": "NOT_FOUND",
  "message": "请求的接口不存在"
}
```

字段校验时可额外返回 `fieldErrors`；部署层可额外提供 `requestId`。完整契约见 `../docs/api/APIContract.md` 与 `../docs/api/EndpointReference.md`。

## Session 与 CSRF 认证

认证固定为同源 Django Session，不返回 bearer token。先获取 CSRF cookie，再对所有认证写请求镜像到 `X-CSRFToken`：

```text
GET  /api/auth/csrf      204，确保浏览器获得可读取的 csrftoken
POST /api/auth/register  {student_no, real_name, password}，201 active 或 pending_approval，不登录
POST /api/auth/login     {username, password}，200 CurrentUser + HttpOnly Session cookie
POST /api/auth/logout    登录 + CSRF，204，清理 Session
GET  /api/auth/me        登录，200 CurrentUser
```

注册在同一事务创建 `accounts.User` 和空 `UserProfile`；`is_active` 由 `STUDENT_REGISTRATION_AUTO_ACTIVATE` 决定。inactive 账号登录始终返回 `403 ACCOUNT_UNAVAILABLE`，不会建立 Session。Custom User 采用 UUID primary key、`student_no` PostgreSQL partial unique 与 `platform_role` / `is_active` 索引。

`/api/auth/me` 只返回当前用户的 `student_no` 与 `real_name`，不返回 password、email、class_name、password hash、Session 或 CSRF 值。`organization_memberships` 现在只返回当前用户的 active Membership（`organization_id`、`MEMBER|LEADER`、展示 title）；已配置且可用的 `profile.avatar` 将以 MediaRef 返回。认证在用户名与 IP 维度使用 PostgreSQL 行锁节流，响应仅为 `429 RATE_LIMITED` + `Retry-After`，且 30 天后由 management command 清理摘要记录。

## 领域数据、Admin 与 Service 边界

BE-003 建立 `media`、`organizations`（含招新）、`competitions`、`teams`、`activities`、`content`、`consultations`、`notifications` 与 `audit`。二进制文件不进入 PostgreSQL；状态展示值不重复持久化；稳定唯一性、部分唯一性、CheckConstraint、索引和 `on_delete` 以 `docs/backend/database-design.md` 为准。

`/admin/` 仅允许 `is_active=true && is_staff=true && is_superuser=true` 的可信账户登录。`platform_role=OPERATOR` 和普通 `is_staff` 账户都不会获得 Admin 访问。账号启停、OPERATOR、组织 LEADER、成员关系与组织启停均通过 Service 写入 `AuditLog`；生命周期字段在 Admin 只读，所有 ModelAdmin 禁止物理删除，AuditLog 本身不允许新建、编辑或删除。

所有跨表业务规则不依赖未来的 DRF View：

```text
can_manage_organization(user, organization_id)
visible_consultations_for(user)
accept_team_application(...)
accept_recruitment_application(...)
register_activity(...) / cancel_activity_registration(...)
publish_competition(...)
grant_organization_leader(...)
```

`LEADER` 严格受 `organization_id` 和 active Membership 限制，展示 `title` 不授予权限；OPERATOR 不自动获得组织负责人权限；SUPERADMIN 只从 Django `is_superuser` 推导。Service 使用 `transaction.atomic()` 和 `select_for_update()` 锁定活动、组队/招新申请及名额关联记录，并在同一事务内写入定向 Notification 和无敏感字段的 AuditLog。

## PostgreSQL 验证

本阶段在服务器的隔离 Python 3.12.14 / PostgreSQL 16.2 容器中验证：

```text
python manage.py check
python manage.py migrate --noinput
python manage.py makemigrations --check --dry-run
python manage.py test -v 1
```

完整功能套件及其精确计数以服务器最终输出为准。BE-006 的 PostgreSQL `TransactionTestCase` 已覆盖：已冻结 app 的 leaf Migration、partial unique 的 PostgreSQL predicate 与真实写入语义、高频索引 introspection、活动容量、组队容量、同岗位招新容量，以及同组织跨招新轮次 Membership 创建竞态。临时数据库、容器和网络在验证后清理；不会接触服务器已有服务。

BE-006 不包含独立 seed、数据 Migration 或更广的数据库回归套件；这些内容必须在后续阶段单独立项和验收。BE-010 至 BE-040 已继续实现公开读取、学生写入、组织负责人和运营 API；BE-050A 已补齐组队作者申请处理与 `/api/me/*` 聚合路径，仍不自动切换前端 fixture。

## GitHub Actions

`.github/workflows/backend-postgresql.yml` 与 `security.yml` 使用 `uv sync --frozen --group dev`。前者运行 PostgreSQL migration 与 Django suite；后者运行 production `check --deploy`、安全回归、`pip-audit` 与 `gitleaks`。它们只使用临时 CI 数据库和占位测试值，不含生产密钥或生产数据库地址。本文不声明某次远端 workflow 已绿；发布门槛必须核验目标 commit 的实际运行结果。

## Gunicorn / Nginx 接口

`deploy/systemd/campus-innovation-hub.service` 固定 Gunicorn 仅监听 `127.0.0.1:8000`，以 2 workers、30 秒 timeout/graceful timeout 运行。`deploy/nginx/campus-innovation-hub.conf` 是必须在受权部署时渲染的模板，负责 TLS、headers、body/rate limit、`/api/` 与 `/admin/` 代理以及 SPA fallback。静态 Vue SPA 仍由 Nginx 直接提供。模板、systemd unit 与 preflight 不是部署授权；真实验证、reload 与端口检查须单独批准。
