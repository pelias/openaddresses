const tape = require( 'tape' );

const stream_mock = require('stream-mock');

const DocumentStream = require( '../../lib/streams/documentStream' );
const fileContext = require( '../../lib/fileContext' );

// rows arrive with the context of the file they were read from
function fromFile(record, idPrefix, uid) {
  return fileContext.attach(record, fileContext.create(`/data/${idPrefix}.csv`, idPrefix), uid);
}

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
  const documentStream = DocumentStream.create(stats);

  test_stream([fromFile(input, 'prefix')], documentStream, function(err, actual) {
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
  const documentStream = DocumentStream.create(stats);

  test_stream([fromFile(input, 'prefix')], documentStream, function(err, actual) {
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
    POSTCODE: '',
    HASH: '1234'
  };

  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create(stats);

  test_stream([fromFile(input, 'prefix')], documentStream, function(err, actual) {
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.equal(actual[0].getId(), 'prefix:1234');
    test.equal(actual[0].getMeta('file'), '/data/prefix.csv', 'source file stored in meta');
    test.end();
  });
});

tape('documentStream falls back to the row uid when there is no HASH', function(test) {
  const input = { NUMBER: '5', STREET: '101st Avenue', LAT: 5, LON: 6 };
  const stats = { badRecordCount: 0 };

  test_stream([
    fromFile(Object.assign({}, input), 'prefix', '3-7'),
    fromFile(Object.assign({ HASH: 'abcd' }, input), 'prefix', '3-8')
  ], DocumentStream.create(stats), function(err, actual) {
    test.deepEqual(actual.map((doc) => doc.getId()), ['prefix:3-7', 'prefix:abcd'], 'HASH is preferred');
    test.end();
  });
});

tape('documentStream handles rows from different files in one stream', function(test) {
  const input = { NUMBER: '5', STREET: '101st Avenue', LAT: 5, LON: 6, HASH: 'abcd' };
  const stats = { badRecordCount: 0 };

  test_stream([
    fromFile(Object.assign({}, input), 'au/one'),
    fromFile(Object.assign({}, input), 'us/two')
  ], DocumentStream.create(stats), function(err, actual) {
    test.deepEqual(actual.map((doc) => doc.getId()), ['au/one:abcd', 'us/two:abcd']);
    test.deepEqual(actual.map((doc) => doc.getMeta('country_code')), ['AU', 'US']);
    test.end();
  });
});

tape('documentStream rejects records without file context', function(test) {
  const stats = { badRecordCount: 0 };

  const input = { NUMBER: '5', STREET: '101st Avenue', LAT: 5, LON: 6 };

  test_stream([input], DocumentStream.create(stats), function(err, actual) {
    test.equal(actual.length, 0, 'no documents should be pushed');
    test.equal(stats.badRecordCount, 1, 'bad record count updated');
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
  const documentStream = DocumentStream.create(stats);

  test_stream([fromFile(input, 'prefix')], documentStream, function(err, actual) {
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
  const documentStream = DocumentStream.create(stats);

  test_stream([fromFile(input, 'au/example')], documentStream, function (err, actual) {
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
  const documentStream = DocumentStream.create(stats);

  test_stream([fromFile(input, 'AU/example')], documentStream, function (err, actual) {
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
  const documentStream = DocumentStream.create(stats); // note: does not match pattern

  test_stream([fromFile(input, 'foo/example')], documentStream, function (err, actual) {
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
  const documentStream = DocumentStream.create(stats);

  test_stream([fromFile(input, 'example')], documentStream, function (err, actual) {
    test.equal(actual.length, 1, 'the document should be pushed');
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.deepEqual(actual[0].getMeta('oa'), input, 'OA reference stored in meta');
    test.end();
  });
});
