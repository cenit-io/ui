#!/usr/bin/env bash
set -euo pipefail

UI_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CENIT_ROOT="${CENIT_ROOT:-$UI_ROOT/../cenit}"
DELEGATE="$CENIT_ROOT/scripts/e2e/cenit_ui_contact_flow.sh"

if [[ ! -x "$DELEGATE" ]]; then
  echo "Missing executable script: $DELEGATE" >&2
  echo "Set CENIT_ROOT to your backend repository path (expected sibling checkout at ../cenit)." >&2
  exit 1
fi

# Keep the same stable local contract in both repositories.
export CENIT_E2E_DATATYPE_NAMESPACE="${CENIT_E2E_DATATYPE_NAMESPACE:-E2E_CONTACT_FLOW}"
export CENIT_E2E_DATATYPE_NAME="${CENIT_E2E_DATATYPE_NAME:-Contact}"
export CENIT_E2E_RECORD_NAME="${CENIT_E2E_RECORD_NAME:-John Contact E2E}"
export CENIT_E2E_RECORD_COLLECTION="${CENIT_E2E_RECORD_COLLECTION:-Contacts}"
export CENIT_E2E_CLEANUP="${CENIT_E2E_CLEANUP:-1}"
export CENIT_E2E_DRIVER="${CENIT_E2E_DRIVER:-node}"

exec "$DELEGATE"
