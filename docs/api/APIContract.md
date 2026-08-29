# APIContract.md

> 产品：人工智能学院科创与就业服务平台  
> 仓库：`campus-innovation-hub`  
> 文档版本：1.1
> 状态：Canonical Contract（BE-000 至 BE-050A 已实现；BE-060 至 BE-068 的实现资产已加入，生产安全与发布运行证据仍待取得）
> 实现基线：`main@5fd5ed3bc284276057cf3442ec203412839237dc`；契约存在不表示每一路径均已注册
> 产品里程碑：V0.1  
> 传输协议：REST / JSON over HTTPS  
> 上游事实来源：`docs/backend/database-design.md`（字段与约束）、`docs/product/PageMap.md`（页面与操作）、`docs/product/PRD.md`（业务规则）  
> 下游约束对象：前端 `src/shared/api`（HTTP 客户端）、Feature API 模块、Frontend Domain Types（FE-005）、后端 DRF Serializer / View / Service  
> 职责：冻结 V0.1 全部 HTTP 接口的 method、path、请求 / 响应结构、权限、分页、排序、错误形状与日期格式；逐端点字段见 [`EndpointReference.md`](EndpointReference.md)

---

# 0. 文档职责与冲突处理

本文件是 V0.1 传输层（transport layer）的总览事实来源；[`EndpointReference.md`](EndpointReference.md) 是同一契约的逐端点细化参考。

它回答：

```text
每个页面操作对应哪个端点？
请求和响应长什么样？
哪些字段必填、多长？
谁能调用这个端点？
列表怎么分页和排序？
出错时返回什么结构？
```

它不负责：

```text
页面视觉与组件样式（见 FrontendDesign.md）
前端状态管理（见 FrontendArchitecture.md）
数据库字段定义（见 database-design.md）
```

冲突处理：

1. 字段语义以 `database-design.md` 为数据库依据，本文件不得与其矛盾；
2. API 可以隐藏数据库内部字段（不暴露），但不得发明数据库不存在的"持久字段"语义；
3. 页面操作归属以 `PageMap.md` 为准；本文件只是它的传输表达；
4. 本文件与 `EndpointReference.md` 共同变更并先评审，再同步修改前端 API 模块与后端 Serializer，禁止单侧静默修改；
5. 两份 API 文档内部冲突时，以更具体的 `EndpointReference.md` 为准，但两者都不得违背 `database-design.md`。

## 0.0 当前实现边界

本文件是契约，不以“文档中出现”代替运行时证据。`main@5fd5ed3` 是 BE-050A 前的已提交基线；BE-050A 已为下列冻结路径注册 Serializer、View/URL 与 PostgreSQL 合同测试：

```text
GET  /api/teams/{id}/applications
POST /api/team-applications/{id}/accept
POST /api/team-applications/{id}/reject

GET   /api/me
GET   /api/me/profile
PATCH /api/me/profile
GET   /api/me/follows
GET   /api/me/teams
GET   /api/me/applications
GET   /api/me/activities
GET   /api/me/questions
GET   /api/me/organizations
```

这些路径保留现有 method、path 与权限命名，不能为方便实现而改名。BE-050A 已冻结并实现个人中心的逐项 DTO：`/api/me/teams` 以 `scope=created|joined` 表达“我发布的 / 我加入的”（默认 `created`）；`Profile` 对本人显式返回只读真实姓名、学号和班级。前端 fixture 不因本实现自动切换；生产设置、S3 写入链路、部署及运行验证亦不因现有 API 实现而视为完成。

---

# 1. 通用约定

## 1.1 Base 与编码

```text
Base path:  /api
内容类型:   application/json; charset=utf-8
请求 / 响应字段: snake_case
ID:        UUID v4（字符串形式）
语言:      简体中文（zh-CN）
```

生产同源部署：

```text
https://platform.example.edu/api/*
```

开发环境 Vite 代理：

```text
/api -> http://localhost:8000
```

## 1.2 认证（Auth Expectation）

认证方案已冻结：

```text
HttpOnly secure session cookie
+ CSRF（写入操作携带 X-CSRFToken header）
```

约定：

- 登录状态通过 cookie 自动携带，前端不手动附加 token；
- 前端对写请求（POST / PATCH / DELETE）必须附带 `X-CSRFToken`；
- 未登录写请求返回 `401`；
- `GET /api/auth/csrf` 负责确保浏览器获得 CSRF cookie；
- `POST /api/auth/register` 按服务端 `STUDENT_REGISTRATION_AUTO_ACTIVATE` 创建立即启用或待审核账号，注册成功不创建 Session；
- 自动启用关闭时，Django Admin 中的 SUPERADMIN 启用账号后才可登录；
- 所有 inactive 账号登录统一返回 `403 ACCOUNT_UNAVAILABLE`，不暴露待审核、停用或其他内部原因；
- 禁止在 localStorage / sessionStorage / Pinia 持久化认证密钥。

## 1.3 身份、平台权限与组织权限

权限来源（与 database-design.md §8 / §10 一致）：

```text
用户身份:
  identity_type = STUDENT | TEACHER

平台权限:
  is_superuser = true -> SUPERADMIN
  else platform_role  -> USER | OPERATOR

组织作用域:
  Membership.role -> MEMBER | LEADER | ADVISOR
```

端点标注：

```text
PUBLIC            游客可访问
LOGIN             任意已登录用户
STUDENT           identity_type = STUDENT
TEACHER           identity_type = TEACHER
OPERATOR          platform_role = OPERATOR
SUPERADMIN        is_superuser = true
MEMBER(org)       当前组织有效 MEMBER
LEADER(org)       当前组织有效 LEADER
ADVISOR(org)      当前组织有效 ADVISOR，且 identity_type = TEACHER
ORG_MANAGER(org)  当前组织 LEADER 或 ADVISOR
```

规则：

- 身份和权限可以叠加，但不能互相替代；
- `TEACHER` 不自动获得 `OPERATOR`；
- `OPERATOR` 不自动获得任何组织 `LEADER / ADVISOR`；
- `ADVISOR(org)` 必须严格匹配当前 `organization_id`；
- `ADVISOR` 只允许 TEACHER；
- `SUPERADMIN` 通过 Django `is_superuser` 判断；
- 前端隐藏按钮不是权限；后端必须对每个受保护端点验证权限；
- 无权限访问返回 `403`；涉及资源存在性隐藏时返回 `404`。

## 1.4 日期与时间

```text
存储:     timestamptz（database-design.md §1.3）
传输:     ISO 8601，带时区偏移，例如 2026-09-01T23:59:59+08:00
展示:     前端按简体中文格式格式化（2026年9月1日、还有 3 天截止）
```

后端返回全部使用：

```text
2026-09-01T23:59:59+08:00
```

不允许返回：

```text
"还有 3 天"
"明天下午"
```

等派生展示文本（前端计算）。

## 1.5 分页（Pagination）

所有列表端点采用：

```text
Query: page（从 1 开始，默认 1）
       page_size（默认 20，最大 100）
```

响应包装（DRF 风格）：

```json
{
  "count": 57,
  "next": "/api/competitions/?page=3&page_size=20",
  "previous": "/api/competitions/?page=1&page_size=20",
  "results": []
}
```

默认 page_size：

```text
公开列表      20
运营表格      30
全站搜索      20
首页小模块    见 §2.6（非分页，固定上限）
```

## 1.6 排序（Ordering）

默认排序已冻结（database-design.md §22），端点无需显式传参即可获得正确顺序。

允许客户端通过 `ordering` 覆盖的字段，在各端点列出；不列出的端点不接受 `ordering`。

## 1.7 筛选参数

通用列表端点接受以下 Query 参数（按域细化）：

```text
q                关键词搜索
status           状态筛选
category         分类筛选
competition_id   关联竞赛
post_type        信息类型
page / page_size 分页
ordering         显式排序（可选）
```

筛选值使用枚举常量（大写，如 `OPEN`、`TEAM`），与 database-design.md 枚举一致。

## 1.8 错误模型（Error Shape）

所有非 2xx 响应统一结构（与 FrontendArchitecture.md AppError 一致）：

```json
{
  "code": "VALIDATION_ERROR",
  "message": "报名人数已达上限",
  "fieldErrors": {
    "title": ["标题不能为空"]
  },
  "requestId": "uuid（可选）"
}
```

约定：

