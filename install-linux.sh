#!/usr/bin/env bash
# ZCode Model Puller — Ubuntu/Linux one-command installer.
set -euo pipefail
HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "$HERE/linux_installer.py" "$@"