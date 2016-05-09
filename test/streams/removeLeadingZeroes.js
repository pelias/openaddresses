var tape = require('tape');
var event_stream = require('event-stream');

var removeLeadingZeroes = require('../../lib/streams/removeLeadingZeroes');

function test_stream(input, testedStream, callback) {
    var input_stream = event_stream.readArray(input);
    var destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('removeLeadingZeroes', function(t) {
  t.test('house numbers prefixed with 0 should be trimmed to remove leading zeroes', function(t) {
    var records = [
      {
        address_parts: {
          number: '0100'
        }
      },
      {
        address_parts: {
          number: '00100'
        }
      }
    ];

    var expected = [
      {
        address_parts: {
          number: '100'
        }
      },
      {
        address_parts: {
          number: '100'
        }
      }
    ];

    var filter = removeLeadingZeroes.create();

    test_stream(records, filter, function(err, actual) {
      t.deepEqual(actual, expected, 'leading zeroes should have been removed');
      t.end();
    });

  });

  t.test('house numbers not prefixed with 0 should not be modified', function(t) {
    var records = [
      {
        address_parts: {
          number: '100'
        }
      },
      {
        address_parts: {
          number: '299'
        }
      }
    ];

    var filter = removeLeadingZeroes.create();

    test_stream(records, filter, function(err, actual) {
      t.deepEqual(actual, records, 'house numbers should not have been modified');
      t.end();
    });

  });

});
