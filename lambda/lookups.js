const lookups = [
  { id: 'my-first-lookup', text: 'My First Lookup' },
  { id: 'my-other-lookup', text: 'My Other Lookup' }
];

const lookupParameters = [
  { text: 'String', type: 'String', id: 'id' },
  { text: 'Date', type: 'Date', id: 'objectId' },
  { text: 'Number', type: 'Number', id: 'phone' }
];

const { getOpts } = require('./utils');

exports.handler = (evt, ctx, cb) => {
  if (evt.queryStringParameters.db) {
    return cb(null, getOpts({ body: JSON.stringify({ results: lookupParameters }) }));
  }
  return cb(null, getOpts({ body: JSON.stringify({ results: lookups }) }));
};
