//@format

const cdk = require('@aws-cdk/core');
const dynamodb = require('@aws-cdk/aws-dynamodb');
const s3 = require('@aws-cdk/aws-s3');
const lambda = require('@aws-cdk/aws-lambda');
const path = require('path');
const softThing = require('./softwareThing');
const s3syncLambda = require('../lambda/s3Sync');
const lambdaEventSource = require('@aws-cdk/aws-lambda-event-sources');
const iam = require('@aws-cdk/aws-iam');

module.exports = (scope, id, {prefix, iotEndpoint, usersFilename, csr}) => {
    const userTable = new dynamodb.Table(scope, 'UserTable', {
        partitionKey: {name: 'id', type: dynamodb.AttributeType.NUMBER},
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        serverSideEncryption: true,
        tableName: `${prefix}Users`,
        stream: dynamodb.StreamViewType.KEYS_ONLY,
    });

    new cdk.CfnOutput(scope, `${prefix}-UserTable`, {
        value: userTable.tableName,
    });

    const s3Bucket = new s3.Bucket(scope, 'Bucket', {
        bucketName: `${prefix.toLowerCase()}`,
        encryption: s3.BucketEncryption.kms,
        versioned: true,
    });

    const userJsonKey = 'users.json';

    const syncThing = softThing(scope, 'SyncThing', {
        csr,
        prefix: `${prefix}-SyncThing`,
        greengrassShadowSync: true,
    });
    const s3Sync = s3syncLambda(scope, 'S3Sync', {
        iotEndpoint,
        thingName: syncThing.thing.thingName,
        bucket: s3Bucket.bucketName,
        key: userJsonKey,
        filename: usersFilename,
    });

    const userWatchLambda = new lambda.Function(scope, 'UserWatch', {
        runtime: lambda.Runtime.NODEJS_12_X,
        handler: 'lambda.handler',
        tracing: lambda.Tracing.ACTIVE,
        environment: {
            IOT_ENDPOINT: iotEndpoint,
            TABLE: userTable.tableName,
            BUCKET: s3Bucket.bucketName,
            OBJECT: userJsonKey,
            THING_NAME: syncThing.thing.thingName,
        },
        code: lambda.Code.fromAsset(
            path.join(__dirname, '..', '..', 'lambda-UserWatch', 'lambda-UserWatch-latest.zip'),
        ),
    });
    userWatchLambda.role.addToPolicy(
        new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: [syncThing.thingArn],
            actions: ['iot:UpdateThingShadow'],
            //conditions: [],
        }),
    );
    userWatchLambda.addEventSource(
        new lambdaEventSource.DynamoEventSource(userTable, {startingPosition: lambda.StartingPosition.LATEST}),
    );

    userTable.grantReadWriteData(userWatchLambda.role);
    s3Bucket.grantPut(userWatchLambda.role, userJsonKey);

    const coreDeviceRole = new iam.Role(scope, 'CoreDeviceRole', {
        assumedBy: new iam.ServicePrincipal('ssm.amazonaws.com'),
        roleName: `${prefix.toLowerCase()}`,
    });
    coreDeviceRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2RoleforSSM'));
    s3Bucket.grantRead(coreDeviceRole);
    new cdk.CfnOutput(scope, `${prefix}-Role`, {
        value: coreDeviceRole.roleName,
    });

    const coreDeviceUser = new iam.User(scope, 'CoreDeviceUser', {
        userName: `${prefix.toLowerCase()}`,
    });
    s3Bucket.grantRead(coreDeviceUser);

    return {
        s3SyncLambda: s3Sync,
        syncThing,
    };
};
