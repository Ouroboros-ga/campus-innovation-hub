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
production_env_file="${PRODUCTION_ENV_FILE:-/etc/campus-innovation-hub/production.env}"

normalize_bool() {
  case "${1,,}" in
    1|true|yes|on) echo "true" ;;
    0|false|no|off) echo "false" ;;
    *) return 1 ;;
  esac
}

command -v nginx >/dev/null
command -v systemd-analyze >/dev/null
test -f "$nginx_config"
test -f "$service_file"
test -r "$production_env_file"

registration_value="$(
  sed -n 's/^[[:space:]]*STUDENT_REGISTRATION_AUTO_ACTIVATE[[:space:]]*=[[:space:]]*//p' \
    "$production_env_file" | tail -n 1 | tr -d '[:space:]'
)"
registration_value="$(normalize_bool "$registration_value")" || {
  echo "production env 必须显式设置合法的 STUDENT_REGISTRATION_AUTO_ACTIVATE。" >&2
  exit 78
}

if [[ -n "${EXPECTED_STUDENT_REGISTRATION_AUTO_ACTIVATE:-}" ]]; then
  expected_registration_value="$(normalize_bool "$EXPECTED_STUDENT_REGISTRATION_AUTO_ACTIVATE")" || {
    echo "EXPECTED_STUDENT_REGISTRATION_AUTO_ACTIVATE 必须是布尔值。" >&2
    exit 64
  }
  if [[ "$registration_value" != "$expected_registration_value" ]]; then
    echo "production env 的学生注册策略与本次发布预期不一致。" >&2
    exit 78
  fi
fi

nginx -t -c "$nginx_config"
systemd-analyze verify "$service_file"
echo "预检通过；学生注册自动启用=${registration_value}；未执行 reload、restart、迁移或网络扫描。"
