# SecurityBaseline.md

> 产品：人工智能学院科创与就业服务平台
> 状态：BE-060 至 BE-068 的实现资产已加入工作区；预发布、恢复、真实 header/S3 与目标提交 CI 尚未验证，不得据此宣称已安全上线
> 适用基线：`main@5fd5ed3bc284276057cf3442ec203412839237dc`
> 依赖：`BackendArchitecture.md`、`database-design.md`、`APIContract.md`、`EndpointReference.md`、`ProductionReadinessPlan.md`

---

# 1. 目标、边界与优先级

本文件把 V0.1 上线前安全要求变成可测试的任务和停止条件。它不改变既定的认证模型：

```text
Django Session
+ HttpOnly Secure cookie
+ 同源 CSRF
```

V0.1 不引入 JWT、localStorage/sessionStorage 认证密钥、自建 Redis、MinIO、自建 WAF 或以 UUID 代替权限判断。安全检查的唯一成功标准是可复现的代码、配置、测试和预发布证据，不是“已经加过几个 header”。

| 优先级 | 任务 | 当前事实 | 上线要求 |
|---|---|---|---|
| P0 | BE-060 Authentication Hardening | 已加入 PostgreSQL HMAC 摘要节流、`429 RATE_LIMITED`、30 天清理命令与 production 12 小时 idle Session；本轮未运行新回归 | 完成后才允许公开认证端点 |
| P0 | BE-061 Authorization & IDOR Hardening | DRF 默认权限已改为 `IsAuthenticated`；公开 API 仍显式 `AllowAny`；集中 IDOR 回归尚未执行 | 改为 Default Deny，并建立集中化 IDOR 套件 |
| P0 | BE-062 Web Security | 已加入 `production.py`、liveness/readiness、cookie/CSRF/Host 约束与前端渲染边界文档；真实 TLS/header/CSP 未验证 | 完成 HTTPS/CSRF/安全 header/CSP/XSS 发布边界 |
| P0 | BE-063 Upload & Object Storage Security | 已加入像素限制、服务器重编码及 provider-neutral S3 client；真实 bucket 未获授权且未验证 | 上传重编码、尺寸限制、Nginx 请求限制、S3 最小权限与预发布验证 |
| P0 | BE-064 Production Infrastructure Security | 已加入 Nginx/systemd/env/preflight 模板；没有服务器写入、端口扫描或运行参数证据 | 完成受版本控制的 Nginx/systemd/firewall/DB 边界和预发布探测 |
| P1 | BE-065 Logging / Audit / Backup / Monitoring | 已加入日志脱敏 formatter、Audit guard、备份/恢复脚本与运行证据模板；恢复与告警未演练 | 正式运行前完成，未完成不作长期生产承诺 |
| P1 | BE-066 Security CI & Automated Tests | 已迁移到 `pyproject.toml` + `uv.lock`，新增 deploy check、依赖审计和 secret scan workflow；远端 CI 未运行 | 合并和发布均以 CI 证据为准 |
| P1 | BE-067 Privacy / Data Protection / Release Compliance | 已加入数据清单和停用后最小匿名化 Admin 流程；实际数据处理尚未验收 | 完成数据清单、保留/注销流程和隐私验收 |
| P1 | BE-068 Final Security Penetration Checklist | 已加入预发布攻击与 Go/No-Go 模板；没有任何已填结果 | 预发布人工攻击场景与 go/no-go 记录 |

BE-060 至 BE-064 是 Production Candidate 的阻断项。BE-065 至 BE-068 不自动阻断功能开发，但阻断“长期正式运行”与最终发布批准。

---

# 2. 当前差距与不应误判为问题的内容

| 主题 | 当前证据 | 结论 |
|---|---|---|
| Session + CSRF | `ApiSessionAuthentication`、`csrf_protect` 与测试已覆盖认证写入 | 保留，不迁移 JWT |
| Cookie | production settings 显式强制 Secure、HttpOnly、SameSite=Lax 与 12 小时滑动 idle Session | 仍须实际验证 HTTPS、CSRF 与停用账号旧 Session |
| Default Deny | `REST_FRAMEWORK.DEFAULT_PERMISSION_CLASSES` 已为 `IsAuthenticated`；公开 Read View 与混合组队 View 保留显式/方法级 `AllowAny` | 仍须以匿名公开路由与 IDOR 回归保护 |
| IDOR | 组织 `orgId`、私密咨询、通知、组队联系方式已有专项断言 | 仍要集中测试所有资源，UUID 不构成授权 |
| Markdown | 契约已冻结 raw HTML 禁用、渲染后 sanitize、禁止直接 `v-html` | 前端安全 renderer 未作为生产证据交付；在其实现和浏览器验证前不得把 UGC Markdown 面向公网渲染 |
| 上传 | Pillow MIME/内容/5 MB 校验外，已加入 `16_777_216` 像素上限与重编码 | 仍须针对 AVIF、伪图片、超像素与失败补偿实际验收 |
| S3 | `S3CompatibleStorageBackend` 已通过延迟加载的 boto3 client 限定单一 bucket/prefix | 未提供实际 provider、权限策略或 preproduction 写入证据，不能当作生产能力 |
| 错误与搜索 | API 错误不返回 traceback；production settings 与日志 formatter 已加入 | 仍须检查真实 `DEBUG=false`、日志脱敏和私密数据/搜索回归 |

