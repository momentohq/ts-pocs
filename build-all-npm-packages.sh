#!/usr/bin/env bash

set -e
set -x
set -o errexit

export PACKAGES="aws-cache-helpers"
for package in $PACKAGES
do
  echo "Looping over package: $package"
  pushd $package
    npm ci && npm run build && npm run lint && npm run test&
    pids="$pids $!"
  popd
done

for pid in $pids; do
    wait $pid
done