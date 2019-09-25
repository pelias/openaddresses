const _ = require('lodash');
const crypto = require('crypto');
const through2 = require('through2');

/*
 * create a stream that generates a content-hash for each row
 */

function createContentHashStream() {
  return through2.obj(function (record, enc, next) {
    record.HASH = hash(record);
    next(null, record);
  });
}

function hash( record ) {
  // md5 is actually 512 bits, we only need 256 bits to match the 16x hex char
  // uuid4 implementation used by the openaddresses project, so half are discarded.
  // it was chosen due to its universal availability and maturity.
  // note: this algo need not be cryptographically secure, it's just more
  // convenient and reliable to use this method than using other methods.
  const h = crypto.createHash('md5');

  // iterate over object properties, adding them to the content-hash
  if( _.isObject( record ) ){
    _.map( record, (v, k) => {
      const key = k.toString().trim().toLowerCase();
      const val = v.toString().trim().toLowerCase();
      if (key === 'hash') { return; } // ignore any existing hash property
      h.update(`${key}:${val}`);
    });
  }

  // return a hexidecimal representation
  return h.digest('hex').substr(0, 16);
}

module.exports = {
  create: createContentHashStream,
  hash: hash
};
