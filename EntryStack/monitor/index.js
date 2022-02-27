//@format
const {sleep} = require('msw_nodejs_helper');
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
        clientId: 'monitor',
        host: config.iotEndpoint,
    };
    const device = awsIot.device(deviceConfig);

    device.on('connect', () => {
        console.log(new Date(), 'connect');
        device.subscribe('door1/#');
    });

    device.on('message', (topic, payload) => {
        console.log(new Date(), 'message', topic, payload.toString());
    });

    device.on('close', () => console.error('closed'));
    device.on('reconnect', () => console.error('reconnect'));
    device.on('offline', () => console.error('offline'));
    device.on('error', err => {
        console.error('error:', err);
    });
})();
