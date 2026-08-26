# V0.1 数据清单、保留与注销流程

> 状态：BE-067 的冻结运行规则。正式上线前，学校运维仍须确认备份存储位置、法定留存要求、RPO/RTO 与责任人；这些值不写入 Git。

| 数据 | 分级 | 用途 | 可访问者 | 在线保留期 | 删除 / 匿名化方式 |
|---|---|---|---|---|---|
| `User.real_name`、`student_no`、`username`、email | SENSITIVE | 待审核账号与本人身份识别 | 本人、SUPERADMIN；必要 Django Admin 审核 | 账号存续期间 | 注销确认后停用账号并由 SUPERADMIN 执行匿名化：学号为 null、账号名替换为 UUID 派生值、姓名替换为固定占位、邮箱清空 |
| `UserProfile.class_name`、昵称、专业、年级、简介、技能 | SENSITIVE / PUBLIC（以字段定义为准） | 个人资料和组队展示 | 本人；公开字段仅按 Serializer 暴露 | 账号存续期间 | 同一匿名化事务清空，不删除 User UUID |
| 头像与 MediaAsset 元数据 | PUBLIC URL / INTERNAL 元数据 | 个人与内容展示 | URL 按公开 DTO；object key/hash/上传者仅内部 | 业务引用有效期间 | 注销时解除 Profile 引用；仅当无其他业务引用时由受权运维走既有媒体删除生命周期 |
| 组队、招新申请的联系方式、动机、经历与自述 | SENSITIVE | 申请评估与申请处理 | 申请人、对应作者/组织负责人、必要运营、SUPERADMIN | 招新/组队关闭后 1 年 | 到期由受权数据管理员按领域记录最小化；不通过级联删除破坏 AuditLog 或成员历史 |
| 活动 Registration 与报名快照 | SENSITIVE | 名额、签到、名单导出 | 本人、活动运营、SUPERADMIN | 活动结束后 1 年 | 到期由受权数据管理员最小化个人快照；保留不可识别的统计值 |
| PRIVATE Consultation 与回复 | SENSITIVE | 私密咨询处理 | 作者、OPERATOR、SUPERADMIN | 结案后 1 年 | 到期删除正文或按学校书面要求延长；公开咨询不因此获得 PRIVATE 访问权 |
| AuditLog | INTERNAL | 操作追责与变更证据 | SUPERADMIN、受权运维 | 创建后 2 年 | 不由普通业务删除；到期由受权运维在已验证备份策略下归档或清理 |
| AuthThrottle HMAC 摘要 | SENSITIVE | 登录/注册暴力尝试缓解 | 应用代码、受权运维 | 活动窗口结束后最长 30 天 | `purge_auth_throttles` 每日清理；不存明文 IP、学号、密码或失败正文 |
| 安全与访问日志 | SENSITIVE | 故障排查与安全调查 | 受权运维 | 30 天，除非受批准的事件调查需要保全 | journald/日志平台到期轮转；不得含密码、cookie、Session、CSRF、Authorization、DB URL、S3 secret、学号或联系方式 |

## 注销与访问请求

V0.1 不暴露自助注销 API。学生向平台指定渠道提交请求；SUPERADMIN 在确认身份、完成必要业务交接后，先停用账号，再通过 Django Admin 的“匿名化已停用且已确认注销的账号”动作执行最小匿名化。该动作不删除历史 FK、不删除 AuditLog，也不允许对超级管理员执行。

数据访问、更正或异常删除请求由 SUPERADMIN 依据本表和学校书面规则处理。任何导出、备份或恢复必须遵循最小权限和脱敏证据要求。
