var addressDeduplicatorStream = require( 'pelias-address-deduplicator' );
var logger = require( 'pelias-logger' ).get( 'openaddresses' );

function createDeduplicatorStream() {
  logger.info( 'Setting up deduplicator.' );
  return addressDeduplicatorStream();
}

module.exports = {
  create: createDeduplicatorStream
};
