# BackendImplementationPlan.md

> 产品：人工智能学院科创与就业服务平台
> 仓库：campus-innovation-hub
> 文档版本：0.2
> 状态：BE-000 至 BE-050A 产品缺口收口已实现；BE-060 至 BE-068 的代码、配置与文档资产已实现，运行证据仍未取得
> 实现基线：`main@5fd5ed3bc284276057cf3442ec203412839237dc`；本状态不等同于生产环境已发布
> 执行模型：一次只执行一个 BE 任务
> Locale：简体中文（zh-CN）
> 前置规范：BackendArchitecture.md、database-design.md、APIContract.md、PRD.md、PageMap.md

---

# 0. 目的与执行纪律

本计划把 V0.1 Django 后端拆成小而可验证的任务。每项任务完成后必须停止，不得自动执行下一项。除非任务明确要求，后端工作不得修改 frontend/、替换 fixture、建立 FE-100 API 集成、格式化用户未提交的前端文件或混入无关提交。

后端任务开始前必须：

1. 阅读 AGENTS.md；
2. 阅读 BackendArchitecture.md；
3. 阅读任务相关的 database-design.md、APIContract.md、PRD.md 与 PageMap.md；
4. 检查 git status、现有 backend/、依赖文件与当前 Postgres 配置；
5. 明确当前任务范围与停止条件。

所有 Model、Serializer、Migration、API 与测试使用简体中文文档说明；代码标识符使用清晰的英文领域名称。

---

# 1. 当前进度

