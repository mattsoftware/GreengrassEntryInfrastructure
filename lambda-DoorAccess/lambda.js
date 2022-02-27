//@format

const ggSdk = require('aws-greengrass-core-sdk');
const os = require('os');
const util = require('util');
const fs = require('fs');

const iotClient = new ggSdk.IotData();

function publishCallback(err, data) {
    console.log(err);
    console.log(data);
}

exports.handler = function handler(event, context) {
    console.log('event');
    console.log(JSON.stringify(event));
    console.log('context');
    console.log(JSON.stringify(context));

    const content = fs.readFileSync(process.env.filename, {flag: 'rs+'});
    const users = JSON.parse(content);
    console.log(JSON.stringify(users));

    const scanned_card = event.card;
    const user = users.filter(v => v.entry_cards.indexOf(scanned_card) > -1);
    const pubOpt = {};
    if (user.length === 1) {
        // Good to go
        pubOpt.payload = JSON.stringify({user: user[0].name});
        pubOpt.topic = 'door1/open';
    } else if (user.length > 1) {
        // too many users allocated to the card
        pubOpt.payload = JSON.stringify({users: user});
        pubOpt.topic = 'door1/denied';
    } else {
        // did not find card
        pubOpt.payload = JSON.stringify({card: scanned_card});
        pubOpt.topic = 'door1/denied';
    }
    iotClient.publish(pubOpt, publishCallback);
};
