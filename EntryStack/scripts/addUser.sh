#!/usr/bin/env bash
NAME=$1; shift
[[ -z $NAME ]] && echo "Please provide a name to add" && exit 1

TABLE_NAME=$(yarn -s output | jq '.'$(yarn -s output | jq 'keys|map(match("^.*UserTable$"))[0].string' -r) -r)
ITEM='{"id": { "N": "'"$(yarn -s listUsers 2>/dev/null| tail -1 | echo "$(awk '{print $1}') + 1"|bc)"'"}, "enabled": {"BOOL": true}, "name": {"S": "'$NAME'"}}'
aws dynamodb put-item --table-name "$TABLE_NAME" --item "$ITEM"

