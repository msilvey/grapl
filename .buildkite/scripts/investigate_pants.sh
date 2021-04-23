#!/usr/bin/env bash

echo "--- Detecting environment"
env

./pants --no-process-execution-local-cleanup lint ::

echo "--- failing thing"
ls -alh .cache
cat .cache/pex_root/venvs/d8105fd40948579fedc63bb8ddd363d251b7db7a/5dc7bde7966ce85a9f3820e78694dc0e8d63768d/pex
cat ~/.cache/pex_root/venvs/d8105fd40948579fedc63bb8ddd363d251b7db7a/5dc7bde7966ce85a9f3820e78694dc0e8d63768d/pex
echo "--- done"
