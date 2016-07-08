var through = require( 'through2' );
var logger = require( 'pelias-logger' ).get( 'openaddresses' );

function createAdminLookupStream(config,adminLookup) {
  // disable adminLookup with empty config
  if (!config.imports || !config.imports.openaddresses) {
    return through.obj(function (doc, enc, next) {
      next(null, doc);
    });
  }
  if (config.imports.openaddresses.adminLookup) {
    logger.info( 'Setting up admin value lookup stream.' );
    var pipResolver = adminLookup.createLocalWofPipResolver();
    return adminLookup.createLookupStream(pipResolver);
  } else {
    return through.obj(function (doc, enc, next) {
      next(null, doc);
    });
  }
}

module.exports = {
  create: createAdminLookupStream
};
