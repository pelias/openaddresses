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

tape( 'documentStream catches records with no house number', function(test) {
  const input = {
    STREET: '101st Avenue'
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

tape( 'documentStream does not set unit if unit is emptystring', function(test) {
  const input = {
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6,
    UNIT: ''
  };
  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.equal(actual[0].getAddress('unit', undefined));
    test.end();
  });
});

tape( 'documentStream accepts null island', function(test) {
  const input = {
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 0,
    LON: 0
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

tape('documentStream with all properties set', function(test) {
  const input = {
    NUMBER: '5',
    STREET: '101st Avenue',
    LAT: 5,
    LON: 6,
    HASH: 'abcd',
    POSTCODE: '10000',
    UNIT: '1E',
    CITY: 'Test City',
    DISTRICT: 'Test District',
    REGION: 'Test Region'
  };

  const stats = { badRecordCount: 0 };
  const documentStream = DocumentStream.create('prefix', stats);

  test_stream([input], documentStream, function(err, actual) {
    test.equal(actual.length, 1, 'the document should be pushed' );
    test.equal(stats.badRecordCount, 0, 'bad record count unchanged');
    test.equal(actual[0].getId(), 'prefix:abcd');
    test.deepEqual(actual[0].getCentroid(), { lon: 6, lat: 5 });
    test.equal(actual[0].getAddress('street'), '101st Avenue');
    test.equal(actual[0].getAddress('zip'), '10000');
    test.equal(actual[0].getAddress('unit'), '1E');
    test.equal(actual[0].getMeta('city'), 'Test City');
    test.equal(actual[0].getMeta('district'), 'Test District');
    test.equal(actual[0].getMeta('region'), 'Test Region');
    test.end();
  });
});
