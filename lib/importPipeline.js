const logger = require('pelias-logger').get('openaddresses');
const recordStream = require('./streams/recordStream');
const model = require('pelias-model');
const peliasDbclient = require('pelias-dbclient');
const blacklistStream = require('pelias-blacklist-stream');
const isUSorCAHouseNumberZero = require('./streams/isUSorCAHouseNumberZero');

/**
 * Import all OpenAddresses CSV files in a directory into Pelias elasticsearch.
 *
 * @param {array of string} files An array of the absolute file-paths to import.
 * @param {object} opts Options to configure the import. Supports the following
 *    keys:
 *
 *      adminValues: Add admin values to each address object (since
 *        OpenAddresses doesn't contain any) using `admin-lookup`. See the
 *        documentation: https://github.com/pelias/admin-lookup
 */
function createFullImportPipeline( files, dirPath, adminLookupStream ){ // jshint ignore:line
  logger.info( 'Importing %s files.', files.length );

  recordStream.create(files, dirPath)
    .pipe(blacklistStream())
    .pipe(adminLookupStream)
    .pipe(isUSorCAHouseNumberZero.create())
    .pipe(model.createDocumentMapperStream())
    .pipe(peliasDbclient());
}

module.exports = {
  create: createFullImportPipeline
};
