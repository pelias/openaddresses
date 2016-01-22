var logger = require( 'pelias-logger' ).get( 'openaddresses' );
var peliasConfig = require( 'pelias-config' ).generate();
var adminLookupStream = require('./streams/adminLookupStream');
var deduplicatorStream = require('./streams/deduplicatorStream');
var recordStream = require('./streams/recordStream');
var elasticsearchStream = require('./streams/elasticsearchStream');

/**
 * Import all OpenAddresses CSV files in a directory into Pelias elasticsearch.
 *
 * @param {array of string} files An array of the absolute file-paths to import.
 * @param {object} opts Options to configure the import. Supports the following
 *    keys:
 *
 *      deduplicate: Pass address object through `address-deduplicator-stream`
 *        to perform deduplication. See the documentation:
 *        https://github.com/pelias/address-deduplicator-stream
 *
 *      adminValues: Add admin values to each address object (since
 *        OpenAddresses doesn't contain any) using `admin-lookup`. See the
 *        documentation: https://github.com/pelias/admin-lookup
 */
function createFullImportPipeline( files, opts ){
  logger.info( 'Importing %s files.', files.length );
  var pipeline = [ recordStream.create(files) ];

  if( opts.deduplicate ){
    pipeline.push(deduplicatorStream.create());
  }

  if( opts.adminValues ){
    pipeline.push(adminLookupStream.create());
  }

  pipeline.push(elasticsearchStream.create());

  // start the import process by piping all the streams appropriately
  for(var i = 0; i < pipeline.length - 1; i++) {
    pipeline[i].pipe(pipeline[i+1]);
  }
}

module.exports = {
  create: createFullImportPipeline
};