| 任务 | 状态 | 事实 | 后续动作 |
| --- | --- | --- | --- |
| BE-000 Backend Spec Freeze | 已冻结 | 认证、UUID、对象存储、Markdown、首页聚合、组织申请与路由命名已写入事实来源 | 停止 |
| BE-001 Django Foundation | 已完成 | Django 5.2.17、DRF 3.18、PostgreSQL-only 配置、`GET /api/health` 与统一 API 错误基础已在服务器 Python 3.12.14 / PostgreSQL 16.2 test database 验证 | 已完成 |
| BE-002 Accounts + Auth | 已完成 | `accounts.User` / `UserProfile`、Session / CSRF、待审核注册、登录登出、`/api/auth/me` 与最小账户审核 Admin 已在服务器 Python 3.12.14 / PostgreSQL 16.2 验证；Media Avatar 与组织身份关联按依赖留给 BE-003 | 停止；等待明确启动 BE-003 |
| BE-003 Domain Models | 已完成 | 25 张 V0.1 业务表、TextChoices、命名约束、索引、冻结的外键删除行为和全部 Migration 已在服务器 Python 3.12.14 / PostgreSQL 16.2 全新数据库迁移验证 | 停止；不创建业务 ViewSet |
| BE-004 Django Admin | 已完成 | `/admin/` 已注册全域 ModelAdmin，且只允许 active staff SUPERADMIN；账号审核、组织启停、平台运营角色、组织 LEADER 和成员关系操作均经受审计 Service；全部 ModelAdmin 禁止物理删除，AuditLog 只读 | 停止；不创建独立超级管理员前端 |
| BE-005 Domain Services | 已完成 | 平台角色、`orgId` 作用域、私有咨询过滤、审计、组队/招新接受和活动报名事务已实现；服务器 PostgreSQL 全套测试及活动/组队容量、跨 Recruitment Membership 双连接竞态测试通过 | 停止；不创建任何业务 API |
| BE-006 Database Verification | 已完成 | Migration、partial unique、索引 introspection，以及活动、组队、招新并发事务均已由 PostgreSQL 测试覆盖；独立 seed、数据 Migration 和扩展数据库回归不在本阶段范围 | 不因已完成而自动开始业务 API |
| BE-010 Public Read APIs | 已完成 | `home`、公开竞赛/组织/招新/组队/活动/内容/搜索路由及合同测试已实现 | 公开读取仅暴露可见的已发布数据 |
| BE-020 Student Write APIs | 已完成（原范围） | 关注、组队帖创建/编辑/关闭、提交与撤回申请、活动报名、咨询、通知、媒体上传等学生端入口已实现 | 组队作者处理申请与个人中心聚合不属于当时已交付的 HTTP 入口，转入 BE-050 |
| BE-030 Organization Leader APIs | 已完成 | 严格 `organization_id` 作用域的组织资料、招新和招新申请管理接口及合同测试已实现 | 不创建独立超级管理员前端 |
| BE-040 Operator APIs | 已完成 | 竞赛、活动、咨询、内容、公告、Banner 运营接口、CSV、组合发布与审计已实现 | 前端集成和生产发布另行验收 |
| BE-050A Product Closure | 已完成 | 组队作者申请列表/接受/拒绝、个人中心 API、Profile allowlist 与合同测试已实现；前端仍使用 fixture | 已在隔离 PostgreSQL 跑过 90 项完整 Django suite；停止，等待 FE-100+ 接入评审 |
| BE-060 Authentication Hardening | 实现已落地，未运行验收（P0） | Session 生命周期、账号禁用边界、登录/注册双维节流与 429 契约 | 依赖 BE-002；完成前不得公开认证端点 |
| BE-061 Authorization & IDOR Hardening | 实现已落地，未运行验收（P0） | DRF Default Deny、公开端点显式 AllowAny、集中权限/敏感 Serializer 回归 | 依赖 BE-010、BE-020、BE-030、BE-040 |
| BE-062 Web Security | 实现已落地，未运行验收（P0） | production settings、TLS/CSRF、安全 header、CSP Report-Only、Markdown/XSS 与 redirect 边界 | 依赖 BE-060、BE-061 和最终前端构建 |
| BE-063 Upload & Object Storage Security | 实现已落地，未运行验收（P0） | 上传重编码、像素/请求限制、S3 client、最小 IAM 与预发布 bucket 验证 | 依赖 BE-020、BE-062 |
| BE-064 Production Infrastructure Security | 实现已落地，未运行验收（P0） | Nginx/Gunicorn/PostgreSQL/网络与 readiness 的版本化部署基线 | 依赖 BE-062、BE-063 |
| BE-065 Logging / Audit / Backup / Monitoring | 实现已落地，未运行验收（P1） | 脱敏日志、审计覆盖、备份恢复、对象生命周期和告警 | 依赖 BE-064 |
| BE-066 Security CI & Automated Tests | 实现已落地，未运行验收（P1） | `check --deploy`、依赖/secret 扫描与安全回归套件 | 依赖 BE-060 至 BE-065 |
| BE-067 Privacy / Data Protection / Release Compliance | 实现已落地，未运行验收（P1） | 数据清单、保留与注销流程、发布合规证据 | 依赖 BE-061、BE-065 |
| BE-068 Final Security Penetration Checklist | 实现已落地，未运行验收（P1） | 预发布攻击场景与 go/no-go 记录 | 依赖 BE-060 至 BE-067 |

---

# 2. 后端阶段图

~~~text
BE-000  Backend Spec Freeze
   |
BE-001  Django Foundation
   |
BE-002  Accounts + Auth
   |
BE-003  Domain Models + Migrations
   |
BE-004  Django Admin
   |
BE-005  Domain / Transaction / Permission Services
   |
BE-006  PostgreSQL Database Verification
   |
BE-010  Public Read APIs
   |
BE-020  Student Write APIs
   |
BE-030  Organization Leader APIs
   |
BE-040  Operator APIs
   |
BE-050  Product Closure + Release Readiness
   |
BE-060~064  P0 Security Baseline
   |
BE-065~068  P1 Security / Release Evidence
~~~

前端轨道独立执行 FE-008 至 FE-090，继续使用 fixture。只有 APIContract 稳定且用户明确进入 FE-100+ 后，前端才逐域替换 fixture。

---

## 2.1 BE-050 的事实边界与进入条件

BE-050 不是“把现有开发服务器直接上线”。它分为产品缺口收口和发布就绪两条线，二者都通过才可形成 Production Candidate。

