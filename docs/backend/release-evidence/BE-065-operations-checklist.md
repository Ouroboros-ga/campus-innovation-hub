# BE-065：日志、审计、备份与恢复运行证据

> 状态：执行模板；本仓库尚未填入任何预发布或生产结果。

## 1. 日志与审计

| 检查 | 要求 | 证据路径 / 结果 | 复核人 |
|---|---|---|---|
| Django/Gunicorn 日志 | 只输出 stdout/journald；不出现密码、cookie、Session、CSRF、Authorization、`DATABASE_URL`、S3 secret、学号或联系方式 | 未执行 | 未指定 |
| AuditLog | 拒绝敏感 `changes_json`；账号启停、角色/负责人变更、组织资料、发布/取消/归档、申请接受/拒绝、活动取消均有动作记录 | 未执行 | 未指定 |
| 日志访问 | journald 与备份目录仅运维最小角色可读；日志不导出至公开系统 | 未执行 | 未指定 |

## 2. 备份与恢复

| 检查 | 要求 | 证据路径 / 结果 | 复核人 |
|---|---|---|---|
| PostgreSQL 备份 | `backup-postgres.sh` 生成 custom dump、`.sha256` 与 manifest；复制到批准的加密位置 | 未执行 | 未指定 |
| 完整性 | `verify-backup.sh` 校验 SHA-256 与 `pg_restore --list` | 未执行 | 未指定 |
| 隔离恢复 | `restore-postgres.sh` 只接受 `*_restore_test`，在一次性数据库完成恢复与应用 smoke check | 未执行 | 未指定 |
| 媒体 | 对象存储版本/生命周期、恢复责任人与 RPO/RTO 由供应商与学校运维评审后记录 | 未执行 | 未指定 |

## 3. 明确非结论

此模板、脚本和日志 formatter 的存在不代表备份可恢复、告警已配置或服务可长期运行。真实目标、保留周期、加密方式、恢复责任人与审批人尚需单独确认，且不得记录到 Git。
