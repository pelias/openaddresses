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
var addressDeduplicatorStream = require( 'address-deduplicator-stream' );
var peliasHierarchyLookup = require( 'pelias-hierarchy-lookup' );

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

function importOpenAddressesDir( dirPath, opts ){
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

  if( opts.deduplicate ){
    var deduplicatorStream = addressDeduplicatorStream( 100, 10 );
    recordStream.pipe( deduplicatorStream );
    recordStream = deduplicatorStream;
  }

  if( opts.adminValues ){
    var lookupStream = peliasHierarchyLookup.stream();
    recordStream.pipe( lookupStream );
    recordStream = lookupStream;
  }

  recordStream.pipe( createPeliasElasticsearchPipeline() );
}

/**
 * Handle the command-line arguments passed to the script.
 */
function handleUserArgs( argv ){
  var usageMessage = [
    'A tool for importing OpenAddresses data into Pelias. Usage:',
    '',
    '\tnode import.js [--deduplicate] [--admin-values] OPENADDRESSES_DIR',
    '',
    '',
    '\tOPENADDRESSES_DIR: A directory containing OpenAddresses CSV files.',
    '',
    '\t--deduplicate: (advanced use) Deduplicate addresses using the',
    '\t\tOpenVenues deduplicator: https://github.com/openvenues/address_deduper.',
    '\t\tIt must be running at localhost:5000.',
    '',
    '\t--admin-values: (advanced use) OpenAddresses records lack admin values',
    '\t\t(country, state, city, etc., names), so auto-fill them',
    '\t\tby querying the Quattroshapes types in the Pelias',
    '\t\telasticsearch index. You must have imported these using',
    '\t\thttps://github.com/pelias/quattroshapes-pipeline.'
  ].join( '\n' );

  var opts = {
    deduplicate: false,
    adminValues: false
  };
  for( var ind = 0; ind < argv.length - 1; ind++ ){
    switch( argv[ ind ] ){
      case '--deduplicate':
        opts.deduplicate = true;
        break;

      case '--admin-values':
        opts.adminValues = true;
        break;

      default:
        console.error( 'ERROR. unrecognized argument:', argv[ ind ] );
        console.error( '\nUSAGE. ' + usageMessage );
        process.exit( 2 );
    }
  }
  importOpenAddressesDir( argv[ argv.length - 1 ], opts );
}

handleUserArgs( process.argv.slice( 2 ) );