- `code`：机器可读错误码（见 §4）；
- `message`：简体中文、可操作（actionable）；
- `fieldErrors`：仅字段校验错误时出现，键为字段名；
- 列表 / 详情不因单条数据错误整体 500；
- 认证失败：`401`；无权限：`403`；不存在或隐私隐藏：`404`。

## 1.9 HTTP 状态码约定

```text
200 OK           读取 / 更新成功
201 Created      创建成功（POST）
204 No Content   删除 / 无返回体的写操作
400 Bad Request  参数校验失败
401 Unauthorized 未登录
403 Forbidden    已登录但无权限
404 Not Found    不存在或按隐私策略隐藏
405 Method Not Allowed 请求方法不被端点支持
409 Conflict     唯一约束 / 状态冲突（重复关注、重复报名、状态不允许）
422 Unprocessable Entity 业务规则拒绝（容量已满、截止已过）
429 Too Many Requests    认证或注册限流
500 Internal Server Error
```

写接口状态冲突优先 `409`；业务规则（时间窗口、容量、状态机非法转移）优先 `422`。

`429` 固定返回：

```json
{
  "code": "RATE_LIMITED",
  "message": "请求过于频繁，请稍后重试。"
}
```

并带正整数 `Retry-After` header。响应不得暴露用户名、IP、失败次数、剩余封锁次数或账户是否存在。

## 1.10 隐私字段过滤规则

依据 database-design.md §3 隐私分级：

```text
PUBLIC      可出现在任意公开响应
INTERNAL    仅登录用户 / 业务参与方 / 管理人员
SENSITIVE   仅本人或必要运营人员
```

强制规则：

- 公开列表 / 详情响应不得包含 SENSITIVE 字段；
- `contact_value`（组队联系方式）、真实姓名、学号等仅在申请通过后的"必要对象可见"场景返回；
- PRIVATE 咨询仅本人 / OPERATOR / SUPERADMIN 可见，其余一律 `404`。

## 1.11 媒体引用（MediaRef）

公开响应中的图片统一使用语义化字段名承载 `MediaRef`，例如 `cover`、`logo`、`banner`、`avatar`、`image`：

```json
{
  "id": "uuid",
  "url": "https://media.example.edu/path/image.webp"
}
```

- `url` 是当前可公开访问的资源地址；
- `object_key`、`sha256`、存储供应商、创建者与删除状态均为内部 MediaAsset 元数据，不出现在公开 DTO 或上传响应；
- 写入 body 仍可使用明确命名的 `cover_asset_id`、`logo_asset_id`、`banner_asset_id`、`avatar_asset_id`，其值必须是已存在且可用的 MediaAsset UUID；
- 未配置媒体时，相关 `MediaRef` 返回 `null`。

---

# 2. 端点总览

## 2.0 基础设施

```text
GET  /api/health                                    服务健康检查（PUBLIC）
GET  /api/ready                                     仅反向代理本机健康探针使用
```

## 2.1 公开浏览域（PUBLIC）

```text
GET  /api/home                                      首页聚合
GET  /api/competitions                              竞赛列表
GET  /api/competitions/{id}                         竞赛详情
GET  /api/teams                                     组队广场
GET  /api/teams/{id}                                组队详情
GET  /api/organizations                             组织列表
GET  /api/organizations/{id}                        组织主页
GET  /api/organizations/{id}/recruitments           组织招新列表
GET  /api/recruitments/{id}                         招新详情
GET  /api/activities                                活动列表
GET  /api/activities/{id}                           活动详情
GET  /api/announcements                             公告列表
GET  /api/announcements/{id}                        公告详情
GET  /api/guides                                    指南列表
GET  /api/guides/{id}                               指南详情
GET  /api/faqs                                      FAQ 列表
GET  /api/qa/public                                 公开问答列表
GET  /api/search                                    全站搜索
```

## 2.2 认证与个人域

```text
GET  /api/auth/csrf                                 初始化 CSRF cookie（PUBLIC）
POST /api/auth/register                             学生自助注册（PUBLIC）
POST /api/auth/login                                登录（PUBLIC）
POST /api/auth/logout                               登出（LOGIN）
GET  /api/auth/me                                   当前用户 + 权限上下文
GET  /api/me                                        个人中心概览
GET  /api/me/profile                                我的资料（读取）
PATCH /api/me/profile                               我的资料（修改）
GET  /api/me/follows                                我的关注
GET  /api/me/teams                                 我的组队（我发布的 / 我加入的）
GET  /api/me/applications                           我的申请（组队 + 组织）
GET  /api/me/activities                             我的活动
GET  /api/me/questions                              我的咨询
GET  /api/me/organizations                          我的组织身份
```

## 2.3 用户写操作域（LOGIN）

```text
POST   /api/competitions/{id}/follow                关注竞赛
DELETE /api/competitions/{id}/follow                取消关注
POST   /api/teams                                   发布组队
PATCH  /api/teams/{id}                              编辑组队（作者）
POST   /api/teams/{id}/close                        关闭组队（作者）
POST   /api/teams/{id}/applications                 申请加入队伍
GET    /api/teams/{id}/applications                 查看申请（作者）
POST   /api/team-applications/{id}/accept           接受申请（作者）
POST   /api/team-applications/{id}/reject           拒绝申请（作者）
POST   /api/team-applications/{id}/withdraw         撤回申请（申请人）
POST   /api/recruitments/{id}/applications          提交招新申请
POST   /api/recruitment-applications/{id}/withdraw  撤回招新申请（申请人）
POST   /api/activities/{id}/register                报名活动
POST   /api/activities/{id}/cancel-registration     取消报名
POST   /api/consultations                           提交咨询
GET    /api/consultations/{id}                      咨询详情（本人 / 公开）
GET    /api/notifications                           消息列表
GET    /api/notifications/unread-count              未读数
POST   /api/notifications/{id}/read                 标记已读
POST   /api/notifications/read-all                  全部已读
POST   /api/media/upload                            图片上传
```

## 2.4 组织管理域（ORG_MANAGER(org) / SUPERADMIN）

```text
GET    /api/manage/organizations/{orgId}/profile                 组织资料读取
PATCH  /api/manage/organizations/{orgId}/profile                 组织资料修改
GET    /api/manage/organizations/{orgId}/recruitments            招新列表
POST   /api/manage/organizations/{orgId}/recruitments            新建招新
GET    /api/manage/organizations/{orgId}/recruitments/{rid}      招新详情
PATCH  /api/manage/organizations/{orgId}/recruitments/{rid}      编辑招新
POST   /api/manage/organizations/{orgId}/recruitments/{rid}/publish      发布招新
POST   /api/manage/organizations/{orgId}/recruitments/{rid}/cancel       取消招新
POST   /api/manage/organizations/{orgId}/recruitments/{rid}/complete     标记完成
POST   /api/manage/organizations/{orgId}/recruitments/{rid}/archive      归档招新
GET    /api/manage/organizations/{orgId}/applications            申请管理列表
POST   /api/manage/organizations/{orgId}/applications/{aid}/accept      接受申请
POST   /api/manage/organizations/{orgId}/applications/{aid}/reject      拒绝申请
```

## 2.5 平台运营域（OPERATOR / SUPERADMIN）

