#!/usr/bin/env bash
# 只校验已渲染的配置；本脚本不会 reload/restart Nginx 或 systemd。
set -euo pipefail

if [[ "${1:-}" != "--check-only" ]]; then
  echo "仅支持 --check-only；部署、重启和远程写入需要单独授权。" >&2
  exit 64
fi

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "预检只可在已授权的 Linux 预发布主机执行。" >&2
  exit 69
fi

if [[ "${DEPLOY_PREFLIGHT_AUTHORIZED:-0}" != "1" ]]; then
  echo "请由已授权运维会话设置 DEPLOY_PREFLIGHT_AUTHORIZED=1 后再执行。" >&2
  exit 77
fi

nginx_config="${NGINX_CONFIG:-/etc/nginx/conf.d/campus-innovation-hub.conf}"
service_file="${SYSTEMD_SERVICE_FILE:-/etc/systemd/system/campus-innovation-hub.service}"

command -v nginx >/dev/null
command -v systemd-analyze >/dev/null
test -f "$nginx_config"
test -f "$service_file"

nginx -t -c "$nginx_config"
systemd-analyze verify "$service_file"
echo "预检通过；未执行 reload、restart、迁移或网络扫描。"
