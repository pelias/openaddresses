var through = require( 'through2' );
var logger = require( 'pelias-logger' ).get( 'openaddresses' );
var peliasAdminLookup = require( 'pelias-wof-admin-lookup' );

function createAdminLookupStream(enable, peliasConfig) {
  if (enable) {
    logger.info( 'Setting up admin value lookup stream.' );
    var pipResolver = peliasAdminLookup.createWofPipResolver(peliasConfig.imports.adminLookup.url);
    return peliasAdminLookup.createLookupStream(pipResolver);
  } else {
    return through.obj(function (doc, enc, next) {
      next(null, doc);
    });
  }
}

module.exports = {
  create: createAdminLookupStream
};
