#!/usr/bin/env bash
NAME=$1; shift
[[ -z $NAME ]] && echo "Please provide a name to add" && exit 1

TABLE_NAME=$(yarn -s output | jq '.'$(yarn -s output | jq 'keys|map(match("^.*UserTable$"))[0].string' -r) -r)

CURRENT_MAX_ID=$(aws dynamodb scan --table-name "$TABLE_NAME" | jq '.Items[].id.N' -r | sort -n | tail -1)
ITEM='{"id": { "N": "'"$(echo "$CURRENT_MAX_ID + 1"|bc)"'"}, "enabled": {"BOOL": true}, "name": {"S": "'$NAME'"}}'
aws dynamodb put-item --table-name "$TABLE_NAME" --item "$ITEM"

