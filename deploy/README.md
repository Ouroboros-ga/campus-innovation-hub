# 生产部署边界

> 状态：版本化配置模板，尚未部署。所有真实域名、证书路径、bucket、数据库 URL、管理网段和服务器地址仅进入受控部署环境。

## 1. 组件边界

```text
Internet -> Nginx :80/:443 -> Gunicorn 127.0.0.1:8000 -> PostgreSQL 内网或 loopback
```

- Gunicorn 与 PostgreSQL 不得向公网监听；防火墙只开放 80/443 与受限 SSH（22）；
- 使用专用 `campus-hub` Linux 用户和非 `postgres` 的应用数据库账号；
- `/api/health` 是公开 liveness，`/api/ready` 仅允许 Nginx loopback 探针；
- `/admin/` 除 Django SUPERADMIN 外，还必须由 `__ADMIN_ALLOWLIST_INCLUDE__` 渲染为 VPN、校园网或审批管理网段；
- `campus-innovation-hub.conf` 是模板。与其一同安装受版本控制的 `nginx/proxy-headers.conf` 到 `/etc/nginx/snippets/campus-proxy-headers.conf`；该片段固定传递 `Host`、`X-Forwarded-For`、`X-Forwarded-Proto` 与 `X-Real-IP`。不得把未渲染模板直接加载到 Nginx。

## 2. 预发布顺序

1. 由受权人员从 `deploy/env/campus-innovation-hub.production.env.example` 创建权限为 `0640` 的环境文件；招新期如需新学生注册后立即登录，显式设置 `STUDENT_REGISTRATION_AUTO_ACTIVATE=true`，结束后可切回 `false` 恢复人工审核；
2. 使用准确主机、TLS 证书、前端静态目录、媒体策略和 Admin allowlist 渲染 Nginx 模板；
3. 安装受版本控制的 systemd unit，再用 `DEPLOY_PREFLIGHT_AUTHORIZED=1 deploy/scripts/preflight.sh --check-only` 校验已渲染文件；
4. 单独授权后才可执行 `collectstatic`、migration、systemd reload/restart 或 Nginx reload；
5. 记录 HTTPS 重定向、headers、登录、上传体积边界、静态资源、liveness/readiness 与公网端口暴露的脱敏证据。

## 3. 回滚与非目标

发布必须以不可变 release 目录和前一目标 SHA 回滚；回滚前确认 migration 是否向后兼容。此仓库不在 2C2G 主机引入 Redis、MinIO、消息队列、WAF 或额外 Node runtime。

## 4. 无域名阶段：SSH 隧道开发运行面

没有域名与 TLS 证书时，不得加载本目录的生产 Nginx TLS 模板，也不得开放 HTTP API。本项目提供独立的开发运行面：

```text
浏览器 localhost:5173 -> Vite /api、/media proxy -> localhost:18000
    -> SSH 隧道 -> Gunicorn 127.0.0.1:8000 -> PostgreSQL 127.0.0.1:5432
```

- `systemd/campus-innovation-hub-dev.service` 与未来生产 unit 名称不同，只读取 `/etc/campus-innovation-hub/development.env`；
- `scripts/provision-development.sh` 只接受 `/opt/campus-innovation-hub-dev/releases/<Git SHA>` 中的干净 Git checkout，创建独立 Docker volume、数据库、服务用户、媒体目录和应用密钥；不会触碰 `/opt/campus-innovation-hub-be*`、Judge0、Nginx、TLS 或防火墙；
- 先在已授权服务器以 root 执行 `deploy/scripts/install-uv.sh`，再运行 provision 脚本。脚本固定 uv `0.11.24`，使用提交的 `uv.lock`；
- 当服务器到 PyPI CDN 的链路较慢时，开发环境固定 `UV_HTTP_TIMEOUT=120`；仍只执行 `uv sync --frozen --group dev`，不改包源、依赖版本或 lockfile；
- `scripts/start-development-tunnel.ps1` 在 Windows 前台建立 `127.0.0.1:18000 -> 服务器 127.0.0.1:8000`。Vite 使用 `DEV_API_PROXY_TARGET`，默认即为该本机地址；
- development settings 只允许 `http://localhost:<port>` 与 `http://127.0.0.1:<port>` 作为 `DJANGO_CSRF_TRUSTED_ORIGINS`。浏览器仍始终访问 Vite 的同源 `/api`，不需要 CORS。

