#!/usr/bin/env bash
# 一键重放「临时公网 HTTP 层」（无域名 / 无 TLS）。在含仓库的机器上运行。
# 作用：把临时 settings + 临时 systemd unit + 临时公网 Nginx 站点装配到开发 release 上，
# 并保持 dev 后端(8000) 不受影响。
#
# 用法（在仓库根目录，且本机可 SSH 到服务器）:
#   ./deploy/scripts/provision-temporary-public.sh \
#       --admin-ip 60.187.70.80 [--public-ip 120.26.32.241] [--server root@120.26.32.241]
#
# 依赖：仓库含 backend/config/settings/temporary.py；服务器已用 provision-development.sh
#       建立 dev 运行面（/opt/campus-innovation-hub-dev/current -> releases/<sha>）。

set -Eeuo pipefail

ADMIN_IP=""
PUBLIC_IP="120.26.32.241"
SERVER="root@120.26.32.241"

usage() { echo "用法: $0 --admin-ip <IP> [--public-ip <IP>] [--server user@host]" >&2; exit 64; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --admin-ip) ADMIN_IP="${2:?}"; shift 2 ;;
    --public-ip) PUBLIC_IP="${2:?}"; shift 2 ;;
    --server) SERVER="${2:?}"; shift 2 ;;
    *) usage ;;
  esac
done
[[ -n "$ADMIN_IP" ]] || usage

REPO=$(cd "$(dirname "$0")/../.." && pwd)
for f in \
  backend/config/settings/temporary.py \
  deploy/nginx/campus-innovation-hub-temp.conf \
  deploy/nginx/campus-admin-allow.conf \
  deploy/systemd/campus-innovation-hub-temp.service; do
  [[ -f "$REPO/$f" ]] || { echo "仓库缺少 $f" >&2; exit 1; }
done

echo "=== stage artifacts -> $SERVER:/tmp ==="
scp -o BatchMode=yes -o StrictHostKeyChecking=accept-new \
  "$REPO/backend/config/settings/temporary.py" \
  "$REPO/deploy/nginx/campus-innovation-hub-temp.conf" \
  "$REPO/deploy/nginx/campus-admin-allow.conf" \
  "$REPO/deploy/systemd/campus-innovation-hub-temp.service" \
  "$SERVER:/tmp/"

echo "=== remote provision (public=$PUBLIC_IP admin=$ADMIN_IP) ==="
ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new "$SERVER" "ADMIN_IP='$ADMIN_IP' PUBLIC_IP='$PUBLIC_IP' bash -s" <<'REMOTE'
set -Eeuo pipefail
[[ "$(id -u)" -eq 0 ]] || { echo "远程必须以 root 运行"; exit 1; }
CURRENT=/opt/campus-innovation-hub-dev/current
BACKEND="$CURRENT/backend"
ENV_DIR=/etc/campus-innovation-hub
TEMP_ENV="$ENV_DIR/temporary.env"
STATIC_ROOT=/var/lib/campus-innovation-hub-dev/static

echo "--- 1) temporary.py ---"
install -o campus-hub -g campus-hub -m 0644 /tmp/temporary.py "$BACKEND/config/settings/temporary.py"

echo "--- 2) temporary.env (复用 dev secrets) ---"
set -a; source "$ENV_DIR/development.env"; set +a
umask 077
cat > "$TEMP_ENV" <<EOF
DJANGO_SETTINGS_MODULE=config.settings.temporary
DJANGO_SECRET_KEY=$DJANGO_SECRET_KEY
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=$PUBLIC_IP,localhost,127.0.0.1
DJANGO_CSRF_TRUSTED_ORIGINS=http://$PUBLIC_IP,http://localhost,http://127.0.0.1
DATABASE_URL=$DATABASE_URL
AUTH_THROTTLE_HMAC_KEY=$AUTH_THROTTLE_HMAC_KEY
MEDIA_STORAGE_BACKEND=local
MEDIA_URL=/media/
MEDIA_ROOT=$MEDIA_ROOT
DJANGO_STATIC_ROOT=$STATIC_ROOT
EOF
chown root:campus-hub "$TEMP_ENV"; chmod 0640 "$TEMP_ENV"

echo "--- 3) collectstatic ---"
mkdir -p "$STATIC_ROOT"; chown campus-hub:campus-hub "$STATIC_ROOT"; chmod 0750 "$STATIC_ROOT"
set -a; source "$TEMP_ENV"; set +a
runuser -u campus-hub --preserve-environment -- env HOME=/var/lib/campus-hub bash -c "cd '$BACKEND' && '$BACKEND/.venv/bin/python' manage.py collectstatic --noinput"

echo "--- 4) temp systemd unit ---"
install -o root -g root -m 0644 /tmp/campus-innovation-hub-temp.service /etc/systemd/system/campus-innovation-hub-temp.service
systemctl daemon-reload
systemctl enable campus-innovation-hub-temp >/dev/null 2>&1 || true
systemctl restart campus-innovation-hub-temp
systemctl is-active --quiet campus-innovation-hub-temp || { echo "temp unit 未激活"; journalctl -u campus-innovation-hub-temp -n 40; exit 1; }

echo "--- 5) nginx snippets (proxy-headers + admin allow) ---"
if [ ! -f /etc/nginx/snippets/campus-proxy-headers.conf ]; then
  cat > /etc/nginx/snippets/campus-proxy-headers.conf <<'PROXY'
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_http_version 1.1;
proxy_redirect off;
PROXY
fi
sed "s/__ADMIN_IP__/$ADMIN_IP/g" /tmp/campus-admin-allow.conf > /etc/nginx/snippets/campus-admin-allow.conf

echo "--- 6) render + install temp nginx site ---"
sed "s/__PUBLIC_IP__/$PUBLIC_IP/g" /tmp/campus-innovation-hub-temp.conf > /etc/nginx/sites-available/campus-innovation-hub-temp.conf
ln -sf /etc/nginx/sites-available/campus-innovation-hub-temp.conf /etc/nginx/sites-enabled/campus-innovation-hub-temp.conf

echo "--- 7) nginx -t + reload ---"
nginx -t
systemctl reload nginx || true

echo "--- 8) health ---"
echo "temp 8001: $(curl -fsS http://127.0.0.1:8001/api/health || echo FAIL)"
echo "dev  8000: $(curl -fsS http://127.0.0.1:8000/api/health || echo FAIL)"
echo "remote done"
REMOTE

echo "DONE: 临时公网层已重放 (public=$PUBLIC_IP admin=$ADMIN_IP)"
