//@format
//@flow strict

const lambda = require('@aws-cdk/aws-lambda');

module.exports = (scope, id, {}) => {
    const now = new Date().toISOString();
    const doorSwipeLambda = new lambda.Function(scope, 'DoorSwipe', {
        description: `Door Swipe Function generated ${now}`,
        runtime: lambda.Runtime.NODEJS_12_X,
        code: lambda.Code.fromAsset('../lambda-DoorSwipe', {}),
        handler: 'lambda.handler',
        //environment,
    });

    const doorSwipeVersion = doorSwipeLambda.addVersion(now);

    const doorSwipeAlias = new lambda.Alias(scope, 'DoorSwipeAlias', {
        aliasName: 'GGC',
        version: doorSwipeVersion,
    });

    const doorSwipeGGVersion = {
        id: `${id}-${doorSwipeAlias.functionName}`,
        functionArn: doorSwipeAlias.functionArn,
        functionConfiguration: {
            encodingType: 'json',
            environment: {
                //accessSysfs,
                execution: {
                    isolationMode: 'NoContainer',
                    runAs: {uid: 0, gid: 0},
                },
                //resourceAccessPolicies: [],
                //variables: {}
            },
            //execArgs,
            //executable,
            //memorySize: 16 * 1024,
            pinned: true,
            timeout: 15,
        },
    };

    return {
        lambda: doorSwipeLambda,
        greengrass: doorSwipeGGVersion,
    };
};
