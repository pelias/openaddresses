/**
 * @file Contains functions related to the creation of the data pipelines used
 * by this importer, like record streams for OpenAddresses files and the
 * elasticsearch sink.
 */

'use strict';

var fs = require( 'fs' );
var csvParse = require( 'csv-parse' );
var through = require( 'through2' );
var logger = require( 'pelias-logger' ).get( 'openaddresses' );
var peliasModel = require( 'pelias-model' );
var peliasDbclient = require( 'pelias-dbclient' );
var cleanup = require( './cleanupStream' );

/*
 * Return true if a record has all of LON, LAT, NUMBER and STREET defined
 */
function isValidCsvRecord( record ){
  return [ 'LON', 'LAT', 'NUMBER', 'STREET' ].every(function(prop) {
    return record[ prop ].length > 0;
  });
}

/*
 * Create a through2 stream to filter out invalid records
 */
function createValidRecordFilterStream() {
  return through.obj(function( record, enc, next ) {
    if (isValidCsvRecord(record)) {
      this.push(record);
    }
    next();
  });
}


/*
 * Create a stream of Documents from valid, cleaned CSV records
 */
function createDocumentStream(stats) {
  /**
   * Used to track the UID of individual records passing through the stream
   * created by `createRecordStream()`.  See `peliasModel.Document.setId()` for
   * information about UIDs.
   */
  var uid = 0;

  return through.obj(
    function write( record, enc, next ){
      var model_id = ( uid++ ).toString();
      try {
        var addrDoc = new peliasModel.Document( 'openaddresses', model_id )
        .setName( 'default', (record.NUMBER + ' ' + record.STREET).replace(/ +/g, ' ') )
        .setCentroid( { lon: record.LON, lat: record.LAT } );

        addrDoc.setAddress( 'number', record.NUMBER );

        addrDoc.setAddress( 'street', record.STREET );

        if (record.POSTCODE) {
          addrDoc.setAddress( 'zip', record.POSTCODE );
        }

        addrDoc.phrase = addrDoc.name;
        this.push( addrDoc );
      }
      catch ( ex ){
        stats.badRecordCount++;
      }

      next();
    }
  );
}


/**
 * Create a stream of Documents from an OpenAddresses file.
 *
 * @param {string} filePath The path of an OpenAddresses CSV file.
 * @return {stream.Readable} A stream of `Document` objects, one
 *    for every valid record inside the OA file.
 */
function createRecordStream( filePath ){
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

  var validRecordFilterStream = createValidRecordFilterStream();
  var cleanupStream = cleanup.createCleanupStream();

  var documentStream = createDocumentStream(stats);

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

/**
 * Create the Pelias elasticsearch import pipeline.
 *
 * @return {stream.Writable} The entry point to the elasticsearch pipeline,
 *    which will perform additional processing on inbound `Document` objects
 *    before indexing them in the elasticsearch pelias index.
 */
function createPeliasElasticsearchPipeline(){
  var dbclientMapper = through.obj( function( model, enc, next ){
    this.push({
      _index: 'pelias',
      _type: model.getType(),
      _id: model.getId(),
      data: model
    });
    next();
  });

  var entryPoint = dbclientMapper;
  entryPoint.pipe( peliasDbclient() );

  return entryPoint;
}

module.exports = {
  createRecordStream: createRecordStream,
  createPeliasElasticsearchPipeline: createPeliasElasticsearchPipeline,
  isValidCsvRecord: isValidCsvRecord,
  createDocumentStream: createDocumentStream
};
