var through = require( 'through2' );

var logger = require( 'pelias-logger' ).get( 'openaddresses' );
var isValidCsvRecord = require('../isValidCsvRecord');

/*
 * Create a through2 stream to filter out invalid records
 */
function createValidRecordFilterStream() {
  var invalidCount = 0;
  return through.obj(function( record, enc, next ) {
    if (isValidCsvRecord(record)) {
      this.push(record);
    } else {
      invalidCount++;
    }
    next();
  }, function(next) {
    logger.verbose('number of invalid records skipped: ' + invalidCount);
    next();
  });
}

module.exports = {
  create: createValidRecordFilterStream
};
