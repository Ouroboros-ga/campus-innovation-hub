# BackendArchitecture.md

> 产品：人工智能学院科创与就业服务平台
> 仓库：campus-innovation-hub
> 文档版本：0.2
> 状态：BE-000 Spec Frozen；BE-000 至 BE-050A 已实现；BE-060 至 BE-068 已形成实现资产，尚未完成预发布运行证据
> 产品里程碑：V0.1
> 职责：定义 Django 后端的运行时边界、认证与权限、媒体、内容安全、服务边界、测试与部署约束
> 上游事实来源：docs/product/PRD.md、docs/product/PageMap.md、docs/backend/database-design.md、docs/api/APIContract.md
> 下游约束对象：backend/、Django Models、DRF Serializer/View、Service、Django Admin、测试、部署配置

---

# 0. 文档职责与优先级

本文件定义后端如何实现既有产品、数据与 HTTP 契约；它不新增业务字段、不替代数据库设计，也不改变页面行为。

冲突时按以下顺序处理：

1. 已冻结的当前任务决策；
2. docs/backend/database-design.md 的数据结构、约束与状态机；
3. docs/api/APIContract.md 的 HTTP 方法、路径与 DTO；
4. docs/product/PRD.md 与 docs/product/PageMap.md 的产品行为；
5. 本文的代码组织、运行时与安全实现边界。

如果实现发现契约矛盾：停止实现，记录最小差异，先更新事实来源文档，再同步代码；不得由 View、Serializer 或前端临时兼容来掩盖矛盾。

---

# 1. 运行时与部署拓扑

V0.1 固定为：

~~~text
Vue SPA 静态产物
        |
      Nginx
   /          \
静态文件      /api/
               |
        Gunicorn + Django + DRF
               |
          PostgreSQL
               |
    托管对象存储（仅媒体二进制）
~~~

生产是同源部署：

~~~text
https://platform.example.edu/       -> Vue dist
https://platform.example.edu/api/*  -> Django
~~~

因此：

- 生产不配置跨域 CORS；
- Django Session 与 CSRF 都按同源模式工作；
- Nginx 不把 PostgreSQL 暴露给公网；
- 前端不需要、也不得保存长期 token；
- Django 不服务前端 Node 运行时或 SSR。

服务器约为 2 CPU / 2 GB RAM。V0.1 不引入 Redis、Celery、Kafka、RabbitMQ、Elasticsearch、Kubernetes、WebSocket、PWA、微服务或自建 MinIO。定时提醒若启用，使用 Django management command 加 systemd timer 或 cron。

---

# 2. 代码与依赖基线

BE-001 创建 backend/ 后使用：

~~~text
Python 3.12
Django 5.2 LTS 系列
Django REST Framework 3.18 系列
PostgreSQL
Gunicorn（生产 WSGI）
~~~

依赖由 `backend/pyproject.toml` 声明、`backend/uv.lock` 锁定；开发组依赖使用 uv `dev` group，真实密钥不进入仓库。Windows 开发通过 `uv run --frozen` 使用项目 `.venv`，不依赖系统 Python 的 Store stub。

目标目录：

~~~text
backend/
├─ config/                 # Django settings、根 URL、ASGI/WSGI
├─ apps/
│  ├─ accounts/
│  ├─ media/
│  ├─ organizations/
│  ├─ competitions/
│  ├─ teams/
│  ├─ activities/
│  ├─ content/
│  ├─ consultations/
│  ├─ notifications/
│  └─ audit/
├─ tests/                  # 跨 app、HTTP 与事务测试
├─ pyproject.toml
├─ uv.lock
└─ manage.py
~~~

业务 app 划分与 database-design.md 第 30 节一致。页面不直接决定数据库查询；DRF View 只负责 HTTP 编排，复杂跨表逻辑放入同领域 Service。

---

# 3. 配置与密钥

所有环境配置经环境变量注入；仓库只提交 .env.example，不提交密码、数据库凭据、Django SECRET_KEY、Session 密钥、S3 访问密钥或生产地址。

BE-001 至少定义：

