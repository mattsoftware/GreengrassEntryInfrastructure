//@format

const cdk = require('@aws-cdk/core');
const softThing = require('./softwareThing');

module.exports = (scope, id, {prefix, iotEndpoint, csr}) => {
    const monitorThing = softThing(scope, 'MonitorThing', {
        csr,
        prefix: `${prefix}-Monitor`,
        greengrassShadowSync: false,
    });

    return {
        monitorThing,
    };
};
