#!/usr/bin/env bash
set -euo pipefail

UI_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CENIT_ROOT="${CENIT_ROOT:-$UI_ROOT/../cenit}"
DELEGATE="$CENIT_ROOT/scripts/e2e/cenit_ui_login.sh"

if [[ ! -x "$DELEGATE" ]]; then
  echo "Missing executable script: $DELEGATE" >&2
  echo "Set CENIT_ROOT to your backend repository path (expected sibling checkout at ../cenit)." >&2
  exit 1
fi

export CENIT_E2E_DRIVER="${CENIT_E2E_DRIVER:-node}"

exec "$DELEGATE"
