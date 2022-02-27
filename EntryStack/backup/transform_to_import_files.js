#!/usr/bin/env node
// @format

const msw_helper = require('msw_nodejs_helper');
const fs = require('fs');
const exported = require('./export.json');
const items = exported.Items;

const getTableName = output => {
    const key = Object.keys(output).reduce((p, v) => {
        if (v.endsWith('UserTable')) {
            return v;
        }
        return p;
    }, null);

    if (key === null) {
        throw new Error('User table key not found');
    }
    return output[key];
};
(async () => {
    const outputRaw = await msw_helper.run('yarn', ['-s', 'output']);
    const output = JSON.parse(outputRaw.stdout);

    const tableName = getTableName(output);

    const chunk = 25;
    for (let i = 0, j = items.length; i < j; i += chunk) {
        const chunked = items.slice(i, i + chunk);
        const toImport = {};
        toImport[tableName] = chunked.map(i => ({
            PutRequest: {
                Item: i,
            },
        }));
        fs.writeFileSync(`./backup/for_import-${i}.json`, JSON.stringify(toImport));
    }
})();
