#!/usr/bin/env node
// @format
const cdk = require('@aws-cdk/core');
const {EntryStackStack} = require('../lib/entry_stack-stack');

const app = new cdk.App();
new EntryStackStack(app, 'EntryStackStack');
