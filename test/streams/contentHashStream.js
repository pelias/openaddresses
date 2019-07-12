const tape = require('tape');
const stream_mock = require('stream-mock');
const ContentHashStream = require('../../lib/streams/contentHashStream');
const hash = ContentHashStream.hash;
const DEFAULT_HASH = 'ca9c491ac66b2c62';

function test_stream(input, testedStream, callback) {
  const reader = new stream_mock.ObjectReadableMock(input);
  const writer = new stream_mock.ObjectWritableMock();
  writer.on('error', (e) => callback(e));
  writer.on('finish', () => callback(null, writer.data));
  reader.pipe(testedStream).pipe(writer);
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
    test.equal(record.HASH, 'f44048507e8fb319', 'HASH field generated');
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
    test.equal(record.HASH, 'f44048507e8fb319', 'HASH field generated');
    test.end();
  });
});

tape('hash: default value for non-object and empty objects', function (test) {
  test.equal(hash(null), DEFAULT_HASH, 'default hash');
  test.equal(hash(1), DEFAULT_HASH, 'default hash');
  test.equal(hash(false), DEFAULT_HASH, 'default hash');
  test.equal(hash('string'), DEFAULT_HASH, 'default hash');
  test.equal(hash([]), DEFAULT_HASH, 'default hash');
  test.equal(hash({}), DEFAULT_HASH, 'default hash');
  test.end();
});

tape('hash: 16 lowercase hexidecimal chars', function (test) {
  const conform = /^[0-9a-f]{16}$/;
  for( let i=-90.0; i<+90.0; i+=0.5 ){
    let h = hash({ LON: i, LAT: i });
    test.true(conform.test(h), h);
  }
  test.end();
});

tape('hash: strict equality', function (test) {
  test.equal(
    hash({ LON: '1.1', LAT: '2.2' }),
    hash({ LON: '1.1', LAT: '2.2' })
  );
  test.equal(
    hash({ LON: '1.1', LAT: '2.2', STREET: 'A ST' }),
    hash({ LON: '1.1', LAT: '2.2', STREET: 'A ST' })
  );
  test.equal(
    hash({ LON: '1.1', LAT: '2.2', STREET: 'A ST', NUMBER: '10' }),
    hash({ LON: '1.1', LAT: '2.2', STREET: 'A ST', NUMBER: '10' })
  );
  test.equal(
    hash({ LON: '1.1', LAT: '2.2', STREET: 'A ST', NUMBER: '10', UNIT: '6B' }),
    hash({ LON: '1.1', LAT: '2.2', STREET: 'A ST', NUMBER: '10', UNIT: '6B' })
  );
  test.end();
});

tape('hash: ingore existing hash field', function (test) {
  test.equal(
    hash({ LON: '1.1', LAT: '2.2', HASH: 'c2f8c35aa279ee7d' }),
    hash({ LON: '1.1', LAT: '2.2', HASH: 'deadb33fdeadb33f' })
  );
  test.end();
});

tape('hash: fuzzy equality', function (test) {
  test.equal(
    hash({ STREET: 'A ST' }),
    hash({ STREET: 'a st' }),
    'value case'
  );
  test.equal(
    hash({ STREET: 'A ST' }),
    hash({ STREET: ' A  ST  ' }),
    'value whitespace'
  );
  test.equal(
    hash({ STREET: 1 }),
    hash({ STREET: '1' }),
    'value type'
  );
  test.equal(
    hash({ LON: 1.123456789 }),
    hash({ LON: 1.1234567 }),
    'float precision'
  );
  test.equal(
    hash({ LON: 1.12000000000 }),
    hash({ LON: 1.12 }),
    'float precision'
  );
  test.equal(
    hash({ LON: -1.000000000000 }),
    hash({ LON: -1 }),
    'float precision'
  );
  test.equal(
    hash({ LON: 0 }),
    hash({ LON: -0 }),
    'negative zero'
  );
  test.end();
});

tape('hash: strict inequality', function (test) {
  test.notEqual(
    hash({ LON: '1.1', LAT: '2.2', STREET: 'A ST', NUMBER: '10', UNIT: '6B' }),
    hash({ LON: '1.1', LAT: '2.2', STREET: 'A ST', NUMBER: '10', UNIT: '6' })
  );
  test.notEqual(
    hash({ LON: '1.1', LAT: '2.2', STREET: 'A ST', NUMBER: '10' }),
    hash({ LON: '1.1', LAT: '2.2', STREET: 'A ST', NUMBER: '11' })
  );
  test.notEqual(
    hash({ LON: '1.1', LAT: '2.2', STREET: 'A ST' }),
    hash({ LON: '1.1', LAT: '2.2', STREET: 'A RD' })
  );
  test.notEqual(
    hash({ LON: '1.1', LAT: '2.2' }),
    hash({ LON: '1.1', LAT: '2.1' })
  );
  test.notEqual(
    hash({ LON: '1.1' }),
    hash({ LON: '-1.1' })
  );
  test.notEqual(
    hash({ NUMBER: '10' }),
    hash({ UNIT: '10' })
  );
  test.end();
});
