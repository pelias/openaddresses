var through2 = require( 'through2' );
var _ = require('lodash');

var cleanup = require( '../cleanup' );

/*
 * create a stream that performs any needed cleanup on a record
 */

function createCleanupStream() {
  return through2.obj(function( record, enc, next ) {
    record.STREET = cleanup.streetName( record.STREET );

    // csvParse will only trim unquoted fields
    // so we have to do it ourselves to handle all whitespace
    Object.keys(record).forEach(function(key) {
      if (typeof record[key].trim === 'function') {
        record[key] = record[key].trim();
      }
    });

    record.NUMBER = _.trimStart(record.NUMBER, '0');

    next(null, record);
  });
}

module.exports = {
  create: createCleanupStream
};
