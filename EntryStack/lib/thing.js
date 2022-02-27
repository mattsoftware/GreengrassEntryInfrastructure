//@format

const cdk = require('@aws-cdk/core');
const iot = require('@aws-cdk/aws-iot');

const region = process.env.CDK_DEFAULT_REGION;
const accountId = process.env.CDK_DEFAULT_ACCOUNT;

module.exports = (scope, id, {csr, prefix, greengrassShadowSync}) => {
    const certificate = new iot.CfnCertificate(scope, `${id}-Certificate`, {
        certificateSigningRequest: csr,
        status: 'ACTIVE', // ACTIVE | INACTIVE | REVOKED | PENDING_TRANSFER | REGISTER_INACTIVE | PENDING_ACTIVATION
    });
    const certificateArn = `arn:aws:iot:${region}:${accountId}:cert/${certificate.ref}`;

    const policy = new iot.CfnPolicy(scope, `${id}-Policy`, {
        policyName: `${prefix}-Policy`,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: ['iot:Publish', 'iot:Subscribe', 'iot:Connect', 'iot:Receive'],
                    Resource: ['*'],
                },
                {
                    Effect: 'Allow',
                    Action: ['iot:GetThingShadow', 'iot:UpdateThingShadow', 'iot:DeleteThingShadow'],
                    Resource: ['*'],
                },
                {
                    Effect: 'Allow',
                    Action: ['greengrass:*'],
                    Resource: ['*'],
                },
            ],
        },
    });

    const thing = new iot.CfnThing(scope, id, {
        thingName: `${prefix}`,
    });

    // Attach the certificate to the policy
    const policyAttachment = new iot.CfnPolicyPrincipalAttachment(scope, `${id}-PolicyAttachment`, {
        policyName: policy.policyName,
        principal: certificateArn,
    });

    //Attach the thing to the policy
    const thingAttachment = new iot.CfnThingPrincipalAttachment(scope, `${id}-ThingAttachment`, {
        thingName: thing.thingName,
        principal: certificateArn,
    });

    thing.certificateRef = certificate.ref;

    new cdk.CfnOutput(scope, `${prefix}-Certificate`, {
        value: certificateArn,
    });

    return {
        thing,
        thingArn: `arn:aws:iot:${region}:${accountId}:thing/${thing.thingName}`,
        greengrass: {
            certificateArn: certificateArn,
            id: thing.thingName,
            thingArn: `arn:aws:iot:${region}:${accountId}:thing/${thing.thingName}`,
            syncShadow: greengrassShadowSync,
        },
    };
};
