var through = require( 'through2' );
var addressDeduplicatorStream = require( 'pelias-address-deduplicator' );
var logger = require( 'pelias-logger' ).get( 'openaddresses' );

function createDeduplicatorStream(enable) {
  if (enable) {
    logger.info( 'Setting up deduplicator.' );
    return addressDeduplicatorStream();
  } else {
    return through.obj(function (doc, enc, next) {
      next(null, doc);
    });
  }
}

module.exports = {
  create: createDeduplicatorStream
};
