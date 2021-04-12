#!/usr/bin/env bash

set -euo pipefail

capture_logs() {
    python3 etc/ci_scripts/dump_artifacts.py --compose-project "grapl-e2e_tests"
}

trap capture_logs EXIT

export GRAPL_LOG_LEVEL="DEBUG"
export DUMP_ARTIFACTS="True"

make test-e2e
