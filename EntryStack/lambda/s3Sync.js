//@format
//@flow strict

const lambda = require('@aws-cdk/aws-lambda');

module.exports = (scope, id, {iotEndpoint, thingName, bucket, key, filename}) => {
    const now = new Date().toISOString();
    const s3SyncLambda = new lambda.Function(scope, 'S3Sync', {
        description: `S3 Sync Thing function  generated ${now}`,
        runtime: lambda.Runtime.NODEJS_12_X,
        code: lambda.Code.fromAsset('../lambda-S3Sync', {}),
        handler: 'lambda.handler',
        environment: {},
    });

    const s3SyncVersion = s3SyncLambda.addVersion(now);

    const s3SyncAlias = new lambda.Alias(scope, 'S3SyncAlias', {
        aliasName: 'GGC',
        version: s3SyncVersion,
    });

    const s3SyncGGVersion = {
        id: `${id}-${s3SyncAlias.functionName}`,
        functionArn: s3SyncAlias.functionArn,
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
                    THING_NAME: thingName,
                    IOT_ENDPOINT: iotEndpoint,
                    BUCKET: bucket,
                    KEY: key,
                    FILENAME: filename,
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
        lambda: s3SyncLambda,
        greengrass: s3SyncGGVersion,
    };
};
