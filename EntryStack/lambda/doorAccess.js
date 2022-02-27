//@format
//@flow strict

const lambda = require('@aws-cdk/aws-lambda');

module.exports = (scope, id, {usersFilename}) => {
    const now = new Date().toISOString();
    const doorAccessLambda = new lambda.Function(scope, 'DoorAccess', {
        description: `Door Access Function generated ${now}`,
        runtime: lambda.Runtime.NODEJS_12_X,
        code: lambda.Code.fromAsset('../lambda-DoorAccess', {}),
        handler: 'lambda.handler',
        //environment,
    });

    const doorAccessVersion = doorAccessLambda.addVersion(now);

    const doorAccessAlias = new lambda.Alias(scope, 'DoorAccessAlias', {
        aliasName: 'GGC',
        version: doorAccessVersion,
    });

    const doorAccessGGVersion = {
        id: `${id}-${doorAccessAlias.functionName}`,
        functionArn: doorAccessAlias.functionArn,
        functionConfiguration: {
            encodingType: 'json',
            environment: {
                //accessSysfs,
                execution: {
                    isolationMode: 'NoContainer',
                    runAs: {uid: 0, gid: 0},
                },
                //resourceAccessPolicies: [],
                variables: {
                    filename: usersFilename,
                },
            },
            //execArgs,
            //executable,
            //memorySize: 1024,
            pinned: false,
            timeout: 15,
        },
    };

    return {
        lambda: doorAccessLambda,
        greengrass: doorAccessGGVersion,
    };
};
