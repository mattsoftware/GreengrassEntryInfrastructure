#!/usr/bin/env bash

NAME=$1; shift
[[ -z $NAME ]] && echo "Please provide a name to list the card of" && exit 1

TABLE_NAME=$(yarn -s output | jq '.'$(yarn -s output | jq 'keys|map(match("^.*UserTable$"))[0].string' -r) -r)
MATCHES=$(aws dynamodb scan --table-name "$TABLE_NAME" --filter-expression "#name = :username" --expression-attribute-values '{":username": {"S": "'"$NAME"'"}}' --expression-attribute-names '{"#name": "name"}')

echo "$MATCHES" | jq '.Items[].entry_cards.SS|.[]' -r

