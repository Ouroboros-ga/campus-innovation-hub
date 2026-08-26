#!/usr/bin/env bash
# 创建仅用于 SSH 隧道联调的隔离开发运行面；不管理 Nginx、TLS 或防火墙。
set -Eeuo pipefail

readonly APP_USER="campus-hub"
readonly APP_GROUP="campus-hub"
readonly APP_ROOT="/opt/campus-innovation-hub-dev"
readonly RELEASES_DIR="$APP_ROOT/releases"
readonly CURRENT_LINK="$APP_ROOT/current"
readonly ENV_DIR="/etc/campus-innovation-hub"
readonly DEVELOPMENT_ENV="$ENV_DIR/development.env"
readonly POSTGRES_ENV="$ENV_DIR/postgres.env"
readonly DATA_DIR="/var/lib/campus-innovation-hub-dev"
readonly DATABASE_CONTAINER="campus-hub-dev-db"
readonly DATABASE_VOLUME="campus-hub-dev-postgres"
readonly DATABASE_IMAGE="postgres:16.2-alpine"
readonly DATABASE_NAME="campus_innovation_hub_dev"
readonly DATABASE_USER="campus_hub"
readonly BOOTSTRAP_DATABASE_USER="campus_hub_bootstrap"
readonly UV_BIN="/usr/local/bin/uv"
readonly UNIT_NAME="campus-innovation-hub-dev.service"

usage() {
  echo "用法: $0 --release-dir /opt/campus-innovation-hub-dev/releases/<40位Git SHA>" >&2
  exit 64
}

fail() {
  echo "开发环境未创建：$1" >&2
  exit 1
}