| 类别 | 已有事实 | 未闭环项 | BE-050 处理原则 |
|---|---|---|---|
| 组队 | `accept_team_application(...)` 事务 Service 已存在，学生可提交和撤回申请 | 作者申请列表、接受/拒绝 URL 与拒绝 Service 已由 BE-050A 收口 | 复用 post→application 行锁、定向 Notification、AuditLog 和合同测试 |
| 个人中心 | `/api/auth/me`、通知、关注、报名、咨询和组织关系等底层数据已存在 | `/api/me`、Profile、关注、组队、混合申请、活动、咨询和组织身份已由 BE-050A 注册 | 保留既有命名；QuerySet 仅按当前用户/active membership 作用域读取 |
| 对象存储 | `local` 上传、元数据事务、公开 `MediaRef` 与 S3-compatible client 已可用 | 未配置真实 provider，也没有 bucket smoke evidence | 生产接通一个经预发布验证的 S3-compatible client；不在应用服务器部署 MinIO |
| 生产安全与部署 | 同源 Session/CSRF、Default Deny、production settings、Nginx/systemd、uv CI、日志和备份模板已存在 | 没有恢复演练、已确认 CI/预发布运行证据 | 反向代理/TLS/安全 header、限流、日志、静态与媒体发布、备份恢复都须经可复现验证 |

`APIContract.md` 与 `EndpointReference.md` 仍是接口唯一契约；其中已有路径不因 BE-050 而改名。若个人中心的 DTO 细节不足以直接写 Serializer，先更新两份契约并评审，禁止由实现自行猜测字段。

BE-050A 的产品收口已停止；其验证证据、后续生产门槛和非目标见 [`ProductionReadinessPlan.md`](ProductionReadinessPlan.md)。BE-060+ 已创建安全整改和部署模板，但不创建生产资源，也不把模板当作部署完成。

---

## 2.2 安全上线门槛（BE-060 至 BE-068）

BE-050 的“发布就绪”部分由 [`SecurityBaseline.md`](SecurityBaseline.md) 细化并取代任何零散的安全配置建议。BE-060 至 BE-064 是 P0：任何一项缺失时，只允许继续本地/隔离开发，不形成 Production Candidate。BE-065 至 BE-068 的日志、备份恢复、CI、隐私与人工演练是最终发布审批的证据门槛。

安全任务必须保留既定 Session + CSRF、同源部署、UUID 与 PostgreSQL 架构；禁止以改 JWT、放宽 CORS、用 UUID 替代授权、向应用服务器部署 MinIO 或增加不必要的 Redis 作为“快捷修复”。

---

# 3. BE-000：Backend Spec Freeze

## 目标

冻结不允许由后续 coding agent 自行决定的后端基础契约。

## 已冻结

~~~text
Authentication
  Django Session + HttpOnly cookie + CSRF
  GET /api/auth/csrf
  POST /api/auth/register
  POST /api/auth/login
  POST /api/auth/logout
  GET /api/auth/me
  register -> 配置化自动启用或 Django Admin 审核启用
  inactive 登录统一返回 ACCOUNT_UNAVAILABLE

Identity
  UUID v4 everywhere
  no slug

Media
  ObjectStorage abstraction
  LocalStorageBackend only for development
  S3CompatibleStorageBackend for production
  managed provider only; no MinIO
  image max 5 MB
  public MediaRef = {id, url}

Content
  Markdown canonical source
  raw HTML disabled
  sanitize at HTML render boundary

Homepage
  GET /api/home aggregated read model

Campus Dynamics
  Activity、Announcement、Notification 保持独立领域
  Announcement.publisher_scope = ACADEMY | UNIVERSITY | PLATFORM
  external_url 仅作站外跳转，不抓取/镜像/iframe
  POST /api/ops/dynamics/activity-with-announcement 原子组合发布
  公开 Announcement 默认不进入个人 Notification

Organization application
  Organization -> Recruitment -> RecruitmentPosition -> RecruitmentApplication only

Activity registration
  POST /api/activities/{id}/register
  POST /api/activities/{id}/cancel-registration
~~~

## 停止条件

BE-000 已完成。不得在 BE-000 中创建 backend/ 或安装依赖。

---

# 4. BE-001：Django Foundation

## 目标

建立最小、可运行、可测试的 Django + DRF + PostgreSQL 后端基础，不实现任何业务领域 API。

## 依赖

~~~text
BE-000
PostgreSQL 开发实例可通过 DATABASE_URL 连接
~~~

## 范围内

