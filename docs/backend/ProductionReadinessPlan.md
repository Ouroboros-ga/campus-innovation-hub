# ProductionReadinessPlan.md

> 产品：人工智能学院科创与就业服务平台
> 阶段：BE-050 Product Closure + Release Readiness
> 状态：BE-050A 产品收口已实现并通过隔离 PostgreSQL 验证；BE-060 至 BE-068 的代码、配置与文档资产已落地，预发布/恢复/目标提交 CI 证据仍缺失
> 实现基线：`main@5fd5ed3bc284276057cf3442ec203412839237dc`
> 前置规范：`BackendArchitecture.md`、`database-design.md`、`APIContract.md`、`EndpointReference.md`、`PRD.md`、`PageMap.md`

---

# 1. 目标与非目标

BE-050 的目标是收口 V0.1 已冻结但未注册的学生端契约。Production Candidate 还必须通过 BE-060 至 BE-068 的安全基线；安全要求见 [`SecurityBaseline.md`](SecurityBaseline.md)，不再把安全配置零散混入业务 API 任务。

本阶段不等同于直接发布。未取得单独授权时，不修改生产数据库、DNS、TLS 证书、对象存储桶策略、Nginx 运行配置或现有服务；预发布验证完成后再单独评审发布窗口。

本阶段不做：

- 新增产品功能、页面、前端 fixture 切换或 WebSocket；
- 学校统一认证、邮件/短信通知、MinIO、自建消息队列或 Redis；
- 未经评审的 API 改名、数据库字段扩张或“万能 JSONField”；
- 把一次本机/隔离容器测试称作生产发布。

---

# 2. 发布门槛

| 门槛 | 必须满足的证据 | 未通过时的结论 |
|---|---|---|
| 契约收口 | 组队作者申请处理和 `/api/me/*` 的实际 DTO、权限、错误与分页在两份 API 契约中一致，并有 HTTP 合同测试 | 不开始前端真实 API 接入 |
| 数据正确性 | PostgreSQL 中完整 Migration、关键约束、组队申请处理行锁和个人数据隔离均由测试验证 | 不能进入预发布 |
| 媒体 | `local` 保持可用；选择的 S3-compatible 服务完成上传、公开读取地址和元数据失败补偿验证，响应不泄露 `object_key` | 不能将 `MEDIA_STORAGE_BACKEND=s3` 用于生产 |
| 安全配置 | BE-060 至 BE-064 的 production settings、TLS 代理信任、Default Deny、安全 header、上传与部署验证有自动化和预发布证据 | 不公开暴露服务 |
| 运维 | BE-065 的版本化 Nginx/systemd 配置、日志、健康与就绪、备份及恢复演练均有记录 | 不做正式发布 |
| 质量门禁 | BE-066 至 BE-068 的目标 commit CI、预发布安全/上传/并发验证和人工 go/no-go 记录齐全 | 不将“workflow 文件存在”视为通过 |

---

# 3. 执行顺序

## BE-050A：冻结路径的产品收口

1. 先补齐个人中心的逐项 DTO。当前契约已固定 URL 与权限，但 `TeamPostOwnerItem`、`MyApplicationItem`、`MyActivityItem`、`MyConsultationItem` 没有足以直接实现的 JSON 字段表；尤其 `/api/me/applications` 是组队申请与招新申请的混合分页，必须先定义稳定的 `kind`、公共字段、资源摘要和 `action_path`，不可直接拼接两个 ORM 模型的原始字段。
2. 实现组队作者的申请列表、接受和拒绝。接受必须复用已有 `accept_team_application(...)`；拒绝要以同样的 post→application 锁顺序、定向 Notification 与 AuditLog 编写事务 Service。
3. 在现有 `student_api` 中实现个人中心查询与资料更新，避免为只读聚合新建无领域含义的 app。所有 QuerySet 必须按当前用户或 active organization membership 限定；任何他人联系方式、报名快照、私密咨询或内部媒体元数据均不得进入响应。

**完成条件：** 每个新路径至少覆盖 success、empty、401、403（适用时）、无 CSRF 的 403、非法 UUID/Query、404、状态冲突以及敏感字段不泄露。个人中心的跨模型分页排序应是确定性的，并写明统一排序键与 cursor/page 语义。

**当前证据：** 已实现组队作者申请处理、`/api/me/*` 与 Profile allowlist 更新；隔离 PostgreSQL 已验证 `manage.py check`、`makemigrations --check --dry-run`、包含状态机/并发回归的 25 项定向测试，以及 90 项完整 Django suite。此证据只证明 BE-050A，不构成预发布或生产发布证明。

## BE-060 至 BE-068：Security Baseline 与最终发布证据

安全工作包已从 BE-050 中拆出：BE-060 至 BE-064 是 P0，覆盖认证、Default Deny/IDOR、Web Security、上传/对象存储和部署基础设施；BE-065 至 BE-068 形成日志/备份、CI、隐私与最终攻击场景证据。当前实现已加入代码与版本化模板，但未运行新的安全套件、未连通预发布 bucket、未演练恢复、未验证真实 headers，也未取得目标提交 CI 成功记录；因此仍不是 Production Candidate。精确文件边界、错误契约、验收和停止条件以 [`SecurityBaseline.md`](SecurityBaseline.md) 为准。

Python 依赖已由 BE-066 迁移为 `pyproject.toml` 与提交的 `uv.lock`，作为 Python 3.12 安装真源；CI 使用 `uv sync --frozen --group dev`。`requirements/*.txt` 已移除，禁止重新引入第二套可编辑真源。

---

# 4. 关键待确认项

以下不是实现智能体可自行选择的事项，进入对应子任务前必须记录为明确配置或评审结论：

1. 实际生产域名、TLS 终止位置与 `CSRF_TRUSTED_ORIGINS`；
2. 选择的 S3-compatible 供应商、bucket、公开媒体域名、访问策略和预发布 bucket；
3. `/api/me/applications` 的统一 DTO 及跨类型分页排序语义；
4. `/api/me/teams` 如何在同一路径表达 PageMap 已要求的“我发布的 / 我加入的”，以及二者的分页、排序与 DTO；
5. `/api/me/profile` 是否在现有可编辑 Profile 外返回只读真实姓名、学号、班级，以满足资料页；
6. `/api/me/*` 是否需要包含已取消/已归档历史记录，以及保留期限；
7. PostgreSQL 与媒体备份的目标、保存周期、恢复责任人和可接受恢复时间；
8. 正式发布窗口、回滚版本和允许执行预发布部署的服务器范围。

这些选择应通过环境变量、部署文档或 API 契约表达；不得硬编码账号、域名、密钥或服务器 IP。

---

# 5. 停止条件

- BE-050A 完成后停止，等待前端真实 API 接入评审；
- BE-060 至 BE-064 任一项完成后均停止并独立评审；未完整通过不得预发布部署；
- BE-065 至 BE-068 只产出运行与 go/no-go 证据，不自行发布生产。
