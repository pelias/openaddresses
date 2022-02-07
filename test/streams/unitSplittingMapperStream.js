var tape = require('tape');
const through = require('through2');
const mapper = require('../../lib/streams/unitSplittingMapperStream');
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

// ===================== australasian unit number mapping ======================

module.exports.tests.australasian_solidus = function (test) {
  var doc = new Document('oa', 'example', 1);
  doc.setName('default', '2/14 Smith Street');
  doc.setAddress('number', '2/14');
  doc.setAddress('street', 'Smith Street');
  doc.setMeta('country_code', 'AU');

  test('maps - split unit from housenumber', t => {
    var stream = mapper();
    stream.pipe(through.obj((doc, enc, next) => {
      t.deepEqual(doc.getName('default'), '14 Smith Street', 'unchanged');
      t.deepEqual(doc.getAddress('unit'), '2', 'mapped');
      t.deepEqual(doc.getAddress('number'), '14', 'mapped');
      t.deepEqual(doc.getAddress('street'), 'Smith Street', 'unchanged');
      t.end();
      next();
    }));
    stream.write(doc);
  });
};

module.exports.tests.australasian_solidus_with_whitespace = function (test) {
  var doc = new Document('oa', 'example', 1);
  doc.setName('default', '2 /  14 Smith Street');
  doc.setAddress('number', '2 /  14');
  doc.setAddress('street', 'Smith Street');
  doc.setMeta('country_code', 'AU');

  test('maps - split unit from housenumber', t => {
    var stream = mapper();
    stream.pipe(through.obj((doc, enc, next) => {
      t.deepEqual(doc.getName('default'), '14 Smith Street', 'unchanged');
      t.deepEqual(doc.getAddress('unit'), '2', 'mapped');
      t.deepEqual(doc.getAddress('number'), '14', 'mapped');
      t.deepEqual(doc.getAddress('street'), 'Smith Street', 'unchanged');
      t.end();
      next();
    }));
    stream.write(doc);
  });
};

module.exports.tests.australasian_flat_prefix = function (test) {
  var doc = new Document('oa', 'example', 1);
  doc.setName('default', 'Flat 2 14 Smith Street');
  doc.setAddress('number', 'Flat 2 14');
  doc.setAddress('street', 'Smith Street');
  doc.setMeta('country_code', 'AU');

  test('maps - split unit from housenumber', t => {
    var stream = mapper();
    stream.pipe(through.obj((doc, enc, next) => {
      t.deepEqual(doc.getName('default'), '14 Smith Street', 'unchanged');
      t.deepEqual(doc.getAddress('unit'), '2', 'mapped');
      t.deepEqual(doc.getAddress('number'), '14', 'mapped');
      t.deepEqual(doc.getAddress('street'), 'Smith Street', 'unchanged');
      t.end();
      next();
    }));
    stream.write(doc);
  });
};

module.exports.tests.australasian_flat_prefix_abbreviated = function (test) {
  var doc = new Document('oa', 'example', 1);
  doc.setName('default', 'F 2 14 Smith Street');
  doc.setAddress('number', 'F 2 14');
  doc.setAddress('street', 'Smith Street');
  doc.setMeta('country_code', 'AU');

  test('maps - split unit from housenumber', t => {
    var stream = mapper();
    stream.pipe(through.obj((doc, enc, next) => {
      t.deepEqual(doc.getName('default'), '14 Smith Street', 'unchanged');
      t.deepEqual(doc.getAddress('unit'), '2', 'mapped');
      t.deepEqual(doc.getAddress('number'), '14', 'mapped');
      t.deepEqual(doc.getAddress('street'), 'Smith Street', 'unchanged');
      t.end();
      next();
    }));
    stream.write(doc);
  });
};

module.exports.tests.australasian_unit_prefix = function (test) {
  var doc = new Document('oa', 'example', 1);
  doc.setName('default', 'Unit 2 14 Smith Street');
  doc.setAddress('number', 'Unit 2 14');
  doc.setAddress('street', 'Smith Street');
  doc.setMeta('country_code', 'AU');

  test('maps - split unit from housenumber', t => {
    var stream = mapper();
    stream.pipe(through.obj((doc, enc, next) => {
      t.deepEqual(doc.getName('default'), '14 Smith Street', 'unchanged');
      t.deepEqual(doc.getAddress('unit'), '2', 'mapped');
      t.deepEqual(doc.getAddress('number'), '14', 'mapped');
      t.deepEqual(doc.getAddress('street'), 'Smith Street', 'unchanged');
      t.end();
      next();
    }));
    stream.write(doc);
  });
};

module.exports.tests.australasian_apartment_prefix = function (test) {
  var doc = new Document('oa', 'example', 1);
  doc.setName('default', 'Apartment 2 14 Smith Street');
  doc.setAddress('number', 'Apartment 2 14');
  doc.setAddress('street', 'Smith Street');
  doc.setMeta('country_code', 'AU');

  test('maps - split unit from housenumber', t => {
    var stream = mapper();
    stream.pipe(through.obj((doc, enc, next) => {
      t.deepEqual(doc.getName('default'), '14 Smith Street', 'unchanged');
      t.deepEqual(doc.getAddress('unit'), '2', 'mapped');
      t.deepEqual(doc.getAddress('number'), '14', 'mapped');
      t.deepEqual(doc.getAddress('street'), 'Smith Street', 'unchanged');
      t.end();
      next();
    }));
    stream.write(doc);
  });
};

module.exports.tests.australasian_apartment_prefix_abbreviated = function (test) {
  var doc = new Document('oa', 'example', 1);
  doc.setName('default', 'APT 2 14 Smith Street');
  doc.setAddress('number', 'APT 2 14');
  doc.setAddress('street', 'Smith Street');
  doc.setMeta('country_code', 'AU');

  test('maps - split unit from housenumber', t => {
    var stream = mapper();
    stream.pipe(through.obj((doc, enc, next) => {
      t.deepEqual(doc.getName('default'), '14 Smith Street', 'unchanged');
      t.deepEqual(doc.getAddress('unit'), '2', 'mapped');
      t.deepEqual(doc.getAddress('number'), '14', 'mapped');
      t.deepEqual(doc.getAddress('street'), 'Smith Street', 'unchanged');
      t.end();
      next();
    }));
    stream.write(doc);
  });
};

module.exports.tests.australasian_allow_no_space_after_flat_designation = function (test) {
  var doc = new Document('oa', 'example', 1);
  doc.setName('default', 'APT2 14 Smith Street'); // note: 'APT2' concatenated
  doc.setAddress('number', 'APT2 14');
  doc.setAddress('street', 'Smith Street');
  doc.setMeta('country_code', 'AU');

  test('maps - split unit from housenumber', t => {
    var stream = mapper();
    stream.pipe(through.obj((doc, enc, next) => {
      t.deepEqual(doc.getName('default'), '14 Smith Street', 'unchanged');
      t.deepEqual(doc.getAddress('unit'), '2', 'mapped');
      t.deepEqual(doc.getAddress('number'), '14', 'mapped');
      t.deepEqual(doc.getAddress('street'), 'Smith Street', 'unchanged');
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
