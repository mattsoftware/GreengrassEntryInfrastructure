// @format
const entryGroup = require('./group');
const entryCore = require('./core');

module.exports = (scope, id, {prefix, coreCSR, subscriptions, functions, devices}) => {
    const core = entryCore(scope, 'Core', {
        prefix,
        csr: coreCSR,
    });

    const group = entryGroup(scope, 'Group', {
        prefix,
        core,
        subscriptions,
        functions,
        devices,
    });

    return group;
};