~~~text
DJANGO_SETTINGS_MODULE
DJANGO_SECRET_KEY
AUTH_THROTTLE_HMAC_KEY
DJANGO_DEBUG
DJANGO_ALLOWED_HOSTS
DJANGO_CSRF_TRUSTED_ORIGINS
DJANGO_STATIC_ROOT
DJANGO_SECURE_HSTS_SECONDS
DATABASE_URL
MEDIA_STORAGE_BACKEND=local|s3
MEDIA_URL
MEDIA_S3_ENDPOINT_URL
MEDIA_S3_BUCKET
MEDIA_S3_ACCESS_KEY_ID
MEDIA_S3_SECRET_ACCESS_KEY
MEDIA_S3_REGION
MEDIA_S3_OBJECT_PREFIX
~~~

只有 `MEDIA_STORAGE_BACKEND=s3` 时才要求 `MEDIA_S3_*` 变量。production settings 强制 HTTPS、精确 Host/CSRF origin、Secure/HttpOnly/SameSite=Lax cookie 与 12 小时滑动 idle Session；开发可关闭 Secure 以支持 localhost，但不得改变 Session 与 CSRF 的认证模型。

当前仓库已有 `config.settings.production`、延迟加载的 S3-compatible client 和受版本控制的反向代理模板。它们必须由授权部署环境提供准确变量、TLS、bucket 权限和公开媒体基地址；在预发布真实上传/删除与网络验证完成前，不得仅通过设定 `MEDIA_STORAGE_BACKEND=s3` 宣称可用。

上线前安全任务、P0/P1 分类和验收由 [`SecurityBaseline.md`](SecurityBaseline.md) 约束。特别是 DRF Default Deny、生产 TLS/CSRF 配置、上传重编码/对象存储、部署网络边界与预发布证据均不可由这份架构目标文字替代。

---

# 4. 认证、注册与账户审核

## 4.1 固定认证模型

V0.1 固定为 Django Session：

~~~text
Django Session
+ HttpOnly session cookie
+ 同源 CSRF cookie
+ POST / PATCH / DELETE 携带 X-CSRFToken
~~~

CSRF cookie 不是认证密钥；前端只读取它并将其镜像到 X-CSRFToken。Session cookie 不向 JavaScript 暴露。后端对每个受保护端点独立验证 Session 和权限，前端 route guard 只承担 UX。

认证端点固定为：

~~~text
GET  /api/auth/csrf
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
~~~

GET /api/auth/csrf 必须确保浏览器取得 CSRF cookie，并返回 204。未登录写请求统一返回 401；CSRF 校验失败使用统一 API 错误结构返回 403。

## 4.2 自助注册与启用策略

注册请求固定使用：

~~~json
{
  "student_no": "20240001",
  "real_name": "张三",
  "password": "..."
}
~~~

注册 Service 在一个事务中：

1. 校验学号、姓名与密码；
2. 创建 Custom User，username 固定等于 student_no；
3. 设置 `platform_role=USER`，并按 `STUDENT_REGISTRATION_AUTO_ACTIVATE` 决定 `is_active`；
4. 创建空的 UserProfile；
5. 返回与实际激活状态一致的 `active` 或 `pending_approval`。

注册成功并不登录，也不创建 Session。招新期 production 开启自动启用时返回：

~~~json
{
  "status": "active",
  "message": "注册成功，现在可以登录。"
}
~~~

自动启用关闭时返回 `pending_approval`，SUPERADMIN 只通过 Django Admin 审核并启用账号。V0.1 不建立独立审核工作流、邮件、短信验证码、学生目录校验或学校统一身份认证。

任何 inactive 账号登录都返回相同的 403 ACCOUNT_UNAVAILABLE 与“账号尚未启用，请联系管理员。”，不向外区分待审核、被停用或其他内部状态。重复注册使用 409 ACCOUNT_EXISTS，且不泄露已有账号的额外资料。忘记密码固定显示“请联系管理员”，不实现自助重置端点。

## 4.3 权限模型

有效平台角色只从以下事实计算：

~~~text
is_superuser=true  -> SUPERADMIN
otherwise          -> platform_role (STUDENT 或 OPERATOR)
~~~

组织权限严格由 OrganizationMembership 的 active、organization_id 与 role 共同决定：

~~~text
LEADER / MEMBER 仅在对应 organization_id 内有效
title 只是显示数据，不是权限原语
OPERATOR 不自动获得任何组织 LEADER 权限
~~~

Django Admin 用于 SUPERADMIN 的用户、角色和系统级数据管理；V0.1 不创建等价的超级管理员前端。

