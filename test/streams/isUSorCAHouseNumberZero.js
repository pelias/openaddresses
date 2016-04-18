var tape = require('tape');
var event_stream = require('event-stream');

var isUSorCAHouseNumberZero = require('../../lib/streams/isUSorCAHouseNumberZero');

function test_stream(input, testedStream, callback) {
    var input_stream = event_stream.readArray(input);
    var destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('isUSorCAHouseNumberZero', function(t) {
  t.test('non-0 house number in USA should return true', function(t) {
    var record = {
      parent: {
        country_a: ['USA']
      },
      address_parts: {
        number: '17'
      }
    };

    var filter = isUSorCAHouseNumberZero.create();

    test_stream([record], filter, function(err, actual) {
      t.deepEqual(actual, [record], 'should have returned true');
      t.end();
    });

  });

  t.test('non-0 house number in CAN should return true', function(t) {
    var record = {
      parent: {
        country_a: ['CAN']
      },
      address_parts: {
        number: '17'
      }
    };

    var filter = isUSorCAHouseNumberZero.create();

    test_stream([record], filter, function(err, actual) {
      t.deepEqual(actual, [record], 'should have returned true');
      t.end();
    });

  });

  t.test('non-0 house number in non-USA/CAN should return true', function(t) {
    var record = {
      parent: {
        country_a: ['GBR']
      },
      address_parts: {
        number: '17'
      }
    };

    var filter = isUSorCAHouseNumberZero.create();

    test_stream([record], filter, function(err, actual) {
      t.deepEqual(actual, [record], 'should have returned true');
      t.end();
    });

  });

  t.test('0 house number in USA should return false', function(t) {
    var record = {
      parent: {
        country_a: ['USA']
      },
      address_parts: {
        number: '0'
      }
    };

    var filter = isUSorCAHouseNumberZero.create();

    test_stream([record], filter, function(err, actual) {
      t.deepEqual(actual, [], 'should have returned true');
      t.end();
    });

  });

  t.test('0 house number in CAN should return false', function(t) {
    var record = {
      parent: {
        country_a: ['CAN']
      },
      address_parts: {
        number: '0'
      }
    };

    var filter = isUSorCAHouseNumberZero.create();

    test_stream([record], filter, function(err, actual) {
      t.deepEqual(actual, [], 'should have returned true');
      t.end();
    });

  });

  t.test('0 house number in non-USA/CAN should return true', function(t) {
    var record = {
      parent: {
        country_a: ['GBR']
      },
      address_parts: {
        number: '0'
      }
    };

    var filter = isUSorCAHouseNumberZero.create();

    test_stream([record], filter, function(err, actual) {
      t.deepEqual(actual, [record], 'should have returned true');
      t.end();
    });

  });

});
