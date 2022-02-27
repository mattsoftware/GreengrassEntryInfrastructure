#!/usr/bin/env bash

ACCOUNT_ID=$(aws sts get-caller-identity | jq '.Account' -r)
REGION=$(cat config.json | jq '.["'$ACCOUNT_ID'"].region' -r)
LOG_GROUP_NAME=$(aws logs describe-log-groups --log-group-name-prefix "/aws/greengrass/Lambda/$REGION/$ACCOUNT_ID/EntryStackStack-DoorAccess" | jq '.logGroups[].logGroupName' -r)

aws logs tail "$LOG_GROUP_NAME" --follow --since 1w |grep "open"

