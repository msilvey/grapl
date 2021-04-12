#!/usr/bin/env bash

echo "--- Detecting environment"
env

echo "--- Docker Versions"
docker --version
docker-compose --version

echo "--- Confirming buildx"
ls -alh /var/lib/buildkite-agent/.docker/cli-plugins

echo "--- Try to invoke buildx"
docker buildx --help

echo "--- Try to invoke buildx with empty environment"
env -i docker buildx --help

echo "--- Try to invoke buildx bake with empty environment"
env -i docker buildx bake --help

echo "--- DOCKER CONFIG!"
ls -alh "${DOCKER_CONFIG}"
for f in $(ls "${DOCKER_CONFIG}")
do
    echo "--- $f"
    cat $f
done

echo "--- Build containers directly"
env -i docker buildx bake --file=test/docker-compose.typecheck-tests.yml

echo "--- Build containers via make"
make build-test-typecheck

echo "--- Build without DOCKER_CONFIG"
env --unset=DOCKER_CONFIG make build-test-typecheck
