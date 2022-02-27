// @format
const greengrass = require('@aws-cdk/aws-greengrass');
const thing = require('./thing');

const region = process.env.CDK_DEFAULT_REGION;
const accountId = process.env.CDK_DEFAULT_ACCOUNT;

module.exports = (scope, id, {prefix, csr}) => {
    const coreThing = thing(scope, 'Core', {
        csr,
        prefix: `${prefix}_Core`,
    });

    // Create the core
    const coreDefinition = new greengrass.CfnCoreDefinition(scope, 'GGCoreDefinition', {
        name: `${prefix}`,
    });

    const core = new greengrass.CfnCoreDefinitionVersion(scope, 'GGCore', {
        coreDefinitionId: coreDefinition.attrId,
        cores: [
            {
                certificateArn: `arn:aws:iot:${region}:${accountId}:cert/${coreThing.thing.certificateRef}`,
                id: 'Test',
                thingArn: `arn:aws:iot:${region}:${accountId}:thing/${coreThing.thing.thingName}`,
                //syncShadow: '',
            },
        ],
    });

    return core;
};