```text
竞赛：
GET    /api/ops/competitions                      管理列表
POST   /api/ops/competitions                      新建竞赛
GET    /api/ops/competitions/{id}                 管理详情
PATCH  /api/ops/competitions/{id}                 编辑竞赛
POST   /api/ops/competitions/{id}/publish         发布
POST   /api/ops/competitions/{id}/cancel          取消
POST   /api/ops/competitions/{id}/archive         归档
PATCH  /api/ops/competitions/{id}/featured        设置 / 取消推荐
POST   /api/ops/competitions/{id}/timeline-events           添加时间线节点
PATCH  /api/ops/competitions/{id}/timeline-events/{eid}     编辑节点
DELETE /api/ops/competitions/{id}/timeline-events/{eid}     删除节点

活动：
GET    /api/ops/activities                        管理列表
POST   /api/ops/activities                        发布活动
GET    /api/ops/activities/{id}                   管理详情
PATCH  /api/ops/activities/{id}                   编辑活动
POST   /api/ops/activities/{id}/publish           发布
POST   /api/ops/activities/{id}/cancel            取消
POST   /api/ops/activities/{id}/archive           归档
POST   /api/ops/activities/{id}/close-registration 关闭报名
PATCH  /api/ops/activities/{id}/featured          设置 / 取消推荐
GET    /api/ops/activities/{id}/registrations     报名名单
POST   /api/ops/activities/{id}/export-registrations 导出名单
POST   /api/ops/dynamics/activity-with-announcement 同步创建活动与关联公告

咨询：
GET    /api/ops/consultations                     咨询管理列表
GET    /api/ops/consultations/{id}                咨询详情
POST   /api/ops/consultations/{id}/replies        回复咨询

内容：
GET    /api/ops/guides                            管理列表
GET    /api/ops/guides/{id}                       管理详情
POST   /api/ops/guides                            新建指南
PATCH  /api/ops/guides/{id}                       编辑指南
POST   /api/ops/guides/{id}/publish               发布
POST   /api/ops/guides/{id}/archive               归档
PATCH  /api/ops/guides/{id}/featured              设置 / 取消推荐
GET    /api/ops/faq                               管理列表
GET    /api/ops/faq/{id}                          管理详情
POST   /api/ops/faq                               新建 FAQ
PATCH  /api/ops/faq/{id}                          编辑 FAQ
POST   /api/ops/faq/{id}/publish                  发布
POST   /api/ops/faq/{id}/archive                  归档
PATCH  /api/ops/faq/{id}/featured                 设置 / 取消推荐
GET    /api/ops/announcements                     管理列表
GET    /api/ops/announcements/{id}                管理详情
POST   /api/ops/announcements                     创建公告
PATCH  /api/ops/announcements/{id}                编辑公告
POST   /api/ops/announcements/{id}/publish        发布
POST   /api/ops/announcements/{id}/archive        归档
GET    /api/ops/banners                           管理列表
GET    /api/ops/banners/{id}                      管理详情
POST   /api/ops/banners                           新建轮播
PATCH  /api/ops/banners/{id}                      编辑轮播

超级管理员：
Django Admin（不开发独立管理前端）
```

## 2.6 首页聚合（GET /api/home）

首页各模块限数（database-design.md §23）：

```text
banners      <= 4
deadlines    <= 6
featured_competitions <= 8（热门竞赛）
announcements <= 6
featured_guides <= 6
team_posts   <= 6
recruiting_organizations <= 6
activities   <= 6
faqs         <= 6
```

响应结构：

```json
{
  "banners": [],
  "deadlines": [],
  "featured_competitions": [],
  "announcements": [],
  "featured_guides": [],
  "team_posts": [],
  "recruiting_organizations": [],
  "activities": [],
  "faqs": []
}
```

各模块条目结构与对应列表端点一致。`GET /api/home` 是 PUBLIC Read Model，不对应数据库表，后端负责限数、排序和关联预取；前端不得以九个首屏请求替代该端点。

---

# 3. 端点详情

## 3.1 Auth

### 初始化 CSRF

```text
GET /api/auth/csrf
权限：PUBLIC
```

Response `204`：通过 `Set-Cookie` 确保浏览器具有 CSRF cookie。前端从 cookie 读取值，并在后续 `POST` / `PATCH` / `DELETE` 请求中以 `X-CSRFToken` 发送；该 cookie 不是登录凭据。

### 学生自助注册

```text
POST /api/auth/register
权限：PUBLIC
```

V0.1 仅允许注册：

```text
identity_type = STUDENT
```

Request：

```json
{
  "student_no": "20260001",
  "real_name": "张三",
  "password": "***",
  "password_confirm": "***",
  "major": "人工智能",
  "grade": 1,
  "class_name": "人工智能2601"
}
```

后端不得接受客户端提交：

```text
identity_type = TEACHER
platform_role = OPERATOR
is_staff
is_superuser
```

教师账号不通过该端点创建。

教师由 SUPERADMIN 使用 Django Admin 或受控导入 / management command 创建：

```text
identity_type = TEACHER
employee_no required
platform_role default USER
```

注册成功后的激活策略由 `STUDENT_REGISTRATION_AUTO_ACTIVATE` 执行；招新期 production 显式设为 `true` 时直接启用，关闭时进入管理员审核。无论采用直接启用还是管理员审核，都不得允许用户自行把 STUDENT 升级为 TEACHER。

Response `201`：

```json
{
  "status": "active",
  "message": "注册成功，现在可以登录。"
}
```

自动启用关闭时仍返回 `{"status":"pending_approval","message":"注册已提交，请等待管理员审核。"}`。错误：`400`（字段校验）、`409 ACCOUNT_EXISTS`（学号或用户名已存在）。响应不得泄露已有账号的审核状态、真实姓名或其他资料。待审核账号仅由 SUPERADMIN 通过 Django Admin 启用；V0.1 不提供邮件、短信、验证码、学生名单校验或自助密码重置 API。

注册端点按来源 IP 执行短时节流；被节流时返回 `429 RATE_LIMITED` 与 `Retry-After`。该行为不改变 `409 ACCOUNT_EXISTS` 的既有语义。

### 登录

```text
POST /api/auth/login
权限：PUBLIC
```

统一登录页允许用户输入：

```text
用户名 / 学号 / 工号
```

Request：

```json
{
  "username": "20260001",
  "password": "***"
}
```

教师示例：

```json
{
  "username": "T20260018",
  "password": "***"
}
```

账号创建时建议默认：

```text
STUDENT username = student_no
TEACHER username = employee_no
```

Response `200`：登录成功，Set-Cookie session。Body 返回 `GET /api/auth/me` 结构。

错误：`401`（凭据错误）；所有 inactive 账号统一返回 `403`、code `ACCOUNT_UNAVAILABLE`、message `账号尚未启用，请联系管理员。`，不区分待审核和停用。

登录在来源 IP 与用户名两个维度执行短时节流。命中时返回 `429 RATE_LIMITED` 与 `Retry-After`，不返回计数、锁定原因或账户信息。成功 `login()` 轮换 Session key；`logout()` 清理 Session；账号被停用后，既有 Session 也不得继续访问 LOGIN API。

### 登出

```text
POST /api/auth/logout
权限：LOGIN
```

Response `204`。

### 当前用户

```text
GET /api/auth/me
权限：LOGIN（未登录返回 401）
```

STUDENT Response 示例：

```json
{
  "user": {
    "id": "uuid",
    "username": "20260001",
    "identity_type": "STUDENT",
    "student_no": "20260001",
    "employee_no": null,
    "real_name": "张三",
    "platform_role": "USER",
    "is_superuser": false,
    "profile": {
      "nickname": "阿三",
      "avatar": { "id": "uuid", "url": "https://..." },
      "major": "人工智能",
      "grade": 1,
      "bio": "",
      "skills": ["Python", "Vue"]
    }
  },
  "permissions": {
    "identity_type": "STUDENT",
    "platform_role": "USER",
    "is_superuser": false,
    "organization_memberships": [
      {
        "organization_id": "uuid",
        "role": "LEADER",
        "title": "会长",
        "can_manage": true
      }
    ]
  }
}
```

TEACHER Response 示例：

```json
{
  "user": {
    "id": "uuid",
    "username": "T20260018",
    "identity_type": "TEACHER",
    "student_no": null,
    "employee_no": "T20260018",
    "real_name": "李明",
    "platform_role": "USER",
    "is_superuser": false,
    "profile": {
      "avatar": { "id": "uuid", "url": "https://..." },
      "public_name": "李明",
      "department": "人工智能学院",
      "academic_title": "副教授",
      "public_email": "liming@ai.edu.cn",
      "office_location": "科教楼 3-218",
      "bio": "……",
      "research_interests": ["机器学习", "自然语言处理"]
    }
  },
  "permissions": {
    "identity_type": "TEACHER",
    "platform_role": "USER",
    "is_superuser": false,
    "organization_memberships": [
      {
        "organization_id": "uuid",
        "role": "ADVISOR",
        "title": "指导老师",
        "can_manage": true
      }
    ]
  }
}
```

字段映射：

```text
accounts_user
accounts_user_profile
organizations_membership(active)
```

`real_name`、`student_no`、`employee_no` 为 SENSITIVE，仅本人 / 必要管理员可见。

## 3.2 个人中心（Me）

### 概览

```text
GET /api/me
权限：LOGIN
```

Response：profile 摘要 + 组织身份 + 未读通知数。字段来自 `/api/auth/me`、`/api/me/organizations`、`/api/notifications/unread-count` 的合并（后端可聚合返回，避免前端多次请求）。

