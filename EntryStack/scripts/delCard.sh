#!/usr/bin/env bash
NAME=$1; shift
[[ -z $NAME ]] && echo "Please provide a name to list the card of" && exit 1
CARD=$1; shift
[[ -z $CARD ]] && echo "Please provide the card number to delete" && exit 1

TABLE_NAME=$(yarn -s output | jq '.'$(yarn -s output | jq 'keys|map(match("^.*UserTable$"))[0].string' -r) -r)
MATCHES=$(aws dynamodb scan --table-name "$TABLE_NAME" --filter-expression "#name = :username" --expression-attribute-values '{":username": {"S": "'"$NAME"'"}}' --expression-attribute-names '{"#name": "name"}')

COUNT=$(echo "$MATCHES" | jq '.Count' -r)
[[ $COUNT -ne 1 ]] && echo "Could not find record" && exit 1

ID=$(echo "$MATCHES" | jq '.Items[0].id.N' -r)
aws dynamodb update-item --table-name "$TABLE_NAME" --key '{"id": {"N": "'"$ID"'"}}' --update-expression 'DELETE entry_cards :val' --expression-attribute-values '{":val": {"SS": ["'"$CARD"'"]}}'

