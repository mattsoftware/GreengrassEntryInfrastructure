//@format

const thing = require('./thing');

module.exports = (scope, id, {prefix, csr, greengrassShadowSync}) => {
    const stId = id === 'SyncThing' ? 'Thing' : `${prefix}-Thing`;
    const softThing = thing(scope, stId, {
        csr,
        prefix,
        greengrassShadowSync,
    });

    return softThing;
};
