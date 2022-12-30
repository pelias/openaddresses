const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const csvParse = require('csv-parse').parse;
const combinedStream = require('combined-stream');
const through = require('through2');
const split = require('split2');

const logger = require('pelias-logger').get('openaddresses');
const config = require('pelias-config').generate();

const CleanupStream = require('./cleanupStream');
const ContentHashStream = require('./contentHashStream');
const ValidRecordFilterStream = require('./validRecordFilterStream');
const DocumentStream = require('./documentStream');
const gnafMapperStreamFactory = require('./gnafMapperStream');
const unitSplittingMapperStreamFactory = require('./unitSplittingMapperStream');

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
      var prefix = _.replace(subpath, /\.(csv|geojson)/, '');
      return _.trim(prefix, '/');
    }
  }

  // if the dirPath doesn't contain this file, return the basename without extension
  return path.basename(path.basename(filename, '.csv'), '.geojson');
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

  const contentHashStream = ContentHashStream.create();
  const validRecordFilterStream = ValidRecordFilterStream.create();
  const idPrefix = getIdPrefix(filePath, dirPath);
  const countryCode = idPrefix.replace(/\\/g, '/').split('/')[0];
  const cleanupStream = CleanupStream.create({ countryCode });
  const documentStream = DocumentStream.create(idPrefix, stats);

  documentStream._flush = function end( done ){
    done();
  };

  return fileStreamDispatcher(fs.createReadStream( filePath ), filePath)
    .pipe( contentHashStream )
    .pipe( validRecordFilterStream )
    .pipe( cleanupStream )
    .pipe( documentStream )
    .pipe( gnafMapperStreamFactory() )
    .pipe( unitSplittingMapperStreamFactory() );
}

function geojsonStream(stream) {
  return stream
    .pipe(split())
    .pipe(through.obj((line, _enc, next) => {
      let row;
      try {
        const geojson = JSON.parse(line);
        if (_.get(geojson, 'geometry.type') === 'Point') {
          row = {
            NUMBER: _.get(geojson, 'properties.number'),
            STREET: _.get(geojson, 'properties.street'),
            LON: _.get(geojson, 'geometry.coordinates[0]'),
            LAT: _.get(geojson, 'geometry.coordinates[1]'),
            POSTCODE: _.get(geojson, 'properties.postcode'),
            UNIT:_.get(geojson, 'properties.unit'),
            DISTRICT:_.get(geojson, 'properties.district'),
            REGION:_.get(geojson, 'properties.region'),
            CITY:_.get(geojson, 'properties.city')
          };
        }
      } catch(e) {
        logger.error(e);
      }
      next(null, row);
    }));
}

function fileStreamDispatcher(stream, filePath) {
  if (filePath.endsWith('.geojson')) {
    return geojsonStream(stream);
  }

  return stream.pipe(csvParse({
    bom: true,
    trim: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax: true,
    columns: true
  }));
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
