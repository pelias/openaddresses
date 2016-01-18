var tape = require( 'tape' );
var event_stream = require( 'event-stream' );

var importPipelines = require( '../lib/import_pipelines' );

function test_stream(input, testedStream, callback) {
  var input_stream = event_stream.readArray(input);
  var destination_stream = event_stream.writeArray(callback);

  input_stream.pipe(testedStream).pipe(destination_stream);
}

tape( 'documentStream catches records with no street', function(test) {
  var input = {
    NUMBER: 5
  };
  var stats = { badRecordCount: 0 };
  var documentStream = importPipelines.createDocumentStream(stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual.length, 0, 'no documents should be pushed' );
    test.equal(stats.badRecordCount, 1, 'bad record count updated');
    test.end();
  });

});