`profile` 与下文 `Profile` 相同；`organization_memberships` 与“我的组织”项相同；`unread_notification_count` 为当前用户未读 `Notification` 数量。该端点不返回 `platform_role`、`is_superuser` 或其他权限上下文，权限上下文仍以 `/api/auth/me` 为准。

### 我的资料

```text
GET /api/me/profile
PATCH /api/me/profile
权限：LOGIN
```

Response 根据 `identity_type` 返回对应字段。

STUDENT 可更新：

```json
{
  "nickname": "阿三",
  "avatar_asset_id": "uuid",
  "major": "人工智能",
  "grade": 2,
  "bio": "一句话简介",
  "skills": ["Python", "Vue"]
}
```

TEACHER 可更新（`public_name` 在成为 ADVISOR 前必须填写）：

```json
{
  "avatar_asset_id": "uuid",
  "public_name": "李明",
  "department": "人工智能学院",
  "academic_title": "副教授",
  "public_email": "liming@ai.edu.cn",
  "office_location": "科教楼 3-218",
  "bio": "一句话简介",
  "research_interests": ["机器学习", "自然语言处理"]
}
```

不可通过本端点修改：

```text
identity_type
real_name
student_no
employee_no
platform_role
is_staff
is_superuser
```

约束见 database-design.md §8 / §20：

```text
nickname <= 40
bio <= 500
skills / research_interests 数组，每项 <= 40 字符，最多 20 项，去重
grade 1–4 或 null
avatar_asset_id 必须是当前用户上传、仍为 ACTIVE 的 IMAGE MediaAsset，或 null（清除头像）
```

GET 与 PATCH 的 `Profile` response 固定为：

```json
{
  "identity_type": "STUDENT",
  "real_name": "张三",
  "student_no": "20260001",
  "class_name": "人工智能 2301",
  "nickname": "阿三",
  "avatar": {"id": "uuid", "url": "https://media.example.edu/avatar.webp"},
  "major": "人工智能",
  "grade": 2,
  "bio": "一句话简介",
  "skills": ["Python", "Vue"]
}
```

TEACHER 的 `Profile` 额外返回：

```json
{
  "identity_type": "TEACHER",
  "real_name": "李明",
  "employee_no": "T20260018",
  "public_name": "李明",
  "department": "人工智能学院",
  "academic_title": "副教授",
  "public_email": "liming@ai.edu.cn",
  "office_location": "科教楼 3-218",
  "bio": "……",
  "research_interests": ["机器学习", "自然语言处理"]
}
```

`real_name`、`student_no`、`employee_no` 和 `class_name` 仅本人可读；`avatar` 为 `MediaRef | null`。PATCH 后返回更新后的完整 `Profile`，但不接受上述只读字段。

### 我的关注

```text
GET /api/me/follows?page=&page_size=
权限：LOGIN
```

results 为竞赛摘要列表（同 §3.3 列表项结构）。

### 我的组队

```text
GET /api/me/teams?page=&page_size=&scope=created|joined
权限：LOGIN
```

`scope` 默认 `created`，保持既有“我发布的组队”默认语义：

```text
created  当前用户是 TeamPost.author 的全部帖子
joined   当前用户具有 ACCEPTED TeamApplication 的 TeamPost
```

两个 scope 都按 `TeamPost.updated_at` 倒序、再按 `id` 倒序；不返回联系方式。每项为：

```json
{
  "id": "team-post uuid",
  "relationship": "AUTHOR | ACCEPTED_MEMBER",
  "post_type": "TEAM_RECRUITING | PERSON_LOOKING",
  "title": "寻找两名算法队友",
  "competition_id": "uuid",
  "competition_name": "全国大学生数学建模竞赛",
  "team_name": "数模小分队",
  "direction": "数学建模方向",
  "status": "RECRUITING | FULL | CLOSED",
  "updated_at": "2026-09-01T10:00:00+08:00",
  "action_path": "/teams/{id}"
}
```

### 我的申请

```text
GET /api/me/applications?page=&page_size=&kind=team|recruitment
权限：LOGIN
```

统一返回两类申请（前端用 Tab 区分，或后端用 kind 过滤）：

```json
{
  "id": "uuid",
  "kind": "TEAM_APPLICATION | RECRUITMENT_APPLICATION",
  "target_type": "TEAM_POST | RECRUITMENT",
  "target_id": "uuid",
  "target_title": "队伍标题 / 招新标题",
  "target_organization_name": "（招新时）",
  "target_position_name": "（招新时）",
  "status": "PENDING | ACCEPTED | REJECTED | WITHDRAWN",
  "submitted_at": "2026-09-01T10:00:00+08:00",
  "updated_at": "2026-09-01T10:00:00+08:00",
  "processed_at": null,
  "action_path": "/teams/{id}"
}
```

`kind` 查询参数只接受小写 `team` 或 `recruitment`；response 中 `kind` 仍使用 `TEAM_APPLICATION` 或 `RECRUITMENT_APPLICATION`。全部列表在合并两种申请后按 `submitted_at` 倒序、再按 `id` 倒序，分页在合并排序后执行。TEAM 项 `target_organization_name` 与 `target_position_name` 为 `null`；RECRUITMENT 项 `target_position_name` 为申请岗位名。

### 我的活动

```text
GET /api/me/activities?page=&page_size=
权限：LOGIN
```

按 `Registration.registered_at` 倒序、再按 `id` 倒序。每项固定为：

```json
{
  "id": "registration uuid",
  "activity_id": "uuid",
  "title": "学生 API 活动",
  "activity_type": "TECH_SHARING",
  "location": "学院报告厅",
  "start_at": "2026-09-03T10:00:00+08:00",
  "end_at": null,
  "registration_status": "REGISTERED | CANCELLED",
  "registered_at": "2026-09-01T10:00:00+08:00",
  "cancelled_at": null,
  "action_path": "/activities/{activity_id}"
}
```

### 我的咨询

```text
GET /api/me/questions?page=&page_size=
权限：LOGIN
```

按 `Consultation.updated_at` 倒序、再按 `id` 倒序。每项固定为：

```json
{
  "id": "uuid",
  "category": "COMPETITION",
  "title": "如何准备人工智能竞赛？",
  "visibility": "PUBLIC | PRIVATE",
  "status": "OPEN | ANSWERED | CLOSED",
  "created_at": "2026-09-01T10:00:00+08:00",
  "updated_at": "2026-09-01T10:00:00+08:00",
  "answered_at": null,
  "action_path": "/qa/questions/{id}"
}
```

### 我的组织

```text
GET /api/me/organizations
权限：LOGIN
```

results：

```json
{
  "organization_id": "uuid",
  "organization_name": "人工智能协会",
  "organization_type": "STUDENT_CLUB",
  "role": "MEMBER | LEADER",
  "title": "技术部干事",
  "is_active": true
}
```

此 API 是 `/organizations` 页面登录态“我的组织”上下文区块的数据来源，不对应 `/me/organizations` 独立前端路由。没有有效组织身份时返回空数组；LEADER 用 `organization_id` 进入对应的组织负责人工作台。

## 3.3 Competitions（竞赛）

### 竞赛列表

```text
GET /api/competitions
权限：PUBLIC
Query: q, status, category, participation_mode, page, page_size, ordering
```

`status` 值（展示状态由后端按 database-design.md §12.1 派生）：

```text
UPCOMING   即将开始
OPEN       报名中
IN_PROGRESS 进行中
ENDED      已结束
```

`category`：

```text
AI / PROGRAMMING / INNOVATION / MATHEMATICAL_MODELING / ELECTRONICS / ROBOTICS / OTHER
```

`ordering` 允许：`registration_end_at`、`event_start_at`、`-registration_end_at`、`-event_start_at`（默认按 §22 冻结顺序）。

results 列表项：

```json
{
  "id": "uuid",
  "name": "全国大学生数学建模竞赛",
  "edition": "2026",
  "category": "MATHEMATICAL_MODELING",
  "level": "NATIONAL",
  "participation_mode": "TEAM",
  "suitable_grade_min": 1,
  "suitable_grade_max": 4,
  "direction": "数学建模",
  "summary": "……",
  "cover": {
    "id": "uuid",
    "url": "https://media.example.edu/competition-cover.webp"
  },
  "registration_start_at": "2026-09-01T00:00:00+08:00",
  "registration_end_at": "2026-10-01T23:59:59+08:00",
  "event_start_at": "2026-11-01T00:00:00+08:00",
  "publication_state": "PUBLISHED",
  "registration_state": "OPEN",
  "event_phase": "UPCOMING",
  "official_url": "https://…",
  "followed": false
}
```

