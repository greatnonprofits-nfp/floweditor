import { v4 as generateUUID } from 'uuid';

import { respond } from './utils/index.js';

exports.handler = (request, context, callback) => {
  if (request.httpMethod === 'POST') {
    const body = JSON.parse(request.body);
    respond(callback, {
      uuid: generateUUID(),
      name: body.name,
      query: null,
      status: 'ready',
      count: 0
    });
  } else {
    respond(callback, {
      results: [
        {
          uuid: '8498391d-8086-4818-b2db-08cfd72b8008',
          name: 'Test Group 1',
          query: null,
          status: 'ready',
          count: 1
        },
        {
          uuid: '8498391d-8086-4818-b2db-08cfd72b8009',
          name: 'Test Group 2',
          query: null,
          status: 'ready',
          count: 1
        }
      ]
    });
  }
};
