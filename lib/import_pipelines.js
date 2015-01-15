/**
 * @file Contains functions related to the creation of the data pipelines used
 * by this importer, like record streams for OpenAddresses files and the
 * elasticsearch sink.
 */

'use strict';

var fs = require( 'fs' );
var through = require( 'through2' );
var peliasModel = require( 'pelias-model' );
var peliasSuggesterPipeline = require( 'pelias-suggester-pipeline' );
var peliasDbclient = require( 'pelias-dbclient' );
var csvParser = require( 'fast-csv' );

var uid = 0;

/**
 * Create a stream of Documents from an OpenAddresses file.
 *
 * @param {string} filePath The path of an OpenAddresses CSV file.
 * @return {stream.Readable} A stream of `Document` objects, one
 *    for every valid record inside the OA file.
 */
function createRecordStream( filePath ){
  var documentCreator = through.obj( function write( record, enc, next ){
    // TODO: remove this.push( addrDoc ) from this try to prevent its errors
    // from getting swallowed
    try {
      var model_id = ( uid++ ).toString();
      var addrDoc = new peliasModel.Document( 'openaddresses', model_id )
        .setName( 'default', record[ ' NUMBER' ] + ' ' + record[ ' STREET' ] )
        .setCentroid( { lat: record[ ' LAT' ], lon: record[ 'LON' ] } )
      this.push( addrDoc );
    }
    catch ( ex ){
      console.error( 'Bad data, Document could not be created:', ex );
    }
    next();
  });

  return fs.createReadStream( filePath )
    .pipe( csvParser( { headers: true, quote: null } ) )
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
  createPeliasElasticsearchPipeline: createPeliasElasticsearchPipeline
};