该阶段的成功标准仅是服务器 loopback `/api/health`、`/api/ready` 与本机 SSH 隧道 health 均可用。媒体公开读取、Django Admin 静态资源、Nginx Header/TLS、对象存储和任何公网入口等待单独评审。

#### 4.1 仅 loopback 的内部 Nginx 校验层（可选）

不改变 4.0 的 SSH 隧道开发路径。在获得域名 / TLS 证书前，如需在"生产形状"的请求链上验证静态资源、`/api` 反代、`/media` 与安全头，可部署只监听 `127.0.0.1:8080` 的 loopback Nginx：

```text
浏览器可选 -> loopback Nginx 127.0.0.1:8080 -> Gunicorn 127.0.0.1:8000
             （serve SPA dist、/api 反代、/media、安全头；不开放公网端口）
```

- 安装 `deploy/nginx/campus-innovation-hub-loopback.conf`，不渲染、不加载生产 TLS 模板，不做 80/443 监听；
- 安装 `deploy/nginx/proxy-headers.conf` 到 `/etc/nginx/snippets/campus-proxy-headers.conf`；
- 前置：服务器需有 build-time Node 22+ 与 pnpm，前端生产构建产物位于 `/opt/campus-innovation-hub-dev/current/frontend/dist`；
- 先 `nginx -t` 通过，再 `systemctl enable nginx && systemctl restart nginx`；确认 `0.0.0.0:80/443` 未监听；
- 边界：PostgreSQL / Gunicorn 仍仅 loopback；Django Admin `/static` 与 `collectstatic`、HTTPS、对象存储与任何公网入口仍等待生产 settings 与域名。

#### 4.2 临时公网 HTTP 层（无域名 / 无 TLS，需单独授权）

在获得域名 / TLS 证书前，如需对外临时展示，可启用只监听 `0.0.0.0:80` 的临时层（无 443 / 无 TLS，明文 HTTP）。该层与 4.1 的 loopback 校验层、4.0 的 SSH 隧道并行存在：

```text
Internet -> 临时 Nginx 0.0.0.0:80 -> 临时 Gunicorn 127.0.0.1:8001 -> PostgreSQL 127.0.0.1:5432
```

- 临时后端使用 `deploy/systemd/campus-innovation-hub-temp.service`，绑定 `127.0.0.1:8001`，env 为 `/etc/campus-innovation-hub/temporary.env`；
- 需要临时 settings：`config.settings.temporary`（`backend/config/settings/temporary.py`）；`DJANGO_DEBUG=false`、关闭 SSL 重定向与 Secure Cookie、允许 HTTP origin——仅供临时展示，非生产配置；
- 外部入口使用 `deploy/nginx/campus-innovation-hub-temp.conf`（模板，渲染 `__PUBLIC_IP__`）与 `deploy/nginx/campus-admin-allow.conf`（模板，渲染 `__ADMIN_IP__`）；
- `/admin` 仅允许 `__ADMIN_IP__` 授信来源与 loopback；`/api/ready` 仅 loopback；`limit_req` 使用 `campus_temp_*` 独立 zone 名，避免与 loopback 站点冲突；
- **一键重放**（在仓库根目录、本机可 SSH 到服务器时运行）：

```bash
./deploy/scripts/provision-temporary-public.sh --admin-ip <ADMIN_IP> [--public-ip <IP>] [--server root@<host>]
```

该脚本会：装配临时 settings → 生成 `temporary.env`（复用 dev 密钥）→ `collectstatic` → 安装/重启 temp 单元 → 渲染并安装临时 Nginx 站点与 admin 白名单 → `nginx -t` + reload → 健康检查。可安全重复执行（幂等）。

- 边界：明文 HTTP，无 TLS；仅限临时展示，一旦灌入真实数据应即刻下线。生产公开暴露仍须域名 + TLS + production settings（见 §2、§3）。
