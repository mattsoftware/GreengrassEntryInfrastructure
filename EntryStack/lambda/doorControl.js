//@format
//@flow strict

const lambda = require('@aws-cdk/aws-lambda');

module.exports = (scope, id, {usersFilename}) => {
    const now = new Date().toISOString();
    const doorControlLambda = new lambda.Function(scope, 'DoorControl', {
        description: `Door Control Function generated ${now}`,
        runtime: lambda.Runtime.NODEJS_12_X,
        code: lambda.Code.fromAsset('../lambda-DoorControl', {}),
        handler: 'lambda.handler',
        //environment,
    });

    const doorControlVersion = doorControlLambda.addVersion(now);

    const doorControlAlias = new lambda.Alias(scope, 'DoorControlAlias', {
        aliasName: 'GGC',
        version: doorControlVersion,
    });

    const doorControlGGVersion = {
        id: `${id}-${doorControlAlias.functionName}`,
        functionArn: doorControlAlias.functionArn,
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
            pinned: true,
            timeout: 15,
        },
    };

    return {
        lambda: doorControlLambda,
        greengrass: doorControlGGVersion,
    };
};
