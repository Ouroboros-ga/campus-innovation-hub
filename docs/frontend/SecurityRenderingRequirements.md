# 前端 Markdown 与 Web 安全渲染要求

> 状态：BE-062 的发布依赖。本文不授予前端绕过后端 DTO、CSRF 或权限边界的权限。

## 1. Markdown 边界

- `*_md` 是不可信的 Markdown 源文本，不是已清洗 HTML；
- Markdown parser 必须关闭 raw HTML；任何用户内容、公告正文、指南或咨询不得直接以 `v-html` 渲染；
- 即使 parser 关闭 raw HTML，渲染结果仍须经过可信 sanitizer；
- 链接只允许 `https:`、`http:`、`mailto:`，站内动作只允许以 `/` 开头的相对路径；拒绝 `javascript:`、`data:`、scheme-relative URL 与未经批准的自定义 scheme；
- 外部链接使用明确跳转，不 iframe 学校官网或外部正文；`target="_blank"` 必须使用 `rel="noopener noreferrer"`。

## 2. Content Security Policy 协作

- 后端/部署在首个预发布阶段仅发送 `Content-Security-Policy-Report-Only`；前端须先在桌面与移动端记录并清理违规项；
- 生产构建只能从同源加载脚本与 API。新增第三方脚本、字体、分析或媒体域名必须先更新 CSP 评审；
- 不添加内联脚本、`eval`、内联事件处理器或以 CSP 例外替代正确的组件实现。

## 3. 发布验收

前端的安全 renderer、恶意 Markdown/link 测试、CSP Report-Only 浏览器证据是上线门槛，但属于独立 FE 任务。BE-060～068 不以 API 的 `body_md` 字段为由绕过这项工作。
