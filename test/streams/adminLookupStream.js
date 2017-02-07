const tape = require('tape');
const event_stream = require('event-stream');
const through = require('through2');
const proxyquire = require('proxyquire').noCallThru();

const adminLookupStream = require('../../lib/streams/adminLookupStream').create;

function test_stream(input, testedStream, callback) {
    const input_stream = event_stream.readArray(input);
    const destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

/*
 * There was a bug (https://github.com/pelias/wof-admin-lookup/issues/51) where admin lookup could
 * not be enabled without the adminLookup config section
 */
tape('enabled without any special adminLookup config: return pip stream', function (t) {
  const config = {
    imports: {
      openaddresses: {
        adminLookup: true
      }
    }
  };

  const infoMessages = [];

  const stream = proxyquire('../../lib/streams/adminLookupStream', {
    'pelias-wof-admin-lookup': {
      createLookupStream: () => {
        return through.obj(function (doc, enc, next) {
          doc.field2 = 'value 2';
          next(null, doc);
        });
      }
    },
    'pelias-logger': {
      get: (log_module) => {
        t.equal(log_module, 'openaddresses');
        return {
          info: (message) => {
            infoMessages.push(message);
          }
        };
      }
    }
  }).create(config);

  const input = {
    field1: 'value 1'
  };

  const expected = {
    field1: 'value 1',
    field2: 'value 2'
  };

  test_stream([input], stream, (err, actual) => {
    t.deepEqual(actual, [expected], 'should have changed');
    t.deepEqual(infoMessages, ['Setting up admin value lookup stream.']);
    t.end();
  });

});

tape('absence of config.imports should return pass-through stream', function(t) {
  const config = {};

  const input = {
    some: 'data'
  };

  const stream = adminLookupStream(config);

  test_stream([input], stream, (err, actual) => {
    t.deepEqual(actual, [input], 'nothing should have changed');
    t.end();
  });

});

tape('absence of config.imports.openaddresses should return pass-through stream', function(t) {
  const config = {
    imports: {}
  };

  const input = {
    some: 'data'
  };

  const stream = adminLookupStream(config);

  test_stream([input], stream, (err, actual) => {
    t.deepEqual(actual, [input], 'nothing should have changed');
    t.end();
  });

});

tape('disabled: return passthrough stream', function(t) {
  const config = {
    imports: {
      openaddresses: {
        adminLookup: false
      }
    }
  };

  const input = {
    some: 'data'
  };

  const stream = adminLookupStream(config);

  test_stream([input], stream, (err, actual) => {
    t.deepEqual(actual, [input], 'nothing should have changed');
    t.end();
  });

});
