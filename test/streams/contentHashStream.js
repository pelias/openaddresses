const tape = require('tape');
const event_stream = require('event-stream');
const ContentHashStream = require('../../lib/streams/contentHashStream');
const hash = ContentHashStream.hash;
const DEFAULT_HASH = 'd41d8cd98f00b204';

function test_stream(input, testedStream, callback) {
  var input_stream = event_stream.readArray(input);
  var destination_stream = event_stream.writeArray(callback);

  input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('contentHashStream generates new hash', function (test) {
  var input = {
    NUMBER: '5',
    STREET: 'Abcd',
    LAT: 5,
    LON: 6,
    POSTCODE: 'def'
  };

  var contentHashStream = ContentHashStream.create();

  test_stream([input], contentHashStream, function (err, records) {
    test.equal(records.length, 1, 'stream length unchanged');

    var record = records[0];
    test.equal(record.HASH, 'c2f8c35aa279ee7d', 'HASH field generated');
    test.end();
  });
});

tape('contentHashStream replaces existing hash', function (test) {
  var input = {
    NUMBER: '5 ',
    STREET: ' Abcd ',
    LAT: 5,
    LON: 6,
    POSTCODE: ' def ',
    HASH: '54830a0a5bbbca8f'
  };

  var contentHashStream = ContentHashStream.create();

  test_stream([input], contentHashStream, function (err, records) {
    test.equal(records.length, 1, 'stream length unchanged');

    var record = records[0];
    test.equal(record.HASH, 'c2f8c35aa279ee7d', 'HASH field generated');
    test.end();
  });
});

tape('hash: default value for non-object and empty objects', function (test) {
  test.equal(hash(null), DEFAULT_HASH);
  test.equal(hash(1), DEFAULT_HASH);
  test.equal(hash(false), DEFAULT_HASH);
  test.equal(hash('string'), DEFAULT_HASH);
  test.equal(hash([]), DEFAULT_HASH);
  test.equal(hash({}), DEFAULT_HASH);
  test.end();
});

tape('hash: 16 hexidecimal chars', function (test) {
  const h = hash({ field: 'value' });
  test.true(/[0-9A-Fa-f]{16}/g.test(h));
  test.end();
});

tape('hash: strict equality', function (test) {
  test.equal(
    hash({ field1: 'A', field2: 'B' }),
    hash({ field1: 'A', field2: 'B' })
  );
  test.end();
});

tape('hash: ingore existing hash field', function (test) {
  test.equal(
    hash({ field1: 'A', field2: 'B', hash: 'c2f8c35aa279ee7d' }),
    hash({ field1: 'A', field2: 'B', HASH: 'deadb33fdeadb33f' })
  );
  test.end();
});

tape('hash: fuzzy equality', function (test) {
  test.equal(
    hash({ field1: 'A' }),
    hash({ FIELD1: 'A' }),
    'key case'
  );
  test.equal(
    hash({ field1: 'A' }),
    hash({ field1: 'a' }),
    'value case'
  );
  test.equal(
    hash({ field1: 'A' }),
    hash({ field1: ' A ' }),
    'value whitespace'
  );
  test.equal(
    hash({ field1: 1 }),
    hash({ field1: '1' }),
    'value type'
  );
  test.end();
});

tape('hash: strict inequality', function (test) {
  test.notEqual(
    hash({ field1: 'A', field2: 'B' }),
    hash({ field1: 'A', field9: 'B' })
  );
  test.end();
});
