const attachments = {
  type: 'image/jpeg',
  url: '/favicon.ico'
};

const { getOpts } = require('./utils');

exports.handler = (evt, ctx, cb) => cb(null, getOpts({ body: JSON.stringify(attachments) }));
