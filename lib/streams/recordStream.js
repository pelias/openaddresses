var fs = require( 'fs' );
var path = require( 'path' );

var csvParse = require( 'csv-parse' );
var combinedStream = require( 'combined-stream' );

var logger = require( 'pelias-logger' ).get( 'openaddresses' );
var CleanupStream = require('./cleanupStream');
var ValidRecordFilterStream = require('./validRecordFilterStream');
var DocumentStream = require('./documentStream');

/*
 * Construct a suitable id prefix for a CSV file given
 * its full filename and the base directory of all OA CSV files.
 */
function getIdPrefix(filename, dirPath) {
  var heirarchy = [];
  var current_level = filename;

  // traverse the directory structure upward to the OA base directory,
  // keeping track of directory names along the way
  while (current_level !== '/') {
    heirarchy.unshift(path.basename(current_level, '.csv'));

    current_level = path.resolve(current_level, '..');
    if (current_level === dirPath) {
      return heirarchy.join(path.sep);
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

  var intervalId = setInterval( function (){
    logger.verbose( 'Number of bad records: ' + stats.badRecordCount );
  }, 10000 );

  var csvParser = csvParse({
    trim: true,
    skip_empty_lines: true,
    relax: true,
    columns: true
  });

  var validRecordFilterStream = ValidRecordFilterStream.create();
  var cleanupStream = CleanupStream.create();
  var idPrefix = getIdPrefix(filePath, dirPath);
  var documentStream = DocumentStream.create(idPrefix, stats);

  documentStream._flush = function end( done ){
    clearInterval( intervalId );
    done();
  };

  return fs.createReadStream( filePath )
    .pipe( csvParser )
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
