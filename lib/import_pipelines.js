/**
 * @file
 */

'use strict';

var fs = require( 'fs' );
var through = require( 'through2' );
var peliasModel = require( 'pelias-model' );
var peliasSuggesterPipeline = require( 'pelias-suggester-pipeline' );
var peliasDbclient = require( 'pelias-dbclient' );
var csvParser = require( 'fast-csv' );

var uid = 0;
function createRecordStream( filePath ){
  var documentCreator = through.obj( function write( record, enc, next ){
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
