# BE-001 / BE-002 Backend Foundation

本目录包含 BE-001 的 Django / Django REST Framework 基础设施，以及 BE-002 的账户与同源 Session 认证：PostgreSQL 配置、健康检查、统一 API 错误结构、Custom User、待审核注册、CSRF、Session 和最小账户审核 Admin。不包含 Media、Organization、Competition 或其他领域 Model / API。

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

`/api/auth/me` 只返回当前用户的 `student_no` 与 `real_name`，不返回 password、email、class_name、password hash、Session 或 CSRF 值。BE-002 尚未建立 Media 和 OrganizationMembership，因此 `profile.avatar` 为 `null`、`organization_memberships` 为空数组；BE-003 以真实关系补齐它们。

`/admin/` 已提供受信任 SUPERADMIN 的最小账户审核入口，可启用待审核账号；全域 ModelAdmin、组织权限和审计记录仍属于后续 BE。

## Gunicorn / Nginx 接口

Linux 进程管理器应从 `backend/` 工作目录启动 Gunicorn，并仅监听回环地址：

```bash
gunicorn config.wsgi:application --bind 127.0.0.1:8000 --workers 2 --timeout 30
```

Nginx 负责 TLS 终止，并把 `/api/` 请求反向代理到该 Gunicorn 地址，同时传递 `Host`、`X-Forwarded-For` 与 `X-Forwarded-Proto`。静态 Vue SPA 仍由 Nginx 直接提供。具体生产部署不属于 BE-001。
