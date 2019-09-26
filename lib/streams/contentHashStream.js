const _ = require('lodash');
const crypto = require('crypto');
const through2 = require('through2');

/*
 * create a stream that generates a content-hash for each row
 */

function createContentHashStream() {
  return through2.obj((record, enc, next) => {
    record.HASH = hash(record);
    next(null, record);
  });
}

const normalize = {
  float: (fl) => (Math.floor(parseFloat(fl||0.0)*1e7)/1e7).toFixed(7),
  string: (str) => (str||'').toString().replace(/\s+/g, ' ').trim().toLowerCase()
};

const fields = [
  { key: 'LON', norm: normalize.float },
  { key: 'LAT', norm: normalize.float },
  { key: 'STREET', norm: normalize.string },
  { key: 'NUMBER', norm: normalize.string },
  { key: 'UNIT', norm: normalize.string }
];

function hash( record ) {
  // md5 is actually 512 bits, we only need 256 bits to match the 16x hex char
  // uuid4 implementation used by the openaddresses project, so half are discarded.
  // it was chosen due to its universal availability and maturity.
  // note: this algo need not be cryptographically secure, it's just more
  // convenient and reliable to use this method than using other methods.
  const h = crypto.createHash('md5');

  // see: https://github.com/pelias/openaddresses/pull/442#issuecomment-535399779
  fields.forEach( field => {
    // write a null byte in place of an empty value
    // in order to preserve column positions.
    let str = '\0';
    if (_.has(record, field.key)) {
      str = field.norm(_.get(record, field.key));
    }
    h.update(str);
  });

  // return a hexidecimal representation
  return h.digest('hex').substr(0, 16);
}

module.exports = {
  create: createContentHashStream,
  hash: hash
};
