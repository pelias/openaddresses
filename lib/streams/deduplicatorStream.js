var through = require( 'through2' );
var logger = require( 'pelias-logger' ).get( 'openaddresses' );

function createDeduplicatorStream(config,dedupe) {
  if (!config.imports || !config.imports.openaddresses) {
    return through.obj(function (doc, enc, next) {
      next(null, doc);
    });
  }
  if (config.imports.openaddresses.deduplicate) {
    logger.info( 'Setting up deduplicator.' );
    return dedupe();
  } else {
    return through.obj(function (doc, enc, next) {
      next(null, doc);
    });
  }
}

module.exports = {
  create: createDeduplicatorStream
};