注册的重复账号和 inactive 登录响应已经由冻结契约分别定义为 `409 ACCOUNT_EXISTS` 与 `403 ACCOUNT_UNAVAILABLE`。BE-060 不得为了模糊的“统一文案”而改动这些既定 code/status；它应保证不返回更多账号资料，并通过节流降低枚举和撞库风险。

---

# 3. P0 安全任务

## BE-060：Authentication Hardening

**实现边界**

- 保持 Django Session；使用 `login()` 的 session key rotation 和 `logout()` 的 flush 行为，增加回归测试；
- 生产学生 Session 采用明确的 idle lifetime（建议 12 小时，最大不得超过 24 小时）；管理员更短 session、MFA 和访问来源限制列为 P1，在未完成前 `/admin/` 仅限受信任网络；
- 对登录同时施加 IP 与用户名维度的短时、非永久退避；对注册施加 IP 节流。计数不得保存明文密码；若存储 IP/用户名标识，使用独立的 HMAC key 生成摘要，并规定短保留期；
- 必须防止已停用账户继续使用旧 session，测试真实 Session 在 `is_active=false` 后访问受限 API 的结果；
- 限流命中使用统一 `429` 与新增的 `RATE_LIMITED` 错误契约，不向客户端显示失败次数、锁定原因或账号状态。

**验收**

```text
匿名/无 CSRF/正常同源登录与登出行为均保持 API 契约
登录后 session key 已轮换，登出后 session 失效
失效账户不能用旧 session 调用认证 API
IP、用户名、注册三种阈值分别可测试；成功登录按规则清除或衰减失败状态
429 response 不泄露用户是否存在或内部 throttle 数据
```

## BE-061：Authorization & IDOR Hardening

**实现边界**

- `REST_FRAMEWORK.DEFAULT_PERMISSION_CLASSES` 改为 `IsAuthenticated`；所有允许匿名的 DRF View 显式 `AllowAny`，组队混合 GET/写 View 保持 method-aware permission；
- 建立 `backend/tests/security/test_authorization.py` 与 `test_idor.py`。集中覆盖 TeamPost、TeamApplication、RecruitmentApplication、Registration、Consultation、Notification、Organization、Recruitment、运营 API；
- 读取私密资源时优先以 `404 NOT_FOUND` 隐藏不存在或无权的事实；写入按既定 `403` / `409` / `422` 契约返回；
- 所有 Serializer 按 PUBLIC、INTERNAL、SENSITIVE 审计，不使用 `fields = "__all__"`。重点断言姓名/学号/班级、联系方式、报名快照、申请正文、`object_key`、哈希和其他人的私密咨询不泄露。

**验收**

```text
匿名公开 API 全部仍可读；未显式公开的新 API 默认 401
学生 A 不能处理学生 B 的申请、通知、注册或 TeamPost
组织 A 的 LEADER 与 OPERATOR 均不能越过 organization_id 管理组织 B
MEMBER 不能调用 LEADER API；SUPERADMIN 的例外经过显式测试
公开响应递归扫描不存在敏感字段
```

## BE-062：Web Security

**实现边界**

- 新增 `config.settings.production`，显式 `DEBUG=False`、精确 `ALLOWED_HOSTS`、精确 `CSRF_TRUSTED_ORIGINS`、`SECURE_PROXY_SSL_HEADER`、`SECURE_SSL_REDIRECT`、Secure/HttpOnly/SameSite cookie、`SECURE_CONTENT_TYPE_NOSNIFF=True` 与 `X_FRAME_OPTIONS="DENY"`；
- HSTS 仅在 TLS 预发布验证后按 `300` 秒起步，再评审升级到一年；不得直接设置 preload 或 `includeSubDomains`；
- Nginx 统一管理 `X-Content-Type-Options`、`Referrer-Policy: strict-origin-when-cross-origin`、`X-Frame-Options: DENY` 与 `Permissions-Policy: camera=(), microphone=(), geolocation=()`，避免 Django/Nginx 重复且冲突；
- 先用 CSP `Content-Security-Policy-Report-Only`，根据最终 Vue 生产构建、媒体域名和安全 Markdown renderer 验证后才强制执行；至少包含 `default-src 'self'`、`script-src 'self'`、`connect-src 'self'`、`object-src 'none'`、`base-uri 'self'`、`form-action 'self'`、`frame-ancestors 'none'`；
- 禁止 CORS wildcard。现有同源 Nginx + Vite proxy 架构不需 CORS；所有 `next` / internal path 输入仅允许本站绝对路径，不允许 scheme-relative、`http(s)` 或 `javascript:`。