release_dir=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --release-dir)
      [[ $# -ge 2 ]] || usage
      release_dir="$2"
      shift 2
      ;;
    *)
      usage
      ;;
  esac
done

[[ "$(id -u)" -eq 0 ]] || fail "必须以 root 运行。"
[[ -n "$release_dir" ]] || usage
[[ -x "$UV_BIN" ]] || fail "缺少 $UV_BIN；先执行 deploy/scripts/install-uv.sh。"
command -v docker >/dev/null || fail "缺少 Docker。"
command -v openssl >/dev/null || fail "缺少 openssl。"
command -v curl >/dev/null || fail "缺少 curl。"

release_dir="$(readlink -f "$release_dir")"
case "$release_dir" in
  "$RELEASES_DIR"/*) ;;
  *) fail "release 必须位于 $RELEASES_DIR。" ;;
esac
[[ -f "$release_dir/backend/pyproject.toml" && -f "$release_dir/backend/uv.lock" ]] || fail "release 缺少 backend 依赖真源。"
[[ -f "$release_dir/deploy/systemd/$UNIT_NAME" ]] || fail "release 缺少开发 systemd unit。"
[[ -z "$(git -C "$release_dir" status --porcelain)" ]] || fail "release 工作树不干净。"
release_sha="$(git -C "$release_dir" rev-parse --verify HEAD)"
[[ "$release_sha" =~ ^[0-9a-f]{40}$ ]] || fail "release 不是有效 Git commit。"

if ! getent passwd "$APP_USER" >/dev/null; then
  useradd --system --create-home --home-dir "/var/lib/$APP_USER" --shell /usr/sbin/nologin "$APP_USER"
fi

install -d -o root -g root -m 0755 "$APP_ROOT" "$RELEASES_DIR"
install -d -o root -g root -m 0750 "$ENV_DIR"
install -d -o "$APP_USER" -g "$APP_GROUP" -m 0750 "$DATA_DIR" "$DATA_DIR/media" "/var/lib/$APP_USER/uv-cache"

if [[ ! -e "$DEVELOPMENT_ENV" && ! -e "$POSTGRES_ENV" ]]; then
  bootstrap_password="$(openssl rand -hex 24)"
  application_password="$(openssl rand -hex 24)"
  django_secret="$(openssl rand -hex 32)"
  throttle_hmac_key="$(openssl rand -hex 32)"

  umask 077
  printf '%s\n' \
    "POSTGRES_USER=$BOOTSTRAP_DATABASE_USER" \
    "POSTGRES_PASSWORD=$bootstrap_password" \
    "POSTGRES_DB=postgres" > "$POSTGRES_ENV"
  chown root:root "$POSTGRES_ENV"
  chmod 0600 "$POSTGRES_ENV"

  printf '%s\n' \
    'DJANGO_SETTINGS_MODULE=config.settings.development' \
    "DJANGO_SECRET_KEY=$django_secret" \
    'DJANGO_DEBUG=true' \
    'DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1' \
    'DJANGO_CSRF_TRUSTED_ORIGINS=http://localhost:5173' \
    "DATABASE_URL=postgresql://$DATABASE_USER:$application_password@127.0.0.1:5432/$DATABASE_NAME" \
    "AUTH_THROTTLE_HMAC_KEY=$throttle_hmac_key" \
    'MEDIA_STORAGE_BACKEND=local' \
    'MEDIA_URL=/media/' \
    "MEDIA_ROOT=$DATA_DIR/media" \
    "UV_CACHE_DIR=/var/lib/$APP_USER/uv-cache" \
    'UV_HTTP_TIMEOUT=120' \
    'UV_LINK_MODE=copy' > "$DEVELOPMENT_ENV"
  chown root:"$APP_GROUP" "$DEVELOPMENT_ENV"
  chmod 0640 "$DEVELOPMENT_ENV"
elif [[ ! -f "$DEVELOPMENT_ENV" || ! -f "$POSTGRES_ENV" ]]; then
  fail "开发环境文件不完整；为避免覆盖密钥已停止。"
fi

if ! grep -qx 'UV_HTTP_TIMEOUT=120' "$DEVELOPMENT_ENV"; then
  printf '%s\n' 'UV_HTTP_TIMEOUT=120' >> "$DEVELOPMENT_ENV"
  chown root:"$APP_GROUP" "$DEVELOPMENT_ENV"
  chmod 0640 "$DEVELOPMENT_ENV"
fi

if ! docker container inspect "$DATABASE_CONTAINER" >/dev/null 2>&1; then
  docker volume create "$DATABASE_VOLUME" >/dev/null
  docker run --detach --name "$DATABASE_CONTAINER" --restart unless-stopped \
    --env-file "$POSTGRES_ENV" \
    --publish 127.0.0.1:5432:5432 \
    --volume "$DATABASE_VOLUME:/var/lib/postgresql/data" \
    "$DATABASE_IMAGE" >/dev/null
elif [[ "$(docker inspect --format '{{.State.Running}}' "$DATABASE_CONTAINER")" != "true" ]]; then
  docker start "$DATABASE_CONTAINER" >/dev/null
fi

if ! docker port "$DATABASE_CONTAINER" 5432/tcp | grep -qx '127.0.0.1:5432'; then
  fail "数据库容器端口不是唯一的 127.0.0.1:5432；未重建容器。"
fi

for _ in $(seq 1 30); do
  if docker exec "$DATABASE_CONTAINER" pg_isready --quiet --username "$BOOTSTRAP_DATABASE_USER" --dbname postgres; then
    break
  fi
  sleep 1
done
docker exec "$DATABASE_CONTAINER" pg_isready --quiet --username "$BOOTSTRAP_DATABASE_USER" --dbname postgres \
  || fail "PostgreSQL 未在 30 秒内就绪。"

set -a
# shellcheck source=/dev/null
source "$DEVELOPMENT_ENV"
set +a
application_password="${DATABASE_URL#*://$DATABASE_USER:}"
application_password="${application_password%%@*}"

if ! docker exec "$DATABASE_CONTAINER" psql --username "$BOOTSTRAP_DATABASE_USER" --dbname postgres --tuples-only --no-align \
  --command "SELECT 1 FROM pg_roles WHERE rolname = '$DATABASE_USER'" | grep -qx '1'; then
  printf "CREATE ROLE %s LOGIN PASSWORD '%s';\n" "$DATABASE_USER" "$application_password" \
    | docker exec --interactive "$DATABASE_CONTAINER" psql --set ON_ERROR_STOP=1 --username "$BOOTSTRAP_DATABASE_USER" --dbname postgres
fi
if ! docker exec "$DATABASE_CONTAINER" psql --username "$BOOTSTRAP_DATABASE_USER" --dbname postgres --tuples-only --no-align \
  --command "SELECT 1 FROM pg_database WHERE datname = '$DATABASE_NAME'" | grep -qx '1'; then
  printf 'CREATE DATABASE %s OWNER %s;\n' "$DATABASE_NAME" "$DATABASE_USER" \
    | docker exec --interactive "$DATABASE_CONTAINER" psql --set ON_ERROR_STOP=1 --username "$BOOTSTRAP_DATABASE_USER" --dbname postgres
fi

chown -R "$APP_USER:$APP_GROUP" "$release_dir"
run_as_app() {
  runuser -u "$APP_USER" --preserve-environment -- env \
    "HOME=/var/lib/$APP_USER" \
    "XDG_CACHE_HOME=/var/lib/$APP_USER/.cache" \
    "XDG_DATA_HOME=/var/lib/$APP_USER/.local/share" \
    "$@"
}
run_as_app "$UV_BIN" sync --frozen --group dev --directory "$release_dir/backend"
run_as_app "$UV_BIN" run --frozen --directory "$release_dir/backend" python manage.py check
run_as_app "$UV_BIN" run --frozen --directory "$release_dir/backend" python manage.py migrate --noinput

if [[ -e "$CURRENT_LINK" && ! -L "$CURRENT_LINK" ]]; then
  fail "$CURRENT_LINK 已存在但不是软链接。"
fi
temporary_link="$APP_ROOT/.current-$release_sha"
ln -s "$release_dir" "$temporary_link"
mv -Tf "$temporary_link" "$CURRENT_LINK"

install -o root -g root -m 0644 "$release_dir/deploy/systemd/$UNIT_NAME" "/etc/systemd/system/$UNIT_NAME"
systemctl daemon-reload
systemctl enable "$UNIT_NAME"
systemctl restart "$UNIT_NAME"
systemctl is-active --quiet "$UNIT_NAME" || fail "Gunicorn service 未进入 active 状态。"
for _ in $(seq 1 15); do
  if curl --fail --silent --show-error http://127.0.0.1:8000/api/health >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
curl --fail --silent --show-error http://127.0.0.1:8000/api/health >/dev/null
curl --fail --silent --show-error http://127.0.0.1:8000/api/ready >/dev/null

non_loopback_listeners="$(ss -ltnH | awk '$4 ~ /:(8000|5432)$/ && $4 !~ /^127\\.0\\.0\\.1:/ {print $4}')"
[[ -z "$non_loopback_listeners" ]] || fail "检测到非 loopback 开发监听：$non_loopback_listeners"

echo "开发运行面已启动：commit=$release_sha，Gunicorn 与 PostgreSQL 仅监听 loopback。"
