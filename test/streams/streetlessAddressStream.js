const tape = require('tape');
const stream_mock = require('stream-mock');
const StreetlessAddressStream = require('../../lib/streams/streetlessAddressStream');

function test_stream(input, testedStream, callback) {
  const reader = new stream_mock.ObjectReadableMock(input);
  const writer = new stream_mock.ObjectWritableMock();
  writer.on('error', (e) => callback(e));
  writer.on('finish', () => callback(null, writer.data));
  reader.pipe(testedStream).pipe(writer);
}

tape('streetlessAddressStream copies CITY to STREET', function (test) {
  var input = {
    NUMBER: '5',
    LAT: 5,
    LON: 6,
    CITY: 'example city'
  };

  var streetlessAddressStream = StreetlessAddressStream.create();

  test_stream([input], streetlessAddressStream, function (err, records) {
    test.equal(records.length, 1, '1 record emitted');

    var record = records[0];
    test.equal(record.STREET, 'example city', 'STREET field generated');
    test.end();
  });
});
