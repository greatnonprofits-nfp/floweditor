const results = [{ id: 'link-1', text: '@google' }, { id: 'link-2', text: '@twitter' }];
const { getOpts } = require('./utils');

exports.handler = (evt, ctx, cb) => cb(null, getOpts({ body: JSON.stringify({ results }) }));
