var tape = require( 'tape' );
var event_stream = require( 'event-stream' );

var CleanupStream = require( '../../lib/streams/cleanupStream' );

function test_stream(input, testedStream, callback) {
  var input_stream = event_stream.readArray(input);
  var destination_stream = event_stream.writeArray(callback);

  input_stream.pipe(testedStream).pipe(destination_stream);
}

tape( 'cleanupStream trims whitespace from all fields', function(test) {
  var input = {
    NUMBER: '5 ',
    STREET: ' abcd ',
    LAT: 5,
    LON: 6,
    POSTCODE: ' def '
  };

  var cleanupStream = CleanupStream.create();

  test_stream([input], cleanupStream, function(err, records) {
    test.equal(records.length, 1, 'stream length unchanged');

    var record = records[0];
    test.equal(record.NUMBER, '5', 'NUMBER field is trimmed');
    test.equal(record.STREET, 'abcd', 'STREET field is trimmed');
    test.equal(record.POSTCODE, 'def', 'POSTCODE field is trimmed');
    test.end();
  });
});

tape( 'cleanupStream trims leading 0\'s from house numbers', function(test) {
  var inputs = [
    {
      NUMBER: ' 0030 ',
      STREET: 'Street'
    },
    {
      NUMBER: '0034560',
      STREET: 'Street'
    },
    {
      NUMBER: '12340',
      STREET: 'Street'
    }
  ];

  var expecteds = [
    {
      NUMBER: '30',
      STREET: 'Street'
    },
    {
      NUMBER: '34560',
      STREET: 'Street'
    },
    {
      NUMBER: '12340',
      STREET: 'Street'
    }
  ];

  var cleanupStream = CleanupStream.create();

  test_stream(inputs, cleanupStream, function(err, actual) {
    test.deepEqual(actual, expecteds, 'leading 0\'s should have been trimmed from NUMBER');
    test.end();
  });

});

tape ( 'cleanupStream trims white space in street field', function(test){
  var input = {
      STREET: '34  West\t 93rd \nst'
  };

  var cleanupStream = CleanupStream.create();

  test_stream([input],cleanupStream, function(err,records){
    test.equal(records.length, 1, 'stream length unchanged');
    test.equal(records[0].STREET, '34 West 93rd st');
    test.end();
  });
});
