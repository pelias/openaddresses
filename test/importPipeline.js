var fs = require( 'fs' );
var path = require( 'path');

var tape = require( 'tape' );
var event_stream = require( 'event-stream' );
var deep = require( 'deep-diff' );
var filter = require('through2-filter');
var map = require('through2-map');
var _ = require('lodash');

var importPipeline = require( '../lib/importPipeline' );

var basePath = path.resolve(__dirname);
var expectedPath = basePath + '/data/expected.json';
var inputFiles =  [ basePath + '/data/input_file_1.csv', basePath + '/data/input_file_2.csv'];

tape('functional test of importing two small OA files', function(t) {
  var expected = JSON.parse(fs.readFileSync(expectedPath));

  // mock deduplicator that rejects records with `lon` value of `92.929292`
  var deduplicatorStream = filter.obj(function(record) {
    if (_.isEqual(record.center_point, { lat: 29.292929, lon: 92.929292})) {
      return false;
    }

    // otherwise
    return true;

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

  // this stream is the final destination that does the actual test
  var endStream = event_stream.writeArray(function(err, results) {
    // uncomment this to write the actual results to the expected file
    // make sure they look ok though. comma left off so jshint reminds you
    // not to commit this line
    //fs.writeFileSync(expectedPath, JSON.stringify(results, null, 2))

    var diff = deep(expected, results);

    if (diff) {
      t.fail('expected and actual output are the same');
      console.log(diff);
    } else {
      t.pass('expected and actual output are the same');
    }
    t.end();
  });

  importPipeline.create(inputFiles, basePath, deduplicatorStream, adminLookupStream, endStream);

});
