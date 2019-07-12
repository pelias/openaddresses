var fs = require( 'fs' );
var path = require( 'path');

var tape = require( 'tape' );
var deep = require( 'deep-diff' );
var map = require('through2-map');
var _ = require('lodash');
var proxyquire = require('proxyquire');
const stream = require('stream');

var basePath = path.resolve(__dirname);
var expectedPath = basePath + '/data/expected.json';
var inputFiles =  [ basePath + '/data/input_file_1.csv', basePath + '/data/input_file_2.csv'];

function writableStreamArray(cb) {

  const s = new stream.Stream();
  let arr = [];
  let streamFinished = false;

  s.end = function() {
    streamFinished = true;
    cb(null, arr);
  };

  s.write = function (ele) {
    arr.push(ele);
  };

  return s;
}

tape('functional test of importing two small OA files', function(t) {
  var expected = JSON.parse(fs.readFileSync(expectedPath));

  // return a stream that does the actual test
  function fakeDbclient() {
    return writableStreamArray(function(err, results) {
      // uncomment this to write the actual results to the expected file
      // make sure they look ok though. comma left off so jshint reminds you
      // not to commit this line
      //fs.writeFileSync(expectedPath, JSON.stringify(results, null, 2))

      var diff = deep(expected, results);

      if (diff) {
        t.fail('expected and actual output are not the same');
        console.log(diff);
      } else {
        t.pass('expected and actual output are the same');
      }
      t.end();
    });
  }

  var importPipeline = proxyquire( '../lib/importPipeline', {
  'pelias-dbclient': fakeDbclient
  });

  // mock admin lookup stream to show that input file admin values are ignored
  // and replaced with overrides from adminLookup
  var adminLookupStream = map.obj(function(record) {
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

  importPipeline.create(inputFiles, basePath, adminLookupStream);

});
