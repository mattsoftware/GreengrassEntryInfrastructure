#!/usr/bin/env bash
pushd backup
for x in $(ls for_import*.json); do 
    aws dynamodb batch-write-item --request-items file://$x
done
popd


