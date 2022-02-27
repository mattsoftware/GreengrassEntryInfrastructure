//@format

const greengrass = require('@aws-cdk/aws-greengrass');
const iam = require('@aws-cdk/aws-iam');

module.exports = (scope, id, {prefix, core, subscriptions, functions, devices}) => {
    const ggr = new iam.Role(scope, `GGServiceRole`, {
        assumedBy: new iam.ServicePrincipal('greengrass.amazonaws.com'),
        path: '/service-role/',
        managedPolicies: [
            {managedPolicyArn: 'arn:aws:iam::aws:policy/AWSIoTDataAccess'},
            {managedPolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSGreengrassResourceAccessRolePolicy'},
        ],
        inlinePolicies: {
            logging: new iam.PolicyDocument({
                statements: [
                    new iam.PolicyStatement({
                        effect: 'Allow',
                        actions: [
                            'logs:CreateLogGroup',
                            'logs:CreateLogStream',
                            'logs:DescribeLogGroups',
                            'logs:DescribeLogStreams',
                            'logs:PutLogEvents',
                        ],
                        resources: '*',
                    }),
                ],
            }),
        },
    });

    const ggg = new greengrass.CfnGroup(scope, 'EntryGroup', {
        name: `${prefix}`,
        roleArn: ggr.roleArn,
    });

    // logger
    const loggerDef = new greengrass.CfnLoggerDefinition(scope, 'LoggerDefinition', {
        name: `${prefix}LoggerDefinition`,
    });
    const logger = new greengrass.CfnLoggerDefinitionVersion(scope, 'Logger', {
        loggerDefinitionId: loggerDef.ref,
        loggers: [
            {
                component: 'GreengrassSystem', // or Lambda
                id: `${prefix}Logger`,
                level: 'INFO', // or DEBUG, INFO, WARN, ERROR, FATAL
                type: 'AWSCloudWatch', // or FileSystem
                //space: 0, // if filesystem size in kb
            },
            {
                component: 'GreengrassSystem', // or Lambda
                id: `${prefix}LocalLogger`,
                level: 'DEBUG', // or DEBUG, INFO, WARN, ERROR, FATAL
                type: 'FileSystem', // or FileSystem
                space: 1000, // if filesystem size in kb
            },
            {
                component: 'Lambda',
                id: `${prefix}LambdaLogger`,
                level: 'INFO', // or DEBUG, INFO, WARN, ERROR, FATAL
                type: 'AWSCloudWatch', // or FileSystem
                //space: 0, // if filesystem size in kb
            },
            {
                component: 'Lambda',
                id: `${prefix}LocalLambdaLogger`,
                level: 'DEBUG', // or DEBUG, INFO, WARN, ERROR, FATAL
                type: 'FileSystem', // or FileSystem
                space: 1000, // if filesystem size in kb
            },
        ],
    });

    // Subscriptions
    const subDef = new greengrass.CfnSubscriptionDefinition(scope, 'SubscriptionDefinition', {
        name: `${prefix}SubscriptionDefinition`,
    });
    const subs = new greengrass.CfnSubscriptionDefinitionVersion(scope, 'Subscriptions', {
        subscriptionDefinitionId: subDef.ref,
        subscriptions,
    });

    // Lambdas
    const funcRef = new greengrass.CfnFunctionDefinition(scope, 'FunctionDefinition', {
        name: `${prefix}FunctionDefinition`,
    });
    const funcs = new greengrass.CfnFunctionDefinitionVersion(scope, 'Functions', {
        functionDefinitionId: funcRef.ref,
        functions,
    });

    // Devices/Things
    const devicesRef = new greengrass.CfnDeviceDefinition(scope, 'DeviceDefinition', {
        name: `${prefix}DeviceDefinition`,
    });
    const devs = new greengrass.CfnDeviceDefinitionVersion(scope, 'Devices', {
        deviceDefinitionId: devicesRef.ref,
        devices,
    });

    const gggv = new greengrass.CfnGroupVersion(scope, 'EntryGroupVersion', {
        groupId: ggg.ref,
        coreDefinitionVersionArn: `${core.ref}`,
        //connectorDefinitionVersionArn,
        deviceDefinitionVersionArn: devs.ref,
        functionDefinitionVersionArn: funcs.ref,
        loggerDefinitionVersionArn: logger.ref,
        //resourceDefinitionVersionArn,
        subscriptionDefinitionVersionArn: subs.ref,
    });

    return gggv;
};
