const _ = require('lodash');
const path = require('path');
const tape = require('tape');
const map = require('through2-map');
const proxyquire = require('proxyquire');
const stream_mock = require('stream-mock');

const expectedPath = path.join(__dirname, 'data/expected.json');
const expected = require(expectedPath);

tape('functional test of importing four small OA files', function(t) {
  // expect two assertions, one for the error and one for the data
  t.plan(2);

  const assert = (err, actual) => {
    // uncomment this to write the actual results to the expected file
    // make sure they look ok though. comma left off so jshint reminds you
    // not to commit this line
    // require('fs').writeFileSync(expectedPath, JSON.stringify(actual, null, 2))

    t.error(err);
    t.deepEquals(actual, expected);
    t.end();
  };

  const importPipeline = proxyquire('../lib/importPipeline', {
    'pelias-dbclient': () => {
      const dbclient = new stream_mock.ObjectWritableMock();
      dbclient.on('error', (e) => assert(e));
      dbclient.on('finish', () => assert(null, dbclient.data));
      return dbclient;
    }
  });

  // mock admin lookup stream to show that input file admin values are ignored
  // and replaced with overrides from adminLookup
  const adminLookupStream = map.obj((record) => {
    // we're only concerned about one record being modified
    if (_.isEqual(record.center_point, { lat: 12.121212, lon: 21.212121})) {
      record.addParent('country', 'override country', '1');
      record.addParent('macroregion', 'override macroregion', '2');
      record.addParent('region', 'override region', '3');
      record.addParent('macrocounty', 'override macrocounty', '4');
      record.addParent('county', 'override county', '5');
      record.addParent('borough', 'override borough', '6');
      record.addParent('locality', 'override locality', '7');
      record.addParent('localadmin', 'override localadmin', '8');
      record.addParent('neighbourhood', 'override neighbourhood', '9');
    }

    return record;
  });

  // test fixtures
  const dirPath = path.join(__dirname, 'data');
  const inputFiles = [
    path.join(dirPath, 'input_file_1.csv'),
    path.join(dirPath, 'input_file_2.csv'),
    path.join(dirPath, 'au/input_file_3.csv'),
    path.join(dirPath, 'au/input_file_4.csv')
  ];

  importPipeline.create(inputFiles, dirPath, adminLookupStream);
});
