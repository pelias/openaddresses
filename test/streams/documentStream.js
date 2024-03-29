const tape = require( 'tape' );

const stream_mock = require('stream-mock');

const DocumentStream = require( '../../lib/streams/documentStream' );

function test_stream(input, testedStream, callback) {
  const reader = new stream_mock.ObjectReadableMock(input);
  const writer = new stream_mock.ObjectWritableMock();
  writer.on('error', (e) => callback(e));
  writer.on('finish', () => callback(null, writer.data));
  reader.pipe(testedStream).pipe(writer);
}

tape( 'documentStream catches records with no street', function(test) {
  const input = {
    NUMBER: 5
  };
  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual.length, 0, 'no documents should be pushed' );
    test.equal(stats.badRecordCount, 1, 'bad record count updated');
    test.end();
  });
});

tape( 'documentStream does not set zipcode if zipcode is emptystring', function(test) {
  const input = {
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6,
    POSTCODE: ''
  };
  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.equal(actual[0].getAddress('zip'), undefined);
    test.end();
  });
});

tape( 'documentStream creates id with filename-based prefix', function(test) {
  const input = {
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6,
    POSTCODE: ''
  };

  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.equal(actual[0].getId(), 'prefix:0');
    test.end();
  });
});

tape('documentStream uses HASH value if present', function(test) {
  const input = {
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6,
    HASH: 'abcd'
  };

  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.equal(actual[0].getId(), 'prefix:abcd');
    test.end();
  });
});

tape('documentStream valid country_code lowercase', function (test) {
  const input = {
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6,
    HASH: 'abcd'
  };
  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('au/example', stats);

  test_stream([input], documentStream, function (err, actual) {
    test.equal(actual.length, 1, 'the document should be pushed');
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.deepEqual(actual[0].getMeta('country_code'), 'AU', 'country_code set');
    test.end();
  });
});

tape('documentStream valid country_code uppercase', function (test) {
  const input = {
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6,
    HASH: 'abcd'
  };
  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('AU/example', stats);

  test_stream([input], documentStream, function (err, actual) {
    test.equal(actual.length, 1, 'the document should be pushed');
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.deepEqual(actual[0].getMeta('country_code'), 'AU', 'country_code set');
    test.end();
  });
});

tape('documentStream invalid country_code', function (test) {
  const input = {
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6,
    HASH: 'abcd'
  };
  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('foo/example', stats); // note: does not match pattern

  test_stream([input], documentStream, function (err, actual) {
    test.equal(actual.length, 1, 'the document should be pushed');
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.deepEqual(actual[0].getMeta('country_code'), undefined, 'country_code not set');
    test.end();
  });
});

tape('documentStream store reference to OA object in meta', function (test) {
  const input = {
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6,
    HASH: 'abcd'
  };
  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('example', stats);

  test_stream([input], documentStream, function (err, actual) {
    test.equal(actual.length, 1, 'the document should be pushed');
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.deepEqual(actual[0].getMeta('oa'), input, 'OA reference stored in meta');
    test.end();
  });
});