~~~text
backend/ 项目结构
Python 3.12 虚拟环境说明
受版本控制的 requirements 文件
Django 5.2 LTS 与 Django REST Framework 3.18 系列
PostgreSQL database configuration
环境变量 .env.example
健康检查 GET /api/health
统一 API 错误响应基础
Django test database configuration
Gunicorn / Nginx 部署接口说明
~~~

## 范围外

~~~text
Custom User
任何业务 Model 或 Migration
认证端点
对象存储实现
真实前端联调
Docker、MinIO 或生产基础设施部署
~~~

## 验收

~~~text
python manage.py check 通过
GET /api/health 返回 200 JSON
测试运行在 PostgreSQL test database
真实密钥不在 git diff 中
git diff --check 通过
~~~

## 停止条件

BE-001 完成后停止，不执行 BE-002。

---

# 5. BE-002：Accounts + Auth

## 目标

建立从第一条 Migration 开始就正确的 Custom User、UserProfile、Django Session 与待审核注册流程。

## 依赖

~~~text
BE-001
AUTH_USER_MODEL 在任何其他 app Migration 前冻结为 accounts.User
~~~

## 范围内

~~~text
accounts.User 继承 AbstractUser
UUID v4 primary key
student_no partial unique
real_name、platform_role、is_active
UserProfile one-to-one relation
GET /api/auth/csrf
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
Session / CSRF 配置
Django Admin 对 pending user 的审核启用操作
账户审核、登录与隐私过滤测试
~~~

## 固定行为

- 注册 body 只接受 student_no、real_name、password；
- username 恒等于 student_no；
- 注册在同一事务内创建 User 与空 UserProfile，`is_active` 由 `STUDENT_REGISTRATION_AUTO_ACTIVATE` 决定；
- 注册成功不登录，返回与实际激活状态一致的 `active` 或 `pending_approval`；
- inactive 登录统一返回 403 ACCOUNT_UNAVAILABLE；
- 忘记密码仅返回联系管理员指引；
- Session cookie 不可被 JavaScript 读取，CSRF cookie 只用于 X-CSRFToken；
- register、login 与 logout 都不得暴露密码、student_no 或审核原因到日志。

## 验收

~~~text
注册创建 inactive User 和 Profile
inactive 登录不能获得 Session
SUPERADMIN 在 Django Admin 启用后可以登录
GET /api/auth/me 仅返回当前用户允许查看的敏感字段
CSRF 缺失写请求被拒绝
PostgreSQL Migration、账户测试与 git diff --check 通过
~~~

## 停止条件

BE-002 完成后停止，不创建 Competitions、Media 或其他业务 Model。

---

# 6. BE-003：Domain Models + Migrations

## 目标

按 database-design.md 建立全部 25 张 V0.1 业务表、TextChoices、命名 Constraint、索引、on_delete 行为和 Migration。

## 依赖

~~~text
BE-002
database-design.md 第 5 至第 29 节无范围争议
~~~

## 范围内

~~~text
media
organizations（含 Recruitment、Position、Application、Membership）
competitions（含 TimelineEvent、Follow）
teams（含 TeamRole、TeamApplication）
activities（含 Registration）
content（含 HomepageBanner、Announcement、Guide、GuideCompetition、FAQ）
consultations（含 Reply）
notifications
audit
全部数据库 Constraint、索引、on_delete 与 TextChoices
PostgreSQL Migration
~~~

## 规则

- 不建立 slug、achievement、job、chat、team_membership、search_index 或 user_preference；
- 不为派生状态保存重复持久字段；
- 二进制媒体不进 PostgreSQL；
- 所有 UUID 都用 UUIDField(primary_key=True, default=uuid.uuid4, editable=False)；
- 已进入共享历史的 Migration 不改写、不删除；
- Migration 依赖按 database-design.md 第 38 节的领域顺序。

## 验收

~~~text
makemigrations 无未提交 Model 差异
migrate 在 PostgreSQL 成功
所有 Unique、partial unique、Check 与索引可在 PostgreSQL introspection 中确认
所有跨表删除使用已冻结的 on_delete
无未定义业务持久字段
~~~

## 停止条件

BE-003 完成后停止，不实现 ViewSet 或写操作 Service。

---

