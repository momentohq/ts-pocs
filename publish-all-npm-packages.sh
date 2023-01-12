#!/usr/bin/env bash

set -e
set -x

export PACKAGES="aws-cache-helpers"
for package in $PACKAGES
do
  echo "Publishing packages with version $VERSION"
  pushd $package
    mv package.json package.json.ORIG
    cat package.json.ORIG|jq ". += {\"version\": \"$VERSION\"}" > package.json
    npm publish
  popd
done
