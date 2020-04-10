const fs = require( 'fs' );
const path = require( 'path' );

const csvParse = require( 'csv-parse' );
const combinedStream = require( 'combined-stream' );
const _ = require( 'lodash' );

const logger = require( 'pelias-logger' ).get( 'openaddresses' );
const config = require('pelias-config').generate();

const CleanupStream = require('./cleanupStream');
const ContentHashStream = require('./contentHashStream');
const ValidRecordFilterStream = require('./validRecordFilterStream');
const DocumentStream = require('./documentStream');

/*
 * Construct a suitable id prefix for a CSV file given
 * its full filename and the base directory of all OA CSV files.
 */
function getIdPrefix(filename, dirPath) {
  if (filename && dirPath) {
    // if the file is within the dir path, use the structure
    // of the directory tree to create the id
    if (filename.indexOf(dirPath) !== -1) {
      var subpath = _.replace(filename, dirPath, '');
      var prefix = _.replace(subpath, '.csv', '');
      return _.trim(prefix, '/');
    }
  }

  // if the dirPath doesn't contain this file, return the basename without extension
  return path.basename(filename, '.csv');
}

/**
 * Create a stream of Documents from an OpenAddresses file.
 *
 * @param {string} filePath The path of an OpenAddresses CSV file.
 * @return {stream.Readable} A stream of `Document` objects, one
 *    for every valid record inside the OA file.
 */
function createRecordStream( filePath, dirPath ){
  /**
   * A stream to convert rows of a CSV to Document objects.
   */
  var stats = {
    badRecordCount: 0
  };

  const csvParser = csvParse({
    trim: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax: true,
    columns: true
  });

  const contentHashStream = ContentHashStream.create();
  const validRecordFilterStream = ValidRecordFilterStream.create();
  const cleanupStream = CleanupStream.create();
  const idPrefix = getIdPrefix(filePath, dirPath);
  const documentStream = DocumentStream.create(idPrefix, stats);

  documentStream._flush = function end( done ){
    done();
  };

  return fs.createReadStream( filePath )
    .pipe( csvParser )
    .pipe( contentHashStream )
    .pipe( validRecordFilterStream )
    .pipe( cleanupStream )
    .pipe( documentStream );
}

/*
 * Create a single stream from many CSV files
 */
function createFullRecordStream(files, dirPath) {
  var recordStream = combinedStream.create();

  files.forEach( function forEach( filePath ){
    if (!fs.existsSync(filePath)) {
      if (config.get('imports.openaddresses.missingFilesAreFatal')) {
        logger.error(`File ${filePath} not found, quitting`);
        process.exit(1);
      } else {
        logger.warn(`File ${filePath} not found, skipping`);
        return;
      }
    }

    recordStream.append( function ( next ){
      logger.info( 'Creating read stream for: ' + filePath );
      next(createRecordStream( filePath, dirPath ) );
    });
  });

  return recordStream;
}

module.exports = {
  getIdPrefix: getIdPrefix,
  create: createFullRecordStream
};
