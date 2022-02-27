//@format
const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const DynamoDB = new AWS.DynamoDB({region: 'ap-southeast-2'});
const S3 = new AWS.S3({region: 'ap-southeast-2'});
const crypto = require('crypto');
const IotData = new AWS.IotData({region: 'ap-southeast-2', endpoint: process.env.IOT_ENDPOINT});

exports.handler = (event, context) => {
    console.log(event, context);

    return DynamoDB.scan({
        TableName: process.env.TABLE,
    })
        .promise()
        .then(d => d.Items)
        .then(d =>
            d.map(i => ({
                enabled: i.enabled.BOOL,
                name: i.name.S,
                entry_cards: i.entry_cards && i.entry_cards.SS ? i.entry_cards.SS : [],
            })),
        )
        .then(d => d.filter(i => i.enabled))
        .then(d => {
            const content = JSON.stringify(d);
            return S3.putObject({
                Body: content,
                Bucket: process.env.BUCKET,
                Key: process.env.OBJECT,
            })
                .promise()
                .then(s => crypto.createHash('sha1').update(content).digest('hex'));
        })
        .then(d => {
            if (process.env.THING_NAME) {
                return IotData.updateThingShadow({
                    thingName: process.env.THING_NAME,
                    payload: JSON.stringify({state: {desired: {'users.json': d}}}),
                }).promise();
            }
        })
        .then(d => console.log(JSON.stringify(d)));
};
