const lookups = [
  { id: 'my-first-lookup', text: 'My First Lookup' },
  { id: 'my-other-lookup', text: 'My Other Lookup' }
];
const { getOpts } = require('./utils');

exports.handler = (evt, ctx, cb) =>
  cb(null, getOpts({ body: JSON.stringify({ results: lookups }) }));
