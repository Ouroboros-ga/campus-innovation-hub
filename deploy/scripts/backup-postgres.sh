#!/usr/bin/env bash
# 创建 PostgreSQL custom-format 备份与可独立校验的 SHA-256 manifest。
set -euo pipefail
umask 077

config_file=""
output_dir=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --config) config_file="$2"; shift 2 ;;
    --output-dir) output_dir="$2"; shift 2 ;;
    *) echo "用法: $0 --config <pg-service.env> --output-dir <directory>" >&2; exit 64 ;;
  esac
done

[[ -n "$config_file" && -n "$output_dir" && -f "$config_file" ]] || { echo "缺少受控配置或输出目录。" >&2; exit 64; }
# 配置只能含 PGSERVICE；service 凭据由权限受控的 pg_service.conf/pgpassfile 持有。
set -a
source "$config_file"
set +a
: "${PGSERVICE:?配置必须提供 PGSERVICE}"

mkdir -p "$output_dir"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
dump_file="$output_dir/campus-${timestamp}.dump"
manifest_file="$output_dir/campus-${timestamp}.manifest.json"
checksum_file="$dump_file.sha256"

pg_dump --format=custom --file="$dump_file" --dbname="service=$PGSERVICE"
(cd "$output_dir" && sha256sum "$(basename "$dump_file")") > "$checksum_file"
checksum="$(cut -d ' ' -f 1 "$checksum_file")"
printf '{"sha256":"%s","created_at":"%s","source_schema":"public","dump_file":"%s"}\n' \
  "$checksum" "$timestamp" "$(basename "$dump_file")" > "$manifest_file"
echo "备份已写入 $dump_file；请将 dump、sha256 与 manifest 一同复制到批准的加密备份位置。"
