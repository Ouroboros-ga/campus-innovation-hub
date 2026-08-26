#!/usr/bin/env bash
# 安装固定版本的 uv；仅供已授权的 Linux 开发主机使用。
set -euo pipefail

readonly PINNED_UV_VERSION="0.11.24"
readonly UV_BIN="/usr/local/bin/uv"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "必须以 root 安装 uv。" >&2
  exit 77
fi

if [[ -x "$UV_BIN" ]]; then
  installed_version="$($UV_BIN --version | awk '{print $2}')"
  if [[ "$installed_version" == "$PINNED_UV_VERSION" ]]; then
    echo "uv $PINNED_UV_VERSION 已安装。"
    exit 0
  fi
  echo "检测到 uv $installed_version；为避免无意升级或降级，未修改现有二进制。" >&2
  exit 65
fi

installer_dir="$(mktemp -d)"
trap 'rm -rf "$installer_dir"' EXIT

curl --fail --location --proto '=https' --tlsv1.2 \
  "https://astral.sh/uv/$PINNED_UV_VERSION/install.sh" \
  --output "$installer_dir/install-uv.sh"

UV_UNMANAGED_INSTALL="/usr/local/bin" UV_VERSION="$PINNED_UV_VERSION" sh "$installer_dir/install-uv.sh"
test -x "$UV_BIN"
test "$($UV_BIN --version | awk '{print $2}')" = "$PINNED_UV_VERSION"
echo "已安装 uv $PINNED_UV_VERSION。"