## 4.4 Django Admin 是 SUPERADMIN 的内部工作台

`/admin/` 由同一 Django 部署提供，Nginx 必须在 SPA fallback 之前将该路径代理给 Django。它不是 Vue Router 页面，也不从学生端一级导航暴露。

Admin 登录权限固定为：

~~~text
is_active=true
AND is_staff=true
~~~

V0.1 的 SUPERADMIN 必须同时拥有：

~~~text
is_superuser=true
is_staff=true
~~~

`is_superuser` 是系统级权限事实，`is_staff` 仅使该受信任账号能进入 Django Admin；OPERATOR 不得因 `platform_role=OPERATOR` 自动获得 `is_staff`、Admin 登录或用户权限管理。

BE-004 在各 Django app 的 `admin.py` 注册 ModelAdmin：

- User：按 `is_active`、`platform_role` 筛选；待审核用户提供受审计的启用操作；密码哈希、会话等敏感字段不进入列表展示；
- Organization 与 OrganizationMembership：创建/配置组织、分配或撤销 LEADER；
- Content、Activity、Competition、MediaAsset、Notification：系统级查阅与必要维护；
- AuditLog：只读，不允许通过 Admin 新建、编辑或删除。

Django Admin 适合上述可信内部的模型型维护；OPERATOR 日常的“发布动态、管理活动、回复咨询”等流程仍在 `/ops` 的任务导向界面完成。

---

# 5. 标识与公共路由

所有正式实体的 canonical identifier 固定为 UUID v4，包括 User、Organization、Competition、TeamPost、Recruitment、Activity、Guide、Consultation、Notification 与 MediaAsset。

~~~text
/api/competitions/550e8400-e29b-41d4-a716-446655440000
/competitions/550e8400-e29b-41d4-a716-446655440000
~~~

不实现 slug、中文转写、slug 历史跳转或 UUID/slug 双查找。前端 fixture 中的 csdc-2026 等字符串只是在 Mock 阶段使用的 ID，不构成生产 URL 或数据库契约；FE-100+ 接口集成前必须转换为 UUID fixture。

UUID 不是权限保护手段。所有对象读取与写入仍按公开状态、Session、隐私分级和角色验证。

---

# 6. 媒体与对象存储

PostgreSQL 只保存 MediaAsset 元数据与 object_key，不保存二进制文件。业务 Model 只通过 MediaAsset 外键关联头像、Logo、Banner、竞赛封面与活动封面。

存储抽象固定为：

~~~text
ObjectStorage
├─ LocalStorageBackend          # development only
└─ S3CompatibleStorageBackend   # production
~~~

ObjectStorage 对业务 Service 只提供保存、读取 URL 与删除的语义；Competition、Activity、Organization 和 Serializer 不得直接调用任何云厂商 SDK。

~~~text
save(file, object_key, content_type) -> StoredObject
public_url(object_key) -> URL
delete(object_key) -> None
~~~

开发通过 MEDIA_STORAGE_BACKEND=local 使用 LocalStorageBackend。生产通过 MEDIA_STORAGE_BACKEND=s3 使用任意托管 S3-compatible 服务，供应商由部署环境选择；阿里云优先 OSS、腾讯云优先 COS、海外环境可使用 R2 或 AWS S3。不得在 2C2G 应用服务器部署 MinIO。

上传由 Django 服务端接收 multipart/form-data，图片仅允许 jpg、jpeg、png、webp 与 avif，单文件最大 5 MB。服务端校验 MIME、文件内容、大小与图片尺寸；客户端限制仅是 UX。

所有公开 API 使用：

~~~json
{
  "id": "uuid",
  "url": "https://media.example.edu/path/image.webp"
}
~~~

该对象名为 MediaRef。公开 DTO 不返回 object_key、创建者、sha256、删除状态或存储供应商信息。写入 DTO 仍可接受明确命名的 *_asset_id 来引用已上传 MediaAsset。

---

# 7. Markdown 与内容安全

所有运营正文、介绍、指南、FAQ、咨询和回复以 Markdown source 为唯一 canonical source。API 返回 body_md、description_md 等 Markdown 字段，不以未清洗 HTML 作为数据库事实或传输事实。

渲染边界必须同时满足：