说明：`followed` 仅在 LOGIN 时返回（当前用户是否关注），游客返回 `null` 或省略。

### 竞赛详情

```text
GET /api/competitions/{id}
权限：PUBLIC
```

Response `200`：列表项全部字段 + 完整详情：

```json
{
  "description_md": "比赛简介（Markdown）",
  "suitable_for_md": "谁适合参加",
  "preparation_advice_md": "准备建议",
  "registration_url": "https://…",
  "official_notice_url": "https://…",
  "college_organized": true,
  "college_contact_name": "王老师",
  "college_contact_text": "学院教务办公室 101",
  "timeline": [
    {
      "id": "uuid",
      "title": "开放报名",
      "event_at": "2026-09-01T00:00:00+08:00",
      "end_at": null,
      "description": "官网注册并提交",
      "sort_order": 0
    }
  ],
  "related_guides": [],
  "related_announcements": [],
  "team_posts": []
}
```

`team_posts` 仅返回 `RECRUITING` 状态、限 2-4 条（PageMap）；`related_guides` 来自 `content_guide_competition`。

### 关注 / 取消关注

```text
POST   /api/competitions/{id}/follow
DELETE /api/competitions/{id}/follow
权限：LOGIN
```

- POST 返回 `204`；重复关注返回 `409`（code `ALREADY_FOLLOWED`）；
- DELETE 返回 `204`；未关注返回 `404`。

## 3.4 Teams（组队）

### 组队广场列表

```text
GET /api/teams
权限：PUBLIC
Query: q, competition_id, post_type, status, page, page_size
```

`post_type`：`TEAM_RECRUITING`（队伍找人）/ `PERSON_LOOKING`（个人找队）
`status`：`RECRUITING` / `FULL` / `CLOSED`（默认仅首屏展示 RECRUITING）

results 列表项：

```json
{
  "id": "uuid",
  "post_type": "TEAM_RECRUITING",
  "title": "寻找两名算法队友",
  "competition_id": "uuid",
  "competition_name": "全国大学生数学建模竞赛",
  "team_name": "数模小分队",
  "direction": "数学建模方向",
  "base_member_count": 1,
  "target_member_count": 3,
  "current_member_count": 2,
  "members_summary": "目前两名成员……",
  "goal": "冲击国奖",
  "weekly_commitment": "每周 8 小时",
  "roles": [
    { "id": "uuid", "name": "算法", "headcount": 1, "requirements": "……", "skills": "Python" }
  ],
  "status": "RECRUITING",
  "author": {
    "id": "uuid",
    "nickname": "阿三",
    "avatar": null
  },
  "created_at": "2026-09-01T10:00:00+08:00"
}
```

`current_member_count` 为派生值（`base + ACCEPTED 数`），不落库。

### 组队详情

```text
GET /api/teams/{id}
权限：PUBLIC
```

列表项全部字段 + `notes_md` + 完整 roles + 本人申请状态（LOGIN 时）。`contact_value` / `contact_method` 仅在本人或申请通过后双方可见。

### 发布组队

```text
POST /api/teams
权限：LOGIN
```

Request body（约束见 database-design.md §20）：

```json
{
  "competition_id": "uuid",
  "post_type": "TEAM_RECRUITING",
  "title": "寻找两名算法队友",
  "team_name": "数模小分队",
  "direction": "数学建模方向",
  "members_summary": "……",
  "base_member_count": 1,
  "target_member_count": 3,
  "goal": "冲击国奖",
  "weekly_commitment": "每周 8 小时",
  "contact_method": "WECHAT",
  "contact_value": "wxid_xxx",
  "notes_md": "……",
  "roles": [
    { "name": "算法", "headcount": 1, "requirements": "……", "skills": "Python" }
  ]
}
```

校验：`title` 4-120、`direction` 2-500、`base_member_count >= 1`、`target >= base`、roles 每个 `name` 1-60。`contact_value` SENSITIVE，仅作者与通过者可见。

Response `201`：详情结构。

### 编辑 / 关闭组队

```text
PATCH /api/teams/{id}
POST  /api/teams/{id}/close
权限：LOGIN（作者）
```

- PATCH 可更新字段与创建一致（roles 全量替换）；
- close 将 `status` 置为 `CLOSED`、写 `closed_at`；非作者返回 `403`；
- `FULL` 回 `RECRUITING` 需 Service 处理（调整 target 后），并写 AuditLog。

### 申请加入队伍

```text
POST /api/teams/{id}/applications
权限：LOGIN
```

Request body：

```json
{
  "desired_role_id": "uuid（可选）",
  "self_intro": "……",
  "skills": "Python, 数据分析",
  "experience": "……",
  "motivation": "……",
  "weekly_commitment": "每周 8 小时",
  "contact_method": "WECHAT",
  "contact_value": "wxid_xxx"
}
```

约束：`self_intro` 5-3000、`motivation` 5-3000、`skills <= 1000`、`experience <= 5000`。

错误：作者不能申请自己的队伍（`422`，code `CANNOT_APPLY_OWN`）；已存在 PENDING / ACCEPTED 申请返回 `409`（code `DUPLICATE_APPLICATION`）；`status != RECRUITING` 返回 `422`。

Response `201`：申请记录（INTERNAL，本人可见）。

### 处理申请（作者）

```text
POST /api/team-applications/{id}/accept
POST /api/team-applications/{id}/reject
权限：LOGIN（TeamPost 作者）
```

accept 必须走事务 Service（database-design.md §13.3 / §26）：锁定 post 与 application、确认 PENDING、容量校验、置 ACCEPTED、达目标则 post 转 FULL、创建 Notification。成功 `204`；非 PENDING 返回 `409`。

### 撤回申请

```text
POST /api/team-applications/{id}/withdraw
权限：LOGIN（申请人）
```

仅 PENDING 可撤回，成功 `204`；否则 `409`。

## 3.5 Organizations（组织）与 Recruitments（招新）

### 组织列表

```text
GET /api/organizations
权限：PUBLIC
Query: q, organization_type, recruiting, page, page_size
```

`organization_type`：`COLLEGE_DEPARTMENT` / `STUDENT_CLUB` / `LABORATORY` / `INNOVATION_TEAM` / `OTHER`
`recruiting`：`true` 时仅返回当前有 OPEN 招新的组织（查询层派生，不存字段）

results 列表项：

```json
{
  "id": "uuid",
  "name": "人工智能协会",
  "organization_type": "STUDENT_CLUB",
  "short_intro": "……",
  "logo": {
    "id": "uuid",
    "url": "https://media.example.edu/organization-logo.webp"
  },
  "is_recruiting": true
}
```

默认排序：正在招新优先，然后 `name ASC`（§22）。

### 组织主页

```text
GET /api/organizations/{id}
权限：PUBLIC
```

详情字段（database-design.md §10.1 公开字段）+ `current_recruitments`（OPEN 优先，限 2-4 条）+ `recent_activities`（未来未取消，限 3 条）+ `public_contact`。

指导老师来自有效 `OrganizationMembership(role=ADVISOR)`，不再读取 `advisor_name`。

公开响应增加：

```json
{
  "leaders": [
    {
      "id": "uuid",
      "display_name": "张三",
      "avatar": { "id": "uuid", "url": "https://..." },
      "title": "会长"
    }
  ],
  "advisors": [
    {
      "id": "uuid",
      "display_name": "李明",
      "avatar": { "id": "uuid", "url": "https://..." },
      "title": "指导老师",
      "department": "人工智能学院",
      "academic_title": "副教授",
      "public_email": "liming@ai.edu.cn",
      "office_location": "科教楼 3-218",
      "research_interests": ["机器学习", "自然语言处理"]
    }
  ],
  "current_user_organization_role": "MEMBER | LEADER | ADVISOR | null",
  "can_manage": false
}
```

`can_manage = true` 仅限当前组织有效 `LEADER / ADVISOR` 或 SUPERADMIN。

`advisors[].display_name` 来自教师 Profile 的 `public_name`，不得直接把 SENSITIVE 的 `real_name` 暴露到公开组织接口。

### 组织招新列表

```text
GET /api/organizations/{id}/recruitments
权限：PUBLIC
Query: status, page, page_size
```

