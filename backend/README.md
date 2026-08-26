# BE-001 至 BE-005 Backend Foundation

本目录包含 Django / Django REST Framework 基础设施、账户与同源 Session 认证、V0.1 全部领域 Model、Django Admin，以及权限和事务 Service。当前仍不包含业务 DRF Serializer / ViewSet / URL，也不切换前端 fixture；业务纵切片必须在用户明确启动后按“竞赛 → 组队 → 组织招新 → 校园动态 → 内容/咨询/消息 → 运营与组织工作台”执行。

## 运行环境

```text
Python 3.12
Django 5.2.17
Django REST Framework 3.18.0
PostgreSQL 16 或兼容版本
```

在 `backend/` 内创建并安装虚拟环境：

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements\development.txt
```

## 环境变量

以 `.env.example` 为变量清单。Django 设置只读取进程环境变量，仓库不会自动加载 `.env` 文件；本地开发可由 IDE、shell 或安全的环境变量加载工具注入。

必填变量：

```text
DJANGO_SETTINGS_MODULE=config.settings.development
DJANGO_SECRET_KEY=<仅本地或部署环境持有的随机密钥>
DJANGO_DEBUG=true|false
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
```

`DATABASE_URL` 只接受 `postgres://` 或 `postgresql://`。SQLite URL 会在启动时被拒绝，防止 PostgreSQL 语义被本地替代掩盖。

## 本地检查与测试

在 PowerShell 为当前会话注入上述变量后执行：

```powershell
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py test -v 2
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
POST /api/auth/register  {student_no, real_name, password}，201 pending_approval，不登录
POST /api/auth/login     {username, password}，200 CurrentUser + HttpOnly Session cookie
POST /api/auth/logout    登录 + CSRF，204，清理 Session
GET  /api/auth/me        登录，200 CurrentUser
```

注册在同一事务创建 `accounts.User(is_active=false)` 和空 `UserProfile`；inactive 账号登录始终返回 `403 ACCOUNT_UNAVAILABLE`，不会建立 Session。Custom User 采用 UUID primary key、`student_no` PostgreSQL partial unique 与 `platform_role` / `is_active` 索引。

`/api/auth/me` 只返回当前用户的 `student_no` 与 `real_name`，不返回 password、email、class_name、password hash、Session 或 CSRF 值。`organization_memberships` 现在只返回当前用户的 active Membership（`organization_id`、`MEMBER|LEADER`、展示 title）；`profile.avatar` 在对象存储和 MediaRef URL 实现前仍为 `null`。

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

完整功能套件及其精确计数以服务器最终输出为准；PostgreSQL `TransactionTestCase` 覆盖 partial unique、关键索引 introspection、活动容量、组队容量和同组织跨招新轮次 Membership 创建竞态。临时数据库、容器和网络在验证后清理；不会接触服务器已有服务。

## Gunicorn / Nginx 接口

Linux 进程管理器应从 `backend/` 工作目录启动 Gunicorn，并仅监听回环地址：

```bash
gunicorn config.wsgi:application --bind 127.0.0.1:8000 --workers 2 --timeout 30
```

Nginx 负责 TLS 终止，并把 `/api/` 请求反向代理到该 Gunicorn 地址，同时传递 `Host`、`X-Forwarded-For` 与 `X-Forwarded-Proto`。静态 Vue SPA 仍由 Nginx 直接提供。具体生产部署不属于 BE-001。
