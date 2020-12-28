const attachmentsValidation = {
  valid: true,
  type: 'image',
  size: 9604
};

const { getOpts } = require('./utils');

exports.handler = (evt, ctx, cb) =>
  cb(null, getOpts({ body: JSON.stringify(attachmentsValidation) }));