results：招新摘要（title、派生 application_state、apply 时间窗、岗位数）。

### 招新详情

```text
GET /api/recruitments/{id}
权限：PUBLIC
```

```json
{
  "id": "uuid",
  "organization_id": "uuid",
  "organization_name": "人工智能协会",
  "title": "2026 秋季招新",
  "intro_md": "……",
  "apply_start_at": "2026-09-01T00:00:00+08:00",
  "apply_end_at": "2026-09-30T23:59:59+08:00",
  "target_grade_min": 1,
  "target_grade_max": 4,
  "notes_md": "……",
  "application_state": "OPEN",
  "positions": [
    {
      "id": "uuid",
      "name": "技术部干事",
      "headcount": 5,
      "description_md": "……",
      "requirements_md": "……"
    }
  ]
}
```

### 提交招新申请

```text
POST /api/recruitments/{id}/applications
权限：LOGIN
```

Request body：

```json
{
  "position_id": "uuid",
  "self_intro": "……",
  "skills": "……",
  "experience": "……",
  "motivation": "……"
}
```

约束：`self_intro` 5-3000、`motivation` 5-3000。重复有效申请返回 `409`（partial unique）。

### 撤回招新申请

```text
POST /api/recruitment-applications/{id}/withdraw
权限：LOGIN（申请人）
```

仅 `PENDING` 状态的申请可撤回，成功 `204`；非申请人返回 `403`，申请不存在或按隐私隐藏返回 `404`，非 `PENDING` 返回 `409 INVALID_STATE`。V0.1 不提供直接申请组织端点；唯一正规链路是 Organization -> Recruitment -> RecruitmentPosition -> RecruitmentApplication。

## 3.6 Activities（活动）

### 活动列表

```text
GET /api/activities
权限：PUBLIC
Query: q, status, activity_type, page, page_size
```

`status`：`OPEN`（报名中）/ `UPCOMING` / `ENDED`
`activity_type`：`COMPETITION_BRIEFING` / `TECH_SHARING` / `RESEARCH_LECTURE` / `FURTHER_STUDY` / `ENTERPRISE` / `TRAINING` / `OTHER`

results 列表项：

```json
{
  "id": "uuid",
  "title": "大模型技术分享会",
  "activity_type": "TECH_SHARING",
  "summary": "……",
  "organizer_name": "人工智能学院",
  "speaker": "张教授",
  "location": "信息楼 A101",
  "start_at": "2026-09-10T14:00:00+08:00",
  "end_at": "2026-09-10T16:00:00+08:00",
  "cover": {
    "id": "uuid",
    "url": "https://media.example.edu/activity-cover.webp"
  },
  "registration_required": true,
  "registration_state": "OPEN",
  "capacity": 100,
  "registered_count": 42,
  "publication_state": "PUBLISHED"
}
```

`registered_count` 仅在 LOGIN 且活动公开时可返回（INTERNAL 级别展示）。

### 活动详情

```text
GET /api/activities/{id}
权限：PUBLIC
```

列表项字段 + `description_md`、`registration_start_at/end_at`、`notes_md`、`registered`（LOGIN 时本人是否已报名）。

### 报名 / 取消报名

```text
POST /api/activities/{id}/register
POST /api/activities/{id}/cancel-registration
权限：LOGIN
```

- 报名事务（§26）：`select_for_update(activity)`、容量校验、写 Registration（快照姓名 / 学号 / 班级来自本人资料）；成功 `201`；
- 已报名重复报名返回 `409`；`registration_required=false` 或状态不允许返回 `422`；容量满返回 `422`（code `CAPACITY_FULL`）；
- 取消报名返回 `204`；未报名返回 `404`。

## 3.7 Content（内容）

### 通知公告

```text
GET /api/announcements
权限：PUBLIC
Query: q, publisher_scope, page, page_size
```

results 列表项：

```json
{
  "id": "uuid",
  "title": "2026 秋季竞赛报名提醒",
  "summary": "……",
  "published_at": "2026-08-30T09:00:00+08:00",
  "is_pinned": true,
  "publisher_scope": "ACADEMY | UNIVERSITY | PLATFORM",
  "external_url": "https://www.example.edu/notice/2026-01",
  "linked_object": {
    "type": "COMPETITION",
    "id": "uuid",
    "path": "/competitions/{id}"
  }
}
```

`linked_object` 可为 `null`，表示学院、学校或平台的通用公告。`external_url` 可为 `null`；有值时前端将其呈现为明确的站外“查看原文”操作，不抓取、镜像或嵌入站外正文。

详情 `GET /api/announcements/{id}` 返回列表字段和 `body_md` 全文。公开公告供校园动态页浏览；它不会因为发布而自动出现在任何用户的 `/api/notifications` 列表中。

### 指南

```text
GET /api/guides
权限：PUBLIC
Query: q, category, page, page_size
GET /api/guides/{id}
```

`category`：`COMPETITION` / `RESEARCH` / `FURTHER_STUDY` / `CERTIFICATE` / `PROCESS` / `EXPERIENCE` / `OTHER`。详情含 `body_md` 与关联竞赛（`content_guide_competition`）。

### FAQ

```text
GET /api/faqs
权限：PUBLIC
Query: q, category, page, page_size
```

results：`question`、`category`、`answer_md`、`sort_order`。

### 公开问答

```text
GET /api/qa/public
权限：PUBLIC
Query: q, category, page, page_size
```

仅 `visibility=PUBLIC` 且 `status != OPEN`（已答复）的咨询。

## 3.8 Consultations（咨询）

### 提交咨询

```text
POST /api/consultations
权限：LOGIN
```

Request body：

```json
{
  "category": "COMPETITION",
  "competition_id": "uuid（可选）",
  "title": "请问大创项目如何申报？",
  "body_md": "……",
  "visibility": "PUBLIC | PRIVATE"
}
```

约束：`title` 4-120、`body_md` 10-5000。Response `201`。

### 咨询详情

```text
GET /api/consultations/{id}
权限：PUBLIC（公开已答复）/ LOGIN（本人 / OPERATOR / SUPERADMIN）
```

PRIVATE 且非本人 / 非运营：返回 `404`（存在性隐藏）。详情含 `status`、`answered_at`、`replies[]`（`body_md`、`author`、`created_at`）。

## 3.9 Notifications（消息）

```text
GET /api/notifications?page=&page_size=&unread=true&type=TEAM
GET /api/notifications/unread-count
POST /api/notifications/{id}/read
POST /api/notifications/read-all
权限：LOGIN（本人）
```

列表项：

```json
{
  "id": "uuid",
  "notification_type": "TEAM",
  "title": "你申请加入的队伍已通过",
  "body": "……",
  "action_path": "/teams/{id}",
  "read_at": null,
  "created_at": "2026-09-01T10:00:00+08:00"
}
```

未读数 `{"count": 3}`。已读操作返回 `204`。

`/api/notifications` 只返回当前登录用户作为 `recipient` 的个人消息。公开 Announcement 属于 `/api/announcements`，默认不复制到消息中心；活动取消、活动临近、申请状态变化等定向流程可把 `action_path` 指向活动详情或公告详情。

## 3.10 Media（媒体）

### 上传

```text
POST /api/media/upload
权限：LOGIN（上传者）
Content-Type: multipart/form-data
字段: file（单文件）, kind（IMAGE / DOCUMENT）
```

约束（database-design.md §9.1）：

```text
图片: jpg / jpeg / png / webp / avif，单张 <= 5 MB
文档: 暂不启用（如启用 <= 20 MB）
```

Response `201`：

```json
{
  "id": "uuid",
  "url": "https://cdn.example.edu/…",
  "original_name": "photo.jpg",
  "mime_type": "image/jpeg",
  "size_bytes": 102400,
  "width": 1200,
  "height": 675
}
```

媒体生命周期（删除）V0.1 由运营 / 系统管理，不提供公开删除端点。

## 3.11 Search（全站搜索）

```text
GET /api/search?q=&page=&page_size=
权限：PUBLIC
```

搜索域（database-design.md §24）：Competition / Organization / Recruitment / TeamPost / Activity / FAQ / Guide / Announcement。

响应：

```json
{
  "count": 23,
  "next": "…",
  "previous": null,
  "results": [
    {
      "type": "COMPETITION",
      "id": "uuid",
      "title": "全国大学生数学建模竞赛",
      "subtitle": "国家级 · 团队赛",
      "path": "/competitions/{id}",
      "matched_field": "name"
    }
  ]
}
```