**验收**

```text
production settings 下 manage.py check --deploy 通过
HTTP 被安全重定向，代理 HTTPS 不形成 redirect loop
Cookie、CSRF、Host、Origin/Referer 测试符合契约
Nginx -t 通过，响应 headers 与 CSP Report-Only 均实际可见
恶意 Markdown / javascript URL / open redirect payload 通过后端与已实现的前端渲染边界测试
```

## BE-063：Upload & Object Storage Security

**实现边界**

- Django 限制 JSON 请求最大 1 MB，图片上传最大 5 MB；Nginx 普通 API `client_max_body_size 1m`，媒体上传 location 为 `6m`；
- 维持扩展名不可信、MIME 与实际解码格式双校验、UUID object key 与禁止 SVG；增加最多 `16_777_216` 像素的解码限制；
- 图片必须经 Pillow 成功完整解码后重编码为服务器允许格式再存储，以删除非必要元数据和多余容器内容；重编码失败不写 MediaAsset 或对象；
- 完成一个 S3-compatible client factory；供应商凭据仅有指定 bucket/prefix 的最小 `PutObject`、必要 `GetObject` / `DeleteObject` 权限，禁止匿名写入和 bucket list；
- 预发布 bucket 使用真实上传、公开读取、失败补偿删除和不可列举验证。MediaRef/上传响应永不返回 object key、哈希、bucket 或 credential。

**验收**

```text
伪造 MIME、伪图片、SVG、超尺寸、超像素、路径穿越和元数据写入失败均安全失败
存储对象可由服务器重新解码，响应不泄露存储内部字段
local 与 s3 的单元/合同测试通过；真实预发布 bucket smoke test 有脱敏记录
```

## BE-064：Production Infrastructure Security

**实现边界**

- 版本控制 `deploy/` 中的 Nginx、Gunicorn systemd、生产环境变量示例、备份/恢复和回滚说明；Gunicorn 只绑定 `127.0.0.1:8000`，worker 起步为 2，显式 timeout、graceful timeout、max-requests 与 jitter；
- Nginx 在 SPA fallback 前代理 `/api/` 与 `/admin/`；对登录、注册、搜索、上传设置独立、经预发布校准的粗粒度 rate limit，避免对校园 NAT 的全站低阈值限流；
- PostgreSQL 只在 loopback/内网监听，使用非 `postgres` 的专用应用账号；生产防火墙仅开放 80/443 和受限 SSH，8000/5432 不公开；
- 禁止 root/password SSH，启用 SSH key、时间同步、安全更新；Admin 仅 SUPERADMIN，且在 MFA/P1 完成前限制 VPN/校园网/IP allowlist；
- `GET /api/health` 仅作 liveness；新增内部/受限 readiness probe 只确认应用可访问数据库，不输出版本、主机、URL 或凭据。

**验收**

```text
nginx -t、systemd unit、production Django check、静态文件和 API/ADMIN 路由均在预发布实际验证
端口扫描只显示授权入口；Gunicorn/PostgreSQL 不可从公网访问
限流、请求体限制、超时与 graceful restart 有预发布证据
```

---

# 4. P1 / P2 与最终发布

## BE-065 至 BE-068（P1，正式运行前完成）

- **BE-065：** Nginx/Django 安全日志、AuditLog 覆盖矩阵、日志脱敏、日常加密备份、隔离恢复演练、对象存储生命周期与告警；
- **BE-066：** GitHub Actions 增加 production `check --deploy`、锁定依赖审计、secret scanning 与集中安全测试；工具必须有明确失败门槛，不能只增加徽章；
- **BE-067：** 新建 `DataInventory.md`，记录姓名、学号、班级、联系方式、申请、报名、私密咨询、IP/安全日志的级别、用途、访问者、保留期和删除方式；账号注销采用申请→管理员确认→停用/最小化匿名化，不做 `DELETE CASCADE`；
- **BE-068：** 在预发布人工演练暴力登录、重复注册、XSS、伪图片/SVG/大 body、路径穿越、跨用户 UUID、跨组织管理、伪造 CSRF、私密搜索、开放重定向和分页资源耗尽，并记录 go/no-go。

P2（有规模后）才评估校级 WAF/CDN、行为异常检测、管理员 WebAuthn、专业 SIEM 与分离 runtime/migration 数据库账号。它们不应替代 P0 的正确权限、输入校验和最小暴露面。

---

# 5. 与 BE-050 的关系与停止条件

BE-050A 先解决已冻结业务契约的精确 DTO；BE-060 至 BE-064 可与其并行设计，但必须在任何预发布部署前完成。BE-065 至 BE-068 完成后才进入最终发布决策。任何一项 P0 验收失败、CI 不绿、预发布上传/恢复/安全 header 验证缺失，均停止在预发布，不修改生产服务。
