const model = require('pelias-model');
const peliasDbclient = require('pelias-dbclient');
const blacklistStream = require('pelias-blacklist-stream');

const ContentHashStream = require('./streams/contentHashStream');
const ValidRecordFilterStream = require('./streams/validRecordFilterStream');
const CleanupStream = require('./streams/cleanupStream');
const DocumentStream = require('./streams/documentStream');
const gnafMapperStreamFactory = require('./streams/gnafMapperStream');
const unitSplittingMapperStreamFactory = require('./streams/unitSplittingMapperStream');
const isUSorCAHouseNumberZero = require('./streams/isUSorCAHouseNumberZero');

const adminLayers = ['neighbourhood', 'borough', 'locality', 'localadmin',
  'county', 'macrocounty', 'region', 'macroregion', 'dependency', 'country',
  'empire', 'continent'];

function defaultAdminLookupStream() {
  return require('pelias-wof-admin-lookup').create(adminLayers);
}

/**
 * Import a stream of OpenAddresses rows into Pelias elasticsearch.
 *
 * @param {stream.Readable} source rows, each carrying the file context
 *    attached by the row parser
 * @param {string} importerName the name this importer reports to dbclient
 * @param {stream.Transform} adminLookupStream adds admin values to each
 *    document (since OpenAddresses doesn't contain any), see
 *    https://github.com/pelias/admin-lookup
 */
function createFullImportPipeline( source, importerName, adminLookupStream ){
  const stats = { badRecordCount: 0 };

  return source
    .pipe(ContentHashStream.create())
    .pipe(ValidRecordFilterStream.create())
    .pipe(CleanupStream.create())
    .pipe(DocumentStream.create(stats))
    .pipe(gnafMapperStreamFactory())
    .pipe(unitSplittingMapperStreamFactory())
    .pipe(blacklistStream())
    .pipe(adminLookupStream || defaultAdminLookupStream())
    .pipe(isUSorCAHouseNumberZero.create())
    .pipe(model.createDocumentMapperStream())
    .pipe(peliasDbclient({name: importerName}));
}

module.exports = {
  create: createFullImportPipeline
};
