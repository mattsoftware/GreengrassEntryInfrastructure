//@format

const awsIot = require('aws-iot-device-sdk');
const AWS = require('aws-sdk');

(async () => {
    const STS = new AWS.STS();
    const identity = await STS.getCallerIdentity().promise();
    const accountId = identity.Account;
    const config = require('../config.json')[accountId];

    const deviceConfig = {
        keyPath: 'monitor/monitor.key',
        certPath: `monitor/monitor-${config.prefix}.pem`,
        caPath: 'monitor/root.ca.pem',
        clientId: 'monitor-open',
        host: config.iotEndpoint,
    };
    const device = awsIot.device(deviceConfig);

    device.on('connect', () => {
        console.log('connect');
        device.publish('door1/open', JSON.stringify({}));
        setTimeout(() => device.end(), 500);
    });
})();
