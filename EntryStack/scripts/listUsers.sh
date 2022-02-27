#!/usr/bin/env bash

TABLE_NAME=$(yarn -s output | jq '.'$(yarn -s output | jq 'keys|map(match("^.*UserTable$"))[0].string' -r) -r)
MATCHES=$(aws dynamodb scan --table-name "$TABLE_NAME")

echo "$MATCHES" | jq '.Items[].name.S' -r | sort

