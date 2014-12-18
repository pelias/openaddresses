/**
 * @file Entry-point script for the OpenAddresses import pipeline.
 */

'use strict';

var fs = require( 'fs' );
var path = require( 'path' );

var through = require( 'through2' );
var csvParser = require( 'fast-csv' );
var combinedStream = require( 'combined-stream' );
var peliasModel = require( 'pelias-model' );
var peliasDbclient = require( 'pelias-dbclient' );
var peliasSuggesterPipeline = require( 'pelias-suggester-pipeline' );

var createAdminValues = require( './lib/create_admin_values' );

function createRecordStream( filePath ){
  var baseName = path.basename(filePath, ".csv");
  var sourcesDirPath = path.join(__dirname, "openaddresses_sources");
  var adminValues = createAdminValues.create(baseName, sourcesDirPath);

  var documentCreator = through.obj( function write( record, enc, next ){
    try {
      process.stderr.write( '\r' + uid );
      var model_id = ( uid++ ).toString();
      var addrDoc = new peliasModel.Document( 'openaddresses', model_id )
        .setName( 'default', record[ ' NUMBER' ] + ' ' + record[ ' STREET' ] )
        .setAdmin( 'admin0', adminValues.country )
        .setCentroid( { lat: record[ ' LAT' ], lon: record[ 'LON' ] } )

      if( adminValues.region !== undefined ){
        addrDoc.setAdmin( 'admin1', adminValues.region );
      }

      if( adminValues.locality !== undefined ){
        addrDoc.setAdmin( 'admin2', adminValues.locality );
      }

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

var uid = 0;
/**
 * Create the Pelias elasticsearch import pipeline.
 *
 * @return {Writable stream} The pipeline entrypoint; Document records should
 *    be written to it.
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

function importOpenAddressesDir( dirPath ){
  var recordStream = combinedStream.create();
  fs.readdirSync( dirPath ).forEach( function forEach( filePath ){
    if( filePath.match( /.csv$/ ) ){
      console.error( 'Creating read stream for: ' + filePath );
      var fullPath = path.join( dirPath, filePath );
      recordStream.append( function ( next ){
        next( createRecordStream( fullPath ) );
      });
    }
  });
  recordStream.pipe( createPeliasElasticsearchPipeline() );
}

/**
 * Handle the command-line arguments passed to the script.
 */
function handleUserArgs( argv ){
  var usageMessage = 'TODO: usage message.';
  if( argv.length !== 1 ){
    console.error( usageMessage );
    process.exit( 1 );
  }
  else {
    importOpenAddressesDir( argv[ 0 ] );
  }
}

handleUserArgs( process.argv.slice( 2 ) );
