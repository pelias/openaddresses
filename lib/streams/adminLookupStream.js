var logger = require( 'pelias-logger' ).get( 'openaddresses' );
var peliasAdminLookup = require( 'pelias-wof-admin-lookup' );

function createAdminLookupStream(peliasConfig) {
  logger.info( 'Setting up admin value lookup stream.' );
  var pipResolver = peliasAdminLookup.createWofPipResolver(peliasConfig.imports.adminLookup.url);
  return peliasAdminLookup.createLookupStream(pipResolver);
}

module.exports = {
  create: createAdminLookupStream
};
