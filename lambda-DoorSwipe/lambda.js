//@format

const ggSdk = require('aws-greengrass-core-sdk');
const {scanLoop} = require('msw_greengrass_entry/rfid');
const os = require('os');
const util = require('util');
const fs = require('fs');

const iotClient = new ggSdk.IotData();

function publishCallback(err, data) {
    console.log(err);
    console.log(data);
}

exports.handler = async function handler(event, context) {
    console.log('event', JSON.stringify(event));
    console.log('context', JSON.stringify(context));

    let x = 0;
};

const loop = async () => {
    while (true) {
        await scanLoop(uid => {
            console.log(uid);
            const pubOpt = {};
            pubOpt.payload = JSON.stringify({card: `${uid}`});
            pubOpt.topic = 'door1/scan';
            iotClient.publish(pubOpt, publishCallback);
        });
    }
};
loop();
