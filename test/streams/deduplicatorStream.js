var sink = require('through2-sink');
var deduper = require('../../lib/streams/deduplicatorStream').create;
var tape = require('tape');

tape('enabled: return deduper stream',function (t){
  var config = {
    imports: {
      openaddresses: {
        deduplicate: true
      }
    }
  };

  var deduperStream = { some: 'stream' };
  var deduperStreamFactory = function () {
    return deduperStream;
  };


  var stream = deduper(config, deduperStreamFactory);
  t.equal(stream, deduperStream, 'stream created');
  t.end();

  });

tape('disabled: return passthrough stream', function(t) {
    var config = {
    imports: {
      openaddresses: {
        deduplicate: false
      }
    }
  };

    t.plan(2); // expect 2 assertions

    var dataItem = { some: 'data' };

    var stream = deduper(config, {});

    t.equal(typeof stream, 'object', 'disabled stream is an object');

    stream.pipe(sink.obj( function (doc) {
      t.deepEqual(doc, dataItem);
      t.end();
    }));

    stream.write(dataItem);
  });

  tape('absence of config.imports should return pass-through stream', function(t) {
    var config = {};

    var dataItem = { some: 'data' };

    var stream = deduper(config, {});

    t.equal(typeof stream, 'object', 'disabled stream is an object');

    stream.pipe(sink.obj( function (doc) {
      t.deepEqual(doc, dataItem);
      t.end();
    }));

    stream.write(dataItem);
  });

  tape('absence of config.imports.openaddresses should return pass-through stream', function(t) {
    var config = {
      imports: {}
    };

    var dataItem = { some: 'data' };

    var stream = deduper(config, {});

    t.equal(typeof stream, 'object', 'disabled stream is an object');

    stream.pipe(sink.obj( function (doc) {
      t.deepEqual(doc, dataItem);
      t.end();
    }));

    stream.write(dataItem);
  });
