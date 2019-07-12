var tape = require('tape');
var isUSorCAHouseNumberZero = require('../../lib/streams/isUSorCAHouseNumberZero');

const stream_mock = require('stream-mock');

function test_stream(input, testedStream, callback) {
  const reader = new stream_mock.ObjectReadableMock(input);
  const writer = new stream_mock.ObjectWritableMock();
  writer.on('error', (e) => callback(e));
  writer.on('finish', () => callback(null, writer.data));
  reader.pipe(testedStream).pipe(writer);
}

tape('isUSorCAHouseNumberZero', function(t) {
  t.test('non-0 house number in USA should return true', function(t) {
    var records = [
      {
        parent: {
          country_a: ['USA']
        },
        address_parts: {
          number: '1007'
        }
      },
      {
        parent: {
          country_a: ['USA']
        },
        address_parts: {
          number: '0017'
        }
      },
      {
        parent: {
          country_a: ['USA']
        },
        address_parts: {
          number: '1700'
        }
      }
    ];

    var filter = isUSorCAHouseNumberZero.create();

    test_stream(records, filter, function(err, actual) {
      t.deepEqual(actual, records, 'none should have been filtered out');
      t.end();
    });

  });

  t.test('non-0 house number in CAN should return true', function(t) {
    var records = [
      {
        parent: {
          country_a: ['CAN']
        },
        address_parts: {
          number: '1007'
        }
      },
      {
        parent: {
          country_a: ['CAN']
        },
        address_parts: {
          number: '0017'
        }
      },
      {
        parent: {
          country_a: ['CAN']
        },
        address_parts: {
          number: '1700'
        }
      }
    ];

    var filter = isUSorCAHouseNumberZero.create();

    test_stream(records, filter, function(err, actual) {
      t.deepEqual(actual, records, 'none should have been filtered out');
      t.end();
    });

  });

  t.test('non-0 house number in non-USA/CAN should return true', function(t) {
    var records = [
      {
        parent: {
          country_a: ['GBR']
        },
        address_parts: {
          number: '1007'
        }
      },
      {
        parent: {
          country_a: ['GBR']
        },
        address_parts: {
          number: '0017'
        }
      },
      {
        parent: {
          country_a: ['GBR']
        },
        address_parts: {
          number: '1700'
        }
      }
    ];

    var filter = isUSorCAHouseNumberZero.create();

    test_stream(records, filter, function(err, actual) {
      t.deepEqual(actual, records, 'none should have been filtered out');
      t.end();
    });

  });

  t.test('house number reduceable to 0 in USA should return false', function(t) {
    var records = [
      {
        parent: {
          country_a: ['USA']
        },
        address_parts: {
          number: '0'
        }
      },
      {
        parent: {
          country_a: ['USA']
        },
        address_parts: {
          number: '00000'
        }
      }
    ];

    var filter = isUSorCAHouseNumberZero.create();

    test_stream(records, filter, function(err, actual) {
      t.deepEqual(actual, [], 'all should have been filtered out');
      t.end();
    });

  });

  t.test('house number reduceable to 0 in CAN should return false', function(t) {
    var records = [
      {
        parent: {
          country_a: ['CAN']
        },
        address_parts: {
          number: '0'
        }
      },
      {
        parent: {
          country_a: ['CAN']
        },
        address_parts: {
          number: '00000'
        }
      }
    ];

    var filter = isUSorCAHouseNumberZero.create();

    test_stream(records, filter, function(err, actual) {
      t.deepEqual(actual, [], 'all should have been filtered out');
      t.end();
    });

  });

  t.test('house number reduceable to 0 in non-USA/CAN should return true', function(t) {
    var records = [
      {
        parent: {
          country_a: ['GBR']
        },
        address_parts: {
          number: '0'
        }
      },
      {
        parent: {
          country_a: ['GBR']
        },
        address_parts: {
          number: '00000'
        }
      }
    ];

    var filter = isUSorCAHouseNumberZero.create();

    test_stream(records, filter, function(err, actual) {
      t.deepEqual(actual, records, 'none should have been filtered out');
      t.end();
    });

  });

});