排序：按类型固定顺序 + 相关性（V0.1 允许类型分组 + 时间倒序，不引入评分复杂度）。

## 3.12 Ops（运营管理）

### 发布型内容统一契约

以下端点属于“发布型内容”，共享同一套创建、编辑、发布与元数据契约：

```text
/api/ops/competitions                                竞赛
/api/ops/activities                                  活动
/api/ops/announcements                               公告
/api/ops/guides                                      指南
/api/ops/faq                                         FAQ
/api/ops/documents                                   站点文档
/api/manage/organizations/{orgId}/recruitments       招新
```

#### 创建意图（Create Intent）

所有发布型 collection 的 `POST` 额外接受：

```json
{ "publish": false }
```

- `publish` 缺省为 `false`：创建 `DRAFT`，`201` 返回管理详情。
- `publish: true`：在**一个数据库事务内**创建、校验并直接发布，`201` 返回 `PUBLISHED` 管理详情。
- 已存在的草稿继续通过 `POST /{id}/publish` 发布。
- `publication_state` 禁止客户端直接写入；状态只走 action endpoint 或 create intent。
- 创建或发布校验失败一律**整体回滚**，不得留下“已创建但未发布”的半成品。前端不得用“先 POST 创建、再 POST publish”两次请求模拟原子发布。

#### 管理响应元数据

发布型管理详情（`GET` / `PATCH` / `POST` 的响应）至少包含：

```json
{
  "id": "uuid",
  "publication_state": "DRAFT | PUBLISHED | CANCELLED | ARCHIVED",
  "allowed_actions": ["EDIT", "PUBLISH"],
  "created_at": "2026-08-18T09:24:00+08:00",
  "updated_at": "2026-08-29T16:40:00+08:00",
  "published_at": null
}
```

- `allowed_actions` 由后端按“当前用户 + 当前状态 + 当前数据约束”计算，取值来自 `EDIT`、`PUBLISH`、`ARCHIVE`、`DELETE_DRAFT`、`CANCEL`、`COMPLETE`、`FEATURE`。
- 不同领域只返回适用动作（FAQ 无 `CANCEL`，招新才有 `COMPLETE`）。它不是状态常量映射，同一状态在不同数据下可以返回不同动作。
- 前端按 `allowed_actions` 渲染按钮，不得自行推断权限。隐藏按钮不是权限控制，后端仍必须独立校验。

#### 可编辑状态

`PATCH` 只在 `DRAFT` 与 `PUBLISHED` 下允许：

- `DRAFT`：可自由修改。
- `PUBLISHED`：可直接修改，**保存后立即对学生生效**，并写入 AuditLog。V0.1 不引入修订表或审核流。
- `CANCELLED` / `ARCHIVED`：只读，返回 `409 INVALID_STATE`。

#### 关联数组语义

`competition_ids`、`positions` 等关联数组遵循：

- 字段省略 = 保持不变；
- `[]` = 明确清空；
- 招新 `positions` 为全量数组，按元素 `id` 局部更新，未出现的已有岗位删除（存在申请时受保护，见 `EndpointReference.md`）。

前端 Draft 必须完整回填后才可发送全量数组，不得以空数组覆盖未加载的关联。

#### 发布完整性

发布（含 `publish: true` 与 `POST /{id}/publish`）校验不通过时返回 `422 PUBLICATION_INCOMPLETE`：

```json
{
  "code": "PUBLICATION_INCOMPLETE",
  "message": "发布前缺少必填内容",
  "fieldErrors": {
    "cover_asset_id": ["发布前必须上传封面图"],
    "registration_end_at": ["发布前必须设置报名截止时间"]
  }
}
```

前端保留草稿并展示缺失项列表，不重复创建记录。

### 竞赛管理

```text
GET  /api/ops/competitions?page=&page_size=&status=&q=
POST /api/ops/competitions
GET  /api/ops/competitions/{id}
PATCH /api/ops/competitions/{id}
权限：OPERATOR / SUPERADMIN
```

管理响应含全部字段（含 `publication_state`、`is_featured`、`featured_order`、`created_by_id`、`updated_by_id`）。创建 / 编辑字段同 database-design.md §12.1，约束见 §20。

状态操作：

```text
POST /api/ops/competitions/{id}/publish   DRAFT -> PUBLISHED（校验必填完整）
POST /api/ops/competitions/{id}/cancel    -> CANCELLED
POST /api/ops/competitions/{id}/archive   -> ARCHIVED
PATCH /api/ops/competitions/{id}/featured body: {"is_featured": true}
```

非法状态转移返回 `409`。状态操作写 AuditLog。

时间线节点：

```text
POST   /api/ops/competitions/{id}/timeline-events   body: {title, event_at, end_at?, description?, sort_order}
PATCH  /api/ops/competitions/{id}/timeline-events/{eid}
DELETE /api/ops/competitions/{id}/timeline-events/{eid}
```

### 校园动态管理：活动 API

```text
GET  /api/ops/activities?page=&page_size=&status=&q=
POST /api/ops/activities
GET  /api/ops/activities/{id}
PATCH /api/ops/activities/{id}
POST /api/ops/activities/{id}/publish | /cancel | /archive | /close-registration
PATCH /api/ops/activities/{id}/featured
GET  /api/ops/activities/{id}/registrations?page=&page_size=&status=
POST /api/ops/activities/{id}/export-registrations
权限：OPERATOR / SUPERADMIN
```

### 校园动态组合发布

运营端“发布动态”可选择仅创建活动、仅创建公告，或同步创建一场活动及其关联公告。前两种分别继续使用现有的 `/api/ops/activities` 与 `/api/ops/announcements`；只有第三种使用：

```text
POST /api/ops/dynamics/activity-with-announcement
权限：OPERATOR / SUPERADMIN
```

请求：

```json
{
  "activity": { "活动创建字段": "与 POST /api/ops/activities 相同" },
  "announcement": {
    "title": "大模型技术分享会报名开启",
    "summary": "……",
    "body_md": "……",
    "publisher_scope": "ACADEMY",
    "external_url": null,
    "is_pinned": false
  },
  "publish": true
}
```

服务端忽略客户端提供的 `announcement.activity_id`，改为绑定本次创建的 Activity；以一个事务创建两个对象，`publish=true` 时同时设为 `PUBLISHED`，否则同时为 `DRAFT`。成功 `201`：

```json
{
  "activity": { "id": "uuid", "publication_state": "PUBLISHED" },
  "announcement": { "id": "uuid", "activity_id": "uuid", "publication_state": "PUBLISHED" }
}
```

任一字段或写入失败均回滚，禁止留下只创建活动或只创建公告的半成品；该操作写两条 AuditLog。组合发布不自动向全体用户创建个人 Notification。

