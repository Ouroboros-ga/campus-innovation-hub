#!/usr/bin/env bash
# 只允许恢复到显式命名的隔离测试库，避免误覆盖任何正式数据库。
set -euo pipefail

config_file=""
target_database=""
backup_file=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --config) config_file="$2"; shift 2 ;;
    --target-database) target_database="$2"; shift 2 ;;
    --backup) backup_file="$2"; shift 2 ;;
    *) echo "用法: $0 --config <pg-service.env> --target-database <name_restore_test> --backup <backup.dump>" >&2; exit 64 ;;
  esac
done

[[ -f "$config_file" && -f "$backup_file" ]] || { echo "缺少受控配置或备份文件。" >&2; exit 64; }
[[ "$target_database" == *_restore_test ]] || { echo "恢复目标必须以 _restore_test 结尾。" >&2; exit 65; }
[[ "$target_database" =~ ^[A-Za-z0-9_]+_restore_test$ ]] || { echo "恢复目标只能包含字母、数字和下划线。" >&2; exit 65; }
"$(dirname "$0")/verify-backup.sh" --backup "$backup_file"

set -a
source "$config_file"
set +a
: "${PGSERVICE:?配置必须提供 PGSERVICE}"
pg_restore --clean --if-exists --no-owner --dbname="service=$PGSERVICE dbname=$target_database" "$backup_file"
echo "恢复已写入隔离数据库 $target_database；请执行独立应用验证后销毁该测试库。"
