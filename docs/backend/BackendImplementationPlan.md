# BackendImplementationPlan.md

> 产品：人工智能学院科创与就业服务平台
> 仓库：campus-innovation-hub
> 文档版本：0.1
> 状态：BE-000 已冻结；BE-001 已完成（服务器 PostgreSQL 验证）
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
| BE-001 Django Foundation | 已完成 | Django 5.2.17、DRF 3.18、PostgreSQL-only 配置、`GET /api/health` 与统一 API 错误基础已在服务器 Python 3.12.14 / PostgreSQL 16.2 test database 验证 | 停止；等待明确启动 BE-002 |
| BE-002 Accounts + Auth | 待执行 | Custom User 与 Session Auth 尚不存在 | 依赖 BE-001 |
| BE-003 Domain Models | 待执行 | 25 张业务表只有设计文档 | 依赖 BE-002 |
| BE-004 Django Admin | 待执行 | 待审核账号和系统数据尚无 Admin 配置 | 依赖 BE-003 |
| BE-005 Domain Services | 待执行 | 关键跨表事务尚未实现 | 依赖 BE-003 |
| BE-006 Database Verification | 待执行 | PostgreSQL Migration 与并发测试尚未建立 | 依赖 BE-003、BE-005 |
| BE-010 Public Read APIs | 待执行 | 首页及公开浏览 API 尚未实现 | 依赖 BE-004、BE-006 |
| BE-020 Student Write APIs | 待执行 | 学生写操作尚未实现 | 依赖 BE-002、BE-005、BE-006 |
| BE-030 Organization Leader APIs | 待执行 | 组织负责人管理 API 尚未实现 | 依赖 BE-020 |
| BE-040 Operator APIs | 待执行 | 运营 API 尚未实现 | 依赖 BE-010、BE-020 |

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
~~~

前端轨道独立执行 FE-008 至 FE-090，继续使用 fixture。只有 APIContract 稳定且用户明确进入 FE-100+ 后，前端才逐域替换 fixture。

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
  register -> is_active=false -> Django Admin 审核启用
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
- 注册在同一事务内创建 inactive User 与空 UserProfile；
- 注册成功不登录，返回 pending_approval；
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
register_pending_user()
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