1. Markdown renderer 默认禁用 raw HTML；
2. Markdown 转为 HTML 后再执行 sanitize；
3. 未受信任的正文不得使用 Vue v-html 直接插入；
4. 链接、图片 URL 与嵌入内容遵循白名单策略；
5. Django Admin 的预览若存在，使用相同的禁用 raw HTML 与 sanitize 策略。

前端的安全渲染组件在 FE-060/FE-100+ 前实现；后端负责存储长度校验、传输 Markdown 源与不生成未清洗 HTML。

---

# 8. 首页与查询模型

GET /api/home 是 PUBLIC Read Model，不是数据库模型。它固定聚合：

~~~text
banners
deadlines
featured_competitions
announcements
featured_guides
team_posts
recruiting_organizations
activities
faqs
~~~

每个模块使用 database-design.md 第 23 节的固定上限，查询来自真实领域表、发布状态和派生时间状态。不得为首页新增 HomePageData、homepage_stats、hot_rank、trending_score 或 hot_score 表。

首页 API 由后端控制 select_related、prefetch_related、排序与限数；前端不以九个首屏请求替代它。

---

# 9. Service、事务与通知边界

Model 负责字段、Constraint 与局部纯校验。下列跨表流程必须以可测试的 Service 实现，DRF View 不得内联堆叠数据库写入：

~~~text
accept_team_application()
accept_recruitment_application()
register_activity()
cancel_activity_registration()
create_activity_with_announcement()
publish_competition()
grant_organization_leader()
register_student_user()
~~~

事务要求：

- 活动报名：transaction.atomic、锁定 Activity、读取或复用唯一 Registration、检查容量与窗口；
- 活动并同步公告：transaction.atomic 创建 Activity 与 `activity_id` 已绑定的 Announcement；按同一 `publish` 决策同时落为 DRAFT 或 PUBLISHED，任一失败整体回滚，并分别写 AuditLog；
- 接受组队申请：锁定 TeamPost 和申请、重算已接受人数和岗位名额、更新 FULL 状态、创建通知；
- 接受招新申请：锁定申请与岗位或招新、检查容量、创建或激活 Membership、创建通知；
- 注册：一次创建 User 和 Profile；新 User 的 `is_active` 由 `STUDENT_REGISTRATION_AUTO_ACTIVATE` 决定。

Notification 只使用数据库记录；提醒任务若启用由 management command 生成，不依赖 WebSocket 或实时消息中间件。公开 Announcement 与按用户 `recipient` 存储的 Notification 分离：普通公告发布不广播到消息中心，活动取消、临近提醒和申请状态变化才向明确受影响人群创建 Notification。

---

# 10. 测试与质量边界

Django 测试使用 PostgreSQL 开发/测试数据库。SQLite 不能作为以下行为的唯一验证：

~~~text
partial unique constraint
jsonb
select_for_update
活动容量并发
PostgreSQL 索引
Migration
~~~

BE-001 建立健康检查和测试基础设施；BE-003 与 BE-006 必须覆盖约束、Migration、账户审核、权限、隐私过滤、事务 Service 与并发容量。每个后端任务完成前审查 git diff --check，并且只提交本任务文件。

---

# 11. 前后端并行边界

Frontend 继续执行 FE-008 至 FE-090，持续使用类型化 fixture。BE-010 至 BE-040 的公开读取、既定学生写入、组织负责人和运营 API 已有实现；但 API 稳定只适用于已交付的领域，不能泛化为“全部契约端点已可联调”。

BE-050A 已注册组队作者申请处理和 `/api/me/*` 个人中心路径，但前端仍须在 FE-100+ 的明确评审后按域切换真实 API。前端也不得根据开发环境的本地媒体目录假定生产对象存储可写。

前端只在 FE-100+ 且 APIContract 已评审后，按领域逐步接入共享 HTTP client、Feature API module 与 composable。后端不得提前修改前端页面、fixture 或 Pinia 来模拟联调。

---

# 12. V0.1 明确不做

~~~text
学校统一认证
学生名单自动校验
邮件、短信或验证码找回密码
slug
直接申请组织
自建 MinIO
文件二进制写入 PostgreSQL
Redis / Celery / 消息队列
WebSocket / 即时聊天 / 私信
首页统计或热度表
成果中心与就业岗位表
~~~
