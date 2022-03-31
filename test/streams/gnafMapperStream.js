var tape = require('tape');
const through = require('through2');
const mapper = require('../../lib/streams/gnafMapperStream');
const Document = require('pelias-model').Document;

module.exports.tests = {};

// test exports
module.exports.tests.interface = function (test) {
  test('interface: factory', t => {
    t.equal(typeof mapper, 'function', 'stream factory');
    t.end();
  });
  test('interface: stream', t => {
    var stream = mapper();
    t.equal(typeof stream, 'object', 'valid stream');
    t.equal(typeof stream._read, 'function', 'valid readable');
    t.equal(typeof stream._write, 'function', 'valid writeable');
    t.end();
  });
};

// ===================== GNAF ID mapping ======================

module.exports.tests.au_gnaf_id = function (test) {
  var doc = new Document('oa', 'a', 1);
  doc.setMeta('country_code', 'AU');
  doc.setMeta('oa', {
    ID: 'GAVIC411412475',
    NUMBER: '360',
    STREET: 'BRUNSWICK STREET',
    LAT: -37.79647546,
    LON: 144.978997
  });
  test('maps - GNAF ID', t => {
    var stream = mapper();
    stream.pipe(through.obj((doc, enc, next) => {
      t.deepEqual(doc.getAddendum('concordances'), { 'gnaf:pid': 'GAVIC411412475' }, 'correctly mapped');
      t.end();
      next();
    }));
    stream.write(doc);
  });
};

module.exports.tests.au_invalid_gnaf_id = function (test) {
  var doc = new Document('oa', 'a', 1);
  doc.setMeta('country_code', 'AU');
  doc.setMeta('oa', {
    ID: 'invalid', // note: invalid GNAF ID
    NUMBER: '360',
    STREET: 'BRUNSWICK STREET',
    LAT: -37.79647546,
    LON: 144.978997
  });
  test('maps - GNAF ID', t => {
    var stream = mapper();
    stream.pipe(through.obj((doc, enc, next) => {
      t.deepEqual(doc.getAddendum('concordances'), undefined);
      t.end();
      next();
    }));
    stream.write(doc);
  });
};

module.exports.tests.au_missing_id_field = function (test) {
  var doc = new Document('oa', 'a', 1);
  doc.setMeta('country_code', 'AU');
  doc.setMeta('oa', {
    ID: undefined, // note: missing ID field
    NUMBER: '360',
    STREET: 'BRUNSWICK STREET',
    LAT: -37.79647546,
    LON: 144.978997
  });
  test('maps - GNAF ID', t => {
    var stream = mapper();
    stream.pipe(through.obj((doc, enc, next) => {
      t.deepEqual(doc.getAddendum('concordances'), undefined);
      t.end();
      next();
    }));
    stream.write(doc);
  });
};

module.exports.tests.non_au_gnaf_id = function (test) {
  var doc = new Document('oa', 'a', 1);
  doc.setMeta('country_code', 'NZ'); // note: country code not AU
  doc.setMeta('oa', {
    ID: 'GAVIC411412475',
    NUMBER: '360',
    STREET: 'BRUNSWICK STREET',
    LAT: -37.79647546,
    LON: 144.978997
  });
  test('maps - GNAF ID', t => {
    var stream = mapper();
    stream.pipe(through.obj((doc, enc, next) => {
      t.deepEqual(doc.getAddendum('concordances'), undefined);
      t.end();
      next();
    }));
    stream.write(doc);
  });
};


function test(name, testFunction) {
  return tape('unit_splitting_mapper: ' + name, testFunction);
}

for (var testCase in module.exports.tests) {
  module.exports.tests[testCase](test);
}
