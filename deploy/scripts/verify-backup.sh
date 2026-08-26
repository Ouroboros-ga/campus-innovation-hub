#!/usr/bin/env bash
# 只验证备份结构和 SHA-256，不连接或修改数据库。
set -euo pipefail

backup_file=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --backup) backup_file="$2"; shift 2 ;;
    *) echo "用法: $0 --backup <backup.dump>" >&2; exit 64 ;;
  esac
done

[[ -f "$backup_file" && -f "$backup_file.sha256" ]] || { echo "缺少 dump 或 SHA-256 文件。" >&2; exit 66; }
(cd "$(dirname "$backup_file")" && sha256sum --check "$(basename "$backup_file").sha256")
pg_restore --list "$backup_file" >/dev/null
echo "备份 checksum 与 custom-format 目录校验通过；尚未执行恢复。"