# 7. BE-004：Django Admin

## 目标

让 SUPERADMIN 能使用 Django Admin 审核待启用账号并维护 V0.1 系统级数据，不建设独立超级管理前端。

## 依赖

~~~text
BE-003
~~~

## 范围内

~~~text
pending user 筛选与启用操作
Organization、Membership、Competition、Activity、Content、MediaAsset、Notification、AuditLog 的 Admin 注册
敏感字段最小可见性
只读 AuditLog
Admin 表单中的基础字段与状态约束
SUPERADMIN 的 is_superuser + is_staff Admin 访问边界
OPERATOR 不获得 is_staff 或 Admin 访问
~~~

## 范围外

~~~text
OPERATOR 前端
组织负责人前端
复杂审核队列
批量导入学生名单
~~~

## 验收

~~~text
SUPERADMIN 能从 Django Admin 启用待审核账号
OPERATOR 不因 platform_role 自动获得 Admin 访问
Admin 仅接受 is_active && is_staff 的受信任账号登录
敏感 Contact、student_no 和密码哈希不会出现在公开 Serializer
Admin 操作遵守业务状态与删除策略
~~~

## 停止条件

BE-004 完成后停止，不自动实现 Public API。

---

# 8. BE-005：Domain / Transaction / Permission Services

## 目标

在 DRF View 之前实现关键业务 Service、事务和权限辅助函数。

## 依赖

~~~text
BE-003
BE-004
~~~

## 必须实现

~~~text
register_student_user()
accept_team_application()
accept_recruitment_application()
register_activity()
cancel_activity_registration()
publish_competition()
grant_organization_leader()
can_manage_organization()
~~~

## 规则

- View 不得直接串联 Model.save、Membership.create 与 Notification.create；
- 活动报名必须锁定 Activity，并复用唯一 Registration；
- 接受组队申请必须锁定 TeamPost 与 TeamApplication；
- 接受招新申请必须锁定申请与名额相关记录，并创建或激活 Membership；
- 状态转换失败返回可映射到 APIContract 的领域异常；
- 通知与状态更新包含在同一个事务中。

## 验收

~~~text
并发活动报名绝不超卖
同一用户不能产生重复有效申请或 Follow
申请通过创建正确 Membership，且不自动赋予 LEADER
TeamPost 满员时状态转为 FULL
所有 Service 有 PostgreSQL TransactionTestCase 级别测试
~~~

## 停止条件

BE-005 完成后停止，不创建公开 API View。

---

# 9. BE-006：PostgreSQL Database Verification

## 目标

独立验证 Migration、Constraint、索引、事务、隐私与 Service 行为，形成 API 实现前的数据库质量门。

## 依赖

~~~text
BE-003
BE-005
~~~

## 范围内

~~~text
Migration tests
partial unique constraint tests
jsonb validation tests
select_for_update concurrency tests
activity capacity tests
team / recruitment acceptance tests
permission helper tests
public serializer privacy tests
seed management command tests
~~~

## 验收

~~~text
所有关键数据库行为只在 PostgreSQL 上判定通过
并发与事务测试可重复运行
种子数据只能由 management command 创建
git diff --check 通过
~~~

## 停止条件

BE-006 完成后停止，等待 BE-010 的明确指令。

---

# 10. BE-010：Public Read APIs

## 目标

提供可供未来 FE-100+ 逐域接入的公共只读 API，不实现学生写入。

## 依赖

~~~text
BE-004
BE-006
~~~

## 端点

~~~text
GET /api/home
GET /api/competitions
GET /api/competitions/{id}
GET /api/organizations
GET /api/organizations/{id}
GET /api/organizations/{id}/recruitments
GET /api/recruitments/{id}
GET /api/teams
GET /api/teams/{id}
GET /api/activities
GET /api/activities/{id}
GET /api/guides
GET /api/guides/{id}
GET /api/faqs
GET /api/announcements
GET /api/announcements/{id}
GET /api/search
~~~

## 规则

- 所有 id 参数只接受 UUID；
- 公开 Serializer 使用 MediaRef，不泄露 object_key、私密联系方式、学号或内部状态；
- 首页为固定限数的聚合 Read Model；
- 列表遵循分页、排序、筛选与统一错误形状；
- 只读取 PUBLISHED 且按隐私规则可见的数据；
- Markdown 以 *_md 返回，前端后续使用安全渲染边界。

