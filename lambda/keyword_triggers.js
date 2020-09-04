// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getOpts } = require('./utils');
const triggers = [
  {
    id: 47,
    uuid: 47,
    name: 'embed',
    keyword: 'embed',
    flow: {
      uuid: '49c55d47-44ab-412c-a602-e58f2070955f',
      name: 'Test_ED'
    }
  },
  {
    id: 46,
    uuid: 46,
    name: 'tested',
    keyword: 'tested',
    flow: {
      uuid: '49c55d47-44ab-412c-a602-e58f2070955f',
      name: 'Test_ED'
    }
  },
  {
    id: 45,
    uuid: 45,
    name: 'set2',
    keyword: 'set2',
    flow: {
      uuid: '590fc8bf-729d-48d1-b1a0-22efd2476beb',
      name: 'Merge of 0730 action set 2 with 0730 action set 1'
    }
  },
  {
    id: 44,
    uuid: 44,
    name: 'set1',
    keyword: 'set1',
    flow: {
      uuid: '590fc8bf-729d-48d1-b1a0-22efd2476beb',
      name: 'Merge of 0730 action set 2 with 0730 action set 1'
    }
  },
  {
    id: 43,
    uuid: 43,
    name: 'flow2',
    keyword: 'flow2',
    flow: {
      uuid: 'b7c79959-aede-48e1-b339-20007e36c295',
      name: 'Merge of 20200729 flow 1 with 20200729 flow 2'
    }
  },
  {
    id: 42,
    uuid: 42,
    name: 'flow1',
    keyword: 'flow1',
    flow: {
      uuid: 'b7c79959-aede-48e1-b339-20007e36c295',
      name: 'Merge of 20200729 flow 1 with 20200729 flow 2'
    }
  }
];

// eslint-disable-next-line no-undef
exports.handler = (evt, ctx, cb) =>
  cb(null, getOpts({ body: JSON.stringify({ results: triggers }) }));
