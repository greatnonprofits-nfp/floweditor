const lookups = [
  { id: 'my-first-lookup', text: 'My First Lookup' },
  { id: 'my-other-lookup', text: 'My Other Lookup' }
];

const lookupParameters = [
  { text: 'id', type: 'String', id: 'id' },
  { text: 'objectId', type: 'String', id: 'objectId' },
  { text: 'phone', type: 'String', id: 'phone' }
];

const { getOpts } = require('./utils');

exports.handler = (evt, ctx, cb) => {
  if (evt.queryStringParameters.db) {
    return cb(null, getOpts({ body: JSON.stringify({ results: lookupParameters }) }));
  }
  return cb(null, getOpts({ body: JSON.stringify({ results: lookups }) }));
};
