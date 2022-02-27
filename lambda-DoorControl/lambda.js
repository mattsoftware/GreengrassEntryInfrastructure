//@format

const entry = require('msw_greengrass_entry');
const door = require('msw_greengrass_entry/door');
const {sleep} = require('msw_nodejs_helper');

exports.handler = async function handler(event, context, cb) {
    door.openDoor();
    return cb(true);
};

const loop = async () => {
    console.log('.');
    while (true) {
        await sleep(1000);
    }
};
loop();
