const logger = require('pelias-logger').get('openaddresses');
const through2 = require( 'through2' );
const _ = require('lodash');

const cleanup = require( '../cleanup' );

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

    // track addresses where the entire housenumber can be reduced to 0
    const trimmedNumber = _.trimStart(record.NUMBER, '0');
    if (_.isEmpty(trimmedNumber)) {
      logger.info('[cleanup_stream] housenumber==0');
    }

    next(null, record);
  });
}

module.exports = {
  create: createCleanupStream
};
