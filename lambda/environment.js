const environment = {
  date_format: 'YYYY-MM-DD',
  time_format: 'hh:mm',
  timezone: 'Africa/Kigali',
  languages: ['eng', 'spa', 'fra'],
  has_ivr_machine_detection: true
};
const { getOpts } = require('./utils');

exports.handler = (evt, ctx, cb) => cb(null, getOpts({ body: JSON.stringify(environment) }));
