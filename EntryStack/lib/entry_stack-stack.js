//@format

const cdk = require('@aws-cdk/core');
const greengrassStack = require('./greengrass_stack');
const userStack = require('./user_stack');
const monitorStack = require('./monitor');
const greengrassDoorSwipeLambda = require('../lambda/doorSwipe');
const greengrassDoorAccessLambda = require('../lambda/doorAccess');
const greengrassDoorControlLambda = require('../lambda/doorControl');

const region = process.env.CDK_DEFAULT_REGION;
const accountId = process.env.CDK_DEFAULT_ACCOUNT;
const config = require('../config.json')[accountId];
const prefix = config.prefix;
const tags = {
    project: 'doors',
    environment: 'development',
};

const iotEndpoint = config.iotEndpoint;
const coreCSR = config.coreCSR;

class EntryStackStack extends cdk.Stack {
    /**
     *
     * @param {cdk.Construct} scope
     * @param {string} id
     * @param {cdk.StackProps=} props
     */
    constructor(scope, id, props) {
        super(scope, id, {tags, ...props});

        const usersFilename = '/users.json';
        const user = userStack(this, 'Users', {prefix, iotEndpoint, usersFilename, csr: config.s3SyncCSR});
        const monitor = monitorStack(this, 'Monitor', {prefix, iotEndpoint, csr: config.monitorCSR});
        const doorswipeLambda = greengrassDoorSwipeLambda(this, 'DoorSwipeLambda', {});
        const dooraccessLambda = greengrassDoorAccessLambda(this, 'DoorAccessLambda', {usersFilename});
        const doorcontrolLambda = greengrassDoorControlLambda(this, 'DoorControlLambda', {});

        const gg = greengrassStack(this, 'GG', {
            prefix,
            coreCSR,
            subscriptions: [
                {
                    id: `DoorSwipeScan`,
                    source: doorswipeLambda.greengrass.functionArn,
                    subject: 'door1/scan',
                    target: 'cloud',
                },
                {
                    id: `DoorAccessScan`,
                    source: 'cloud', // thing, lambda, connector arns, or cloud, or GGShadowService
                    subject: 'door1/scan',
                    target: dooraccessLambda.greengrass.functionArn,
                },
                {
                    id: `DoorAccessOpen`,
                    source: dooraccessLambda.greengrass.functionArn,
                    subject: 'door1/open',
                    target: 'cloud',
                },
                {
                    id: `DoorAccessDenied`,
                    source: dooraccessLambda.greengrass.functionArn,
                    subject: 'door1/denied',
                    target: 'cloud',
                },
                {
                    id: `DoorControlOpen`,
                    source: 'cloud',
                    subject: 'door1/open',
                    target: doorcontrolLambda.greengrass.functionArn,
                },
            ],
            functions: [
                doorswipeLambda.greengrass,
                dooraccessLambda.greengrass,
                user.s3SyncLambda.greengrass,
                doorcontrolLambda.greengrass,
            ],
            devices: [user.syncThing.greengrass, monitor.monitorThing.greengrass],
        });

        //user.s3Bucket.grantRead(coreDeviceRole);

        // TODO: S3Sync device (software device, can i do this in lambda?)
        // TODO: GreengrassDoor_Scanner device
        // TODO: TestThing device
    }
}

module.exports = {EntryStackStack};
