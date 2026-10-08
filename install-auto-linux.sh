#!/usr/bin/env bash
# Opt-in persistent maintenance. One-time sudo installs root-owned systemd service.
set -euo pipefail
HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
case "${1:-install}" in
  install)
    shift || true
    NODE_BIN="$(dirname "$(command -v npx)")"
    exec sudo /usr/bin/python3 "$HERE/auto_maintain.py" install --node-bin "$NODE_BIN" "$@" ;;
  status)
    exec /usr/bin/python3 "$HERE/auto_maintain.py" status ;;
  logs)
    exec journalctl -u zcode-model-puller-auto.service -n 100 --no-pager ;;
  restore)
    exec sudo /usr/bin/python3 /usr/local/lib/zcode-model-puller-auto/auto_maintain.py restore ;;
  remove)
    exec sudo /usr/bin/python3 "$HERE/auto_maintain.py" remove ;;
  *)
    echo 'Usage: bash install-auto-linux.sh [install|status|logs|restore|remove] [--zcode-path /opt/ZCode]' >&2
    exit 2 ;;
esac