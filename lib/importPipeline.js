var logger = require( 'pelias-logger' ).get( 'openaddresses' );
var recordStream = require('./streams/recordStream');
var model = require( 'pelias-model' );
var peliasDbclient = require( 'pelias-dbclient' );
var isUSorCAHouseNumberZero = require( './streams/isUSorCAHouseNumberZero' );

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
function createFullImportPipeline( files, opts, deduplicatorStream, adminLookupStream ){
  logger.info( 'Importing %s files.', files.length );

  var finalStream = peliasDbclient({
    merge: opts.merge,
    mergeFields: opts.mergeFields,
    mergeAssignFrom: ['name'],
    mergeAssignTo: ['phrase']
  });
  recordStream.create(files, opts.dirPath, opts.language)
    .pipe(deduplicatorStream)
    .pipe(adminLookupStream)
    .pipe(isUSorCAHouseNumberZero.create())
    .pipe(model.createDocumentMapperStream())
    .pipe(finalStream);
}

module.exports = {
  create: createFullImportPipeline
};