报名名单项（SENSITIVE，仅运营）：

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name_snapshot": "张三",
  "student_no_snapshot": "20240001",
  "class_name_snapshot": "人工智能 2401",
  "major_snapshot": "人工智能",
  "grade_snapshot": 2,
  "status": "REGISTERED",
  "registered_at": "2026-09-01T10:00:00+08:00"
}
```

导出：`POST` 返回 CSV 文件下载（`text/csv`）。

### 咨询管理

```text
GET  /api/ops/consultations?page=&page_size=&status=&visibility=&q=
GET  /api/ops/consultations/{id}
POST /api/ops/consultations/{id}/replies
POST /api/ops/consultations/{id}/close
权限：OPERATOR / SUPERADMIN
```

**咨询是正式答疑记录，不是聊天窗口。**

- 回复 **append-only**：`POST /{id}/replies` 只追加，不提供编辑或删除回复的端点。答复有误时追加“更正说明”，保留完整可追溯历史。
- 回复 body：`{"body_md": "……"}`（1-10000）。首次回复后咨询 `status -> ANSWERED`。
- `POST /{id}/close`：仅允许 `OPEN / ANSWERED -> CLOSED`，其他状态返回 `409 INVALID_STATE`。关闭后禁止再回复（`409 INVALID_STATE`）。默认**不**开放 `CLOSED -> OPEN`。
- 状态流转与回复均写 AuditLog 并定向通知提问者。

管理详情 `GET /{id}` 返回运营视角 DTO，包含问题正文、作者必要信息、`visibility`、关联竞赛、**完整回复历史**、`status` 与 `allowed_actions`；不得复用面向公开展示的 `ConsultQaPost`（后者会压扁回复历史并暴露隐私判断给前端）。

PRIVATE 咨询仅运营与作者可见，运营端需明确标识但不以颜色作为唯一信息载体。

### 指南 / FAQ / 公告 / 轮播管理

字段与公开读取一致，增加 `publication_state` 管理与状态操作：

```text
GET    /api/ops/guides                管理列表
GET    /api/ops/guides/{id}           管理详情
POST   /api/ops/guides                创建
PATCH  /api/ops/guides/{id}           编辑
POST   /api/ops/guides/{id}/publish   发布
POST   /api/ops/guides/{id}/archive   归档
PATCH  /api/ops/guides/{id}/featured  设置 / 取消推荐
GET    /api/ops/faq                   管理列表
GET    /api/ops/faq/{id}              管理详情
POST   /api/ops/faq                   创建
PATCH  /api/ops/faq/{id}              编辑
POST   /api/ops/faq/{id}/publish      发布
POST   /api/ops/faq/{id}/archive      归档
PATCH  /api/ops/faq/{id}/featured     设置 / 取消推荐
GET    /api/ops/announcements         管理列表
GET    /api/ops/announcements/{id}    管理详情
POST   /api/ops/announcements         创建（必填 publisher_scope；可关联一个核心对象，非 null 数 <= 1）
PATCH  /api/ops/announcements/{id}    编辑
POST   /api/ops/announcements/{id}/publish
POST   /api/ops/announcements/{id}/archive
GET    /api/ops/banners               管理列表
GET    /api/ops/banners/{id}          管理详情
POST   /api/ops/banners               创建轮播（link_type 与 URL 字段匹配）
PATCH  /api/ops/banners/{id}          编辑
权限：OPERATOR / SUPERADMIN
```

公告创建/编辑还接受 `external_url`（可空）。`publisher_scope` 仅为 `ACADEMY`、`UNIVERSITY` 或 `PLATFORM`；若运营人员选择“活动并同步公告”，改用上一节组合发布端点，而不是先在客户端创建活动再补写公告。

## 3.13 Manage（组织管理，LEADER / ADVISOR）

所有 `/api/manage/organizations/{orgId}/…` 端点：

```text
权限：ORG_MANAGER(org) 或 SUPERADMIN
```

其中：

```text
ORG_MANAGER(org)
=
active membership
AND role IN (LEADER, ADVISOR)
AND organization_id = orgId
```

`ADVISOR` 还必须满足：

```text
user.identity_type = TEACHER
```

`LEADER` 与 `ADVISOR` 对当前组织权限一致；OPERATOR 不因为平台运营权限自动获得组织管理能力。否则 `403`。

### 组织资料

```text
GET  /api/manage/organizations/{orgId}/profile
PATCH /api/manage/organizations/{orgId}/profile
```

可编辑：`short_intro`、`description_md`、`logo_asset_id`、`banner_asset_id`、`public_contact`。
不可编辑（V0.1）：`name`、`organization_type`、LEADER / ADVISOR 授权、停用、删除（SUPERADMIN 专属）。

指导老师不是 `advisor_name` 文本字段，因此不存在通过 PATCH profile 手工修改指导老师姓名的行为。指导老师授权 / 撤销只通过 SUPERADMIN 的 Django Admin / 受控后台流程完成。

### 招新管理

```text
GET    /api/manage/organizations/{orgId}/recruitments?page=&page_size=&status=
POST   /api/manage/organizations/{orgId}/recruitments
GET    /api/manage/organizations/{orgId}/recruitments/{rid}
PATCH  /api/manage/organizations/{orgId}/recruitments/{rid}
POST   /api/manage/organizations/{orgId}/recruitments/{rid}/publish
POST   /api/manage/organizations/{orgId}/recruitments/{rid}/cancel
POST   /api/manage/organizations/{orgId}/recruitments/{rid}/complete
POST   /api/manage/organizations/{orgId}/recruitments/{rid}/archive
```

招新 body（含 positions 嵌套数组），约束见 database-design.md §20。`complete` 写 `completed_at`（状态机 §19.2）。

### 申请管理

```text
GET  /api/manage/organizations/{orgId}/applications?page=&page_size=&status=
POST /api/manage/organizations/{orgId}/applications/{aid}/accept
POST /api/manage/organizations/{orgId}/applications/{aid}/reject
```

申请列表项（INTERNAL）：

```json
{
  "id": "uuid",
  "applicant": { "id": "uuid", "nickname": "阿三", "major": "人工智能", "grade": 2 },
  "position_id": "uuid",
  "position_name": "技术部干事",
  "self_intro": "……",
  "skills": "……",
  "experience": "……",
  "motivation": "……",
  "status": "PENDING",
  "created_at": "2026-09-01T10:00:00+08:00"
}
```

accept 必须走事务 Service（§26 / §11.3）：确认 PENDING、校验岗位名额、置 ACCEPTED、创建 / 激活 `OrganizationMembership`（role=MEMBER，title 默认 position.name）、创建 Notification。成功 `204`。

---

# 4. 错误码表

```text
AUTH_REQUIRED          401  需要登录
ACCOUNT_UNAVAILABLE    403  账号尚未启用或不可用（不暴露内部原因）
ACCOUNT_EXISTS          409  学号或用户名已存在
PERMISSION_DENIED      403  无权限
NOT_FOUND              404  不存在或按隐私策略隐藏
METHOD_NOT_ALLOWED     405  请求方法不被端点支持
VALIDATION_ERROR       400  参数校验失败（含 fieldErrors）
ALREADY_FOLLOWED       409  重复关注
DUPLICATE_APPLICATION  409  已存在有效申请
CANNOT_APPLY_OWN       422  不能申请自己的组队
CAPACITY_FULL          422  容量已满
TIME_WINDOW_CLOSED     422  不在报名 / 申请时间窗
INVALID_STATE          409  状态机不允许的转移
PUBLICATION_INCOMPLETE 422  发布前缺少必填内容（含 fieldErrors，列出缺失项）
NO_ACTIVE_RECRUITMENT  422  组织当前无开放招新
UNSUPPORTED_MEDIA      400  文件类型 / 大小不符合
INTERNAL_ERROR         500  未预期错误
```

后端不得返回裸 `500` 带堆栈；一律转换为上述结构。

---

# 5. 与前后端的关系（责任链）

```text
database-design.md（字段与约束真源）
        ↓
APIContract.md（本文件：传输契约）
        ├── 前端：src/shared/api、Feature API 模块、FE-005 Domain Types（以本文件响应结构为准）
        └── 后端：DRF Serializer、View、Service（以本文件 request / response 为准）
```

- 前端 FE-005 定义类型时，字段名与本文件响应一致；不允许自造持久字段；
- 后端实现时，本文件未列出的公开端点不得自行新增；确需新增走"变更评审"流程；
- 前后端契约不一致时：停止 → 记录差异 → 提出最小变更 → 更新本文件 → 双方同步。

---

# 6. 已冻结的实施说明

1. **认证**：同源 Django Session、HttpOnly cookie 与 CSRF；自助注册按 `STUDENT_REGISTRATION_AUTO_ACTIVATE` 创建立即启用或待审核账号，关闭自动启用时由 Django Admin 审核；忘记密码固定联系管理员。
2. **组织申请**：V0.1 只接受 Recruitment 下带 `position_id` 的申请；不存在直接申请组织端点。
3. **首页**：`GET /api/home` 是唯一首屏聚合 Read Model；不得改用多个首屏模块请求。
4. **媒体删除**：`media_asset` 的 PENDING_DELETE / DELETED 流转由运营或系统管理，V0.1 无公开删除端点。
5. **排序**：各端点只接受正文列出的 `ordering` 值，其他值返回 `400`。
6. **导出名单**：CSV 固定使用 UTF-8 with BOM，保证 Excel 兼容。
7. **限流**：`429` 保留在错误模型中；是否在部署层启用不改变任何端点语义。
8. **逐端点参考**：`EndpointReference.md` 是每个端点的 request body、response DTO、错误与副作用依据；新增或修改 API 必须同时更新两份 API 文档。

---

# 7. 评审通过条件

本文件已在 BE-000 转为 Baseline。后续变更必须同时满足：

```text
所有端点 method / path 评审通过
认证方案、隐私字段、错误码与状态码映射不被静默修改
隐私字段边界评审通过
错误码与状态码映射评审通过
前后端代表确认可按此并行开发
```
