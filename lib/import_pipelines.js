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
var peliasSuggesterPipeline = require( 'pelias-suggester-pipeline' );
var peliasDbclient = require( 'pelias-dbclient' );

function isValidCsvRecord( record ){
  return [ 'LON', 'LAT', 'NUMBER', 'STREET' ].reduce( function ( acc, prop ){
    return acc && record[ prop ].length > 0;
  }, true);
}

/**
 * Used to track the UID of individual records passing through the stream
 * created by `createRecordStream()`. Not bothering with a closure for
 * readability. See `peliasModel.Document.setId()` for information about UIDs.
 */
var uid = 0;

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
  var numberBadRecords = 0;
  var intervalId = setInterval( function (){
    logger.verbose( 'Number of bad records: ' + numberBadRecords );
  }, 10000 );

  var documentCreator = through.obj(
    function write( record, enc, next ){
      if( isValidCsvRecord( record ) ){
        var model_id = ( uid++ ).toString();
        var addrDoc;
        try {
          addrDoc = new peliasModel.Document( 'openaddresses', model_id )
            .setName( 'default', record.NUMBER + ' ' + record.STREET )
            .setCentroid( { lon: record.LON, lat: record.LAT } );

          try {
            addrDoc.setAddress( 'number', record.NUMBER );
          } catch ( ex ) {}

          try {
            addrDoc.setAddress( 'street', record.STREET );
          } catch ( ex ) {}

          try {
            addrDoc.setAddress( 'zip', record.POSTCODE );
          } catch ( ex ) {}
        }
        catch ( ex ){
          numberBadRecords++;
        }

        if( addrDoc !== undefined ){
          this.push( addrDoc );
        }
      }
      next();
    },
    function end( done ){
      clearInterval( intervalId );
      done();
    }
  );

  var csvParser = csvParse({
    trim: true,
    skip_empty_lines: true,
    relax: true,
    columns: true
  });
  return fs.createReadStream( filePath )
    .pipe( csvParser )
    .pipe( documentCreator );
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

  var entryPoint = peliasSuggesterPipeline.pipeline;
  entryPoint
    .pipe( dbclientMapper )
    .pipe( peliasDbclient() );
  return entryPoint;
}

module.exports = {
  createRecordStream: createRecordStream,
  createPeliasElasticsearchPipeline: createPeliasElasticsearchPipeline,
  isValidCsvRecord: isValidCsvRecord
};
