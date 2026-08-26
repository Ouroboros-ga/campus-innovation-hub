# BE-068：预发布安全攻击演练与 Go / No-Go

> 状态：执行模板。所有“观察结果”当前均未执行；不得以表格存在替代预发布证据。

| 场景 | 命令 / 操作 | 预期结果 | 观察结果 | 证据路径 | 复核人 |
|---|---|---|---|---|---|
| 暴力登录 | 同一用户名与同一来源连续输错密码 | 第六次请求起 `429 RATE_LIMITED`，无账号枚举信息 | 未执行 | 未填写 | 未指定 |
| 重复注册 | 同一来源提交多次合规注册 / 已存在账号 | 保留 `409 ACCOUNT_EXISTS`；达到短时阈值后 `429` | 未执行 | 未填写 | 未指定 |
| SQL-like 输入 | 在 query 与 JSON 字段输入引号、注释、超长搜索 | 参数校验或安全空结果，无 traceback / SQL 片段 | 未执行 | 未填写 | 未指定 |
| XSS Markdown/link | 提交 HTML、`javascript:`、scheme-relative URL | renderer 禁止 raw HTML 并 sanitizer/URL allowlist 拒绝危险输出 | 未执行 | 未填写 | 未指定 |
| 上传伪 JPG / SVG | 文件名或 header 伪装为 JPG、SVG | `400 UNSUPPORTED_MEDIA`，不写对象或 MediaAsset | 未执行 | 未填写 | 未指定 |
| 100 MB body / 超像素图 | 超出 Nginx/Django/Pillow 限制的请求 | 体积被代理或应用拒绝；无 OOM | 未执行 | 未填写 | 未指定 |
| 路径穿越 | 尝试 `../`、绝对对象 key 或编码变体 | 安全失败，不写媒体目录外路径 | 未执行 | 未填写 | 未指定 |
| 跨用户 UUID | 用户 A 读取/撤回用户 B 的私密申请、通知、咨询、报名 | 既定 `403` 或存在性隐藏 `404`，不泄露 DTO | 未执行 | 未填写 | 未指定 |
| 跨组织管理 | 组织 A 的 LEADER / OPERATOR 操作组织 B | `403` 或 `404`，不跨 `organization_id` | 未执行 | 未填写 | 未指定 |
| 伪造 CSRF / cookie | 缺 CSRF、跨 Origin、伪造 Session | 写请求 `403` / `401`，不执行副作用 | 未执行 | 未填写 | 未指定 |
| 私密搜索 | 搜索 PRIVATE 咨询、草稿、申请正文 | 无私密结果或敏感字段 | 未执行 | 未填写 | 未指定 |
| 开放重定向 | `next`、`action_path`、internal path 传外部 URL | 仅站内绝对路径；外部 URL 不被当作跳转目的地 | 未执行 | 未填写 | 未指定 |
| 分页资源耗尽 | 超大 page/page_size、极长 q、排序异常 | `400 VALIDATION_ERROR` 或固定上限；无慢查询持续异常 | 未执行 | 未填写 | 未指定 |

## Go / No-Go

只有所有 P0 场景、production `check --deploy`、迁移计划、PostgreSQL 事务/权限回归、S3 预发布上传与补偿删除、备份恢复、HTTPS/header/CSP Report-Only、目标 SHA 的 CI 均有可复现证据时，复核人才能填写 Go。任一失败、缺证据或未获远程写入授权均为 No-Go，不部署。
