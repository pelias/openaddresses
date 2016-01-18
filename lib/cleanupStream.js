var through2 = require( 'through2' );

var cleanup = require( './cleanup' );

/*
 * create a stream that performs any needed cleanup on a record
 */

function createCleanupStream() {
  return through2.obj(function( record, enc, next ) {
    record.STREET = cleanup.streetName( record.STREET );

    next(null, record);
  });
}

module.exports = {
  createCleanupStream: createCleanupStream
};
