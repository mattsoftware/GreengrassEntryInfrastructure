//@format

const awsIot = require('aws-iot-device-sdk');
const helper = require('msw_nodejs_helper');
const crypto = require('crypto');
const AWS = require('aws-sdk');
const S3 = new AWS.S3({region: 'ap-southeast-2'});

module.exports.handler = event => {
    console.log(event);
};
const connectOptions = {
    keyPath: '/greengrass/certs/s3sync.key',
    certPath: '/greengrass/certs/s3sync.pem',
    caPath: '/greengrass/certs/root.ca.pem',
    clientId: process.env.THING_NAME,
    region: 'ap-southeast-2',
    //baseReconnectTimeMs: args.baseReconnectTimeMs,
    //keepalive: args.keepAlive,
    //protocol: args.Protocol,
    //port: args.Port,
    host: process.env.IOT_ENDPOINT,
    //debug: args.Debug,
};
console.log(connectOptions);
const thingShadows = awsIot.thingShadow(connectOptions);

const syncUsers = hash => {
    console.log(`syncing users: wants hash ${hash}`);
    return S3.getObject({Bucket: process.env.BUCKET, Key: process.env.KEY})
        .promise()
        .then(v => v.Body)
        .then(body => helper.write(process.env.FILENAME, body))
        .then(v => reportCurrentState());
};

const reportCurrentState = () => {
    return helper
        .read(process.env.FILENAME)
        .then(file => crypto.createHash('sha1').update(file).digest('hex'))
        .then(hash => thingShadows.update(process.env.THING_NAME, {state: {reported: {'users.json': hash}}}));
};

thingShadows.on('connect', function () {
    thingShadows.register(process.env.THING_NAME, {ignoreDeltas: false}, () => {
        console.log('connected');
        return reportCurrentState();
    });
});

thingShadows.on('status', function (thingName, stat, clientToken, stateObject) {
    console.log('received ' + stat + ' on ' + thingName + ': ' + JSON.stringify(stateObject));
});

thingShadows.on('delta', function (thingName, stateObject) {
    console.log('received delta on ' + thingName + ': ' + JSON.stringify(stateObject));
    //[2020-01-05T10:45:11.308Z][INFO]-received delta on GreenGrassDoor2-SyncThing: {"version":4,"timestamp":1578221111,"state":{"users.json":"7b451a1129a16c2fb7c6191e4cb584a6d680a8aa"},"metadata":{"users.json":{"timestamp":1578221111}}}
    return syncUsers(stateObject.state['users.json']);
});

thingShadows.on('timeout', function (thingName, clientToken) {
    console.log('received timeout on ' + thingName + ' with token: ' + clientToken);
});