## 验收

~~~text
每个端点有 success、empty、invalid UUID、not found 与隐私测试
/api/home 不建立新表且每个模块受固定 limit 约束
列表分页、排序和筛选符合 APIContract
公开响应不存在 object_key
~~~

## 停止条件

BE-010 完成后停止，不修改 frontend/。

---

# 11. BE-020：Student Write APIs

## 目标

实现已登录学生的写操作，并将权限、CSRF、约束与事务 Service 串入 HTTP 层。

## 依赖

~~~text
BE-002
BE-005
BE-006
~~~

## 端点

~~~text
POST   /api/competitions/{id}/follow
DELETE /api/competitions/{id}/follow
POST   /api/teams
PATCH  /api/teams/{id}
POST   /api/teams/{id}/close
POST   /api/teams/{id}/applications
POST   /api/team-applications/{id}/withdraw
POST   /api/recruitments/{id}/applications
POST   /api/recruitment-applications/{id}/withdraw
POST   /api/activities/{id}/register
POST   /api/activities/{id}/cancel-registration
POST   /api/consultations
GET    /api/consultations/{id}
GET    /api/notifications
GET    /api/notifications/unread-count
POST   /api/notifications/{id}/read
POST   /api/notifications/read-all
POST   /api/media/upload
~~~

## 验收

~~~text
无 Session 写请求返回 401
无 CSRF 写请求返回 403
重复与状态冲突返回 APIContract 定义的 409 或 422
上传只接受允许的图片且不返回 object_key
私密咨询不会向无权用户泄漏
~~~

## 停止条件

BE-020 完成后停止，不自动实现组织或运营管理 API。

---

# 12. BE-030：Organization Leader APIs

## 目标

实现严格限定 organization_id 的负责人管理接口。

## 依赖

~~~text
BE-020
~~~

## 范围

~~~text
组织资料读取和修改
招新创建、编辑、发布、取消和完成
申请列表
招新申请接受和拒绝
LEADER(org)、OPERATOR、SUPERADMIN 权限判定
~~~

## 验收

~~~text
一个组织的 LEADER 不能管理另一个组织
MEMBER 与 STUDENT 不能越权
接受申请复用已测试的 transaction Service
申请必须来自 Recruitment，不存在直接组织申请入口
~~~

## 停止条件

BE-030 完成后停止。

---

# 13. BE-040：Operator APIs

## 目标

实现 OPERATOR 与 SUPERADMIN 的运营 API，并复用领域 Service 和 AuditLog。

## 依赖

~~~text
BE-010
BE-020
~~~

## 范围

~~~text
竞赛、活动、咨询、指南、FAQ、公告和首页 Banner 的运营接口
发布、取消、归档、推荐和时间线状态操作
活动报名名单与 UTF-8 with BOM CSV 导出
活动与关联公告的原子组合创建/发布接口
AuditLog
~~~

## 验收

~~~text
非 OPERATOR / SUPERADMIN 请求返回 403
状态机非法转移返回 409 INVALID_STATE
敏感导出仅对授权角色可用
运营写操作记录 AuditLog
组合发布失败不会留下单独的 Activity 或 Announcement
普通公开 Announcement 不自动生成全体用户 Notification
`docs/api/EndpointReference.md` 中全部 OPERATOR / SUPERADMIN 端点都有 Serializer、View、权限和 Contract Test
发布、归档、推荐、CSV 导出、活动取消通知与组合发布均由 PostgreSQL 测试验证状态机、事务和审计副作用
~~~

## 停止条件

BE-040 完成后停止；发布与前端 API 集成另行评审。

---

# 14. 统一完成报告

每个 BE 任务结束报告：

~~~text
Summary（摘要）
Changed Files（变更文件）
Validation（实际运行的命令与结果）
Database Verification（PostgreSQL、Migration、约束或事务证据）
API Verification（适用时）
Deviations（已批准偏差）
Known Issues（无或明确阻塞项）
~~~

没有实际验证证据时，不得声明后端已通过、可部署或生产就绪。
