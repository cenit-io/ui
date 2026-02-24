#!/usr/bin/env bash
set -euo pipefail

UI_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CENIT_ROOT="${CENIT_ROOT:-$UI_ROOT/../cenit}"
DELEGATE="$CENIT_ROOT/scripts/e2e/cenit_ui_integration_journey.sh"
CENIT_UI_URL="${CENIT_UI_URL:-http://localhost:3002}"
CENIT_SERVER_URL="${CENIT_SERVER_URL:-http://localhost:3000}"

if [[ ! -x "$DELEGATE" ]]; then
  echo "Missing executable script: $DELEGATE" >&2
  echo "Set CENIT_ROOT to your backend repository path (expected sibling checkout at ../cenit)." >&2
  exit 1
fi

# Keep the same stable local contract in both repositories.
export CENIT_E2E_JOURNEY_NAMESPACE="${CENIT_E2E_JOURNEY_NAMESPACE:-E2E_INTEGRATION}"
export CENIT_E2E_JOURNEY_DATATYPE_NAME="${CENIT_E2E_JOURNEY_DATATYPE_NAME:-Lead}"
export CENIT_E2E_JOURNEY_RECORD_NAME="${CENIT_E2E_JOURNEY_RECORD_NAME:-John Lead E2E}"
export CENIT_E2E_CLEANUP="${CENIT_E2E_CLEANUP:-1}"
export CENIT_E2E_DRIVER="${CENIT_E2E_DRIVER:-node}"
export CENIT_E2E_AUTOSTART="${CENIT_E2E_AUTOSTART:-0}"
export CENIT_E2E_RESET_STACK="${CENIT_E2E_RESET_STACK:-1}"
export CENIT_E2E_BUILD_STACK="${CENIT_E2E_BUILD_STACK:-0}"
export CENIT_E2E_STEP1_ONLY="${CENIT_E2E_STEP1_ONLY:-0}"
export CENIT_UI_URL
export CENIT_SERVER_URL

echo "Integration Journey wrapper (UI):"
echo "  CENIT_UI_URL=$CENIT_UI_URL"
echo "  CENIT_SERVER_URL=$CENIT_SERVER_URL"
echo "  CENIT_E2E_AUTOSTART=$CENIT_E2E_AUTOSTART"
echo "  CENIT_E2E_STEP1_ONLY=$CENIT_E2E_STEP1_ONLY"

if ! command -v curl >/dev/null 2>&1; then
  echo "Missing required command: curl" >&2
  exit 1
fi

ui_check_url="$CENIT_UI_URL"
if ! curl -fsS --max-time 5 -o /dev/null "$ui_check_url"; then
  if [[ "$CENIT_UI_URL" == *"localhost"* ]]; then
    ui_check_url="${CENIT_UI_URL/localhost/127.0.0.1}"
  fi
fi

if ! curl -fsS --max-time 5 -o /dev/null "$ui_check_url"; then
  echo "UI endpoint is unreachable: $CENIT_UI_URL (fallback check: $ui_check_url)" >&2
  echo "Start the local UI dev server (expected on port 3002) and retry." >&2
  exit 1
fi

exec "$DELEGATE"
