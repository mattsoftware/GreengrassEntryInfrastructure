#!/usr/bin/env bash -e

HERE=`pwd`
PACKED=$(npm pack)
TD=$(mktemp -d)
ZIPFILE="$HERE/$(npx -c 'echo "$npm_package_name"')-latest.zip"

pushd "$TD"

tar -zxf "$HERE/$PACKED" --strip-components 1
rm -f "$HERE/$PACKED"
rm -f "$ZIPFILE"
zip -r "$ZIPFILE" *

popd
rm -fr "$TD"

