var fs = require( 'fs' );
var path = require( 'path');

var tape = require( 'tape' );
var event_stream = require( 'event-stream' );
var deep = require( 'deep-diff' );

var importPipeline = require( '../lib/importPipeline' );

var basePath = path.resolve(__dirname);
var expectedPath = basePath + '/data/expected.json';
var inputFiles =  [ basePath + '/data/banff.csv', basePath + '/data/kodiak_island_borough.csv' ];

tape('functional test of importing two small OA files', function(t) {
  var expected = JSON.parse(fs.readFileSync(expectedPath));

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

  var opts = {
    deduplicate: false, // its not currently feasible to run these in this test
    adminValues: false,
    dirPath: basePath
  };

  importPipeline.create(inputFiles, opts, endStream);
});
