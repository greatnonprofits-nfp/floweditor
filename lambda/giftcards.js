const results = [
  { id: 'my-first-gift-card', text: 'Gift Card' },
  { id: 'my-other-gift-card', text: 'My Other Gift Card' }
];
const { getOpts } = require('./utils');

exports.handler = (evt, ctx, cb) => cb(null, getOpts({ body: JSON.stringify({ results }) }));
