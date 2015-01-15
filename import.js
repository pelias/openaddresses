/**
 * @file Entry-point script for the OpenAddresses import pipeline.
 */

'use strict';

var fs = require( 'fs' );
var path = require( 'path' );

var combinedStream = require( 'combined-stream' );
var addressDeduplicatorStream = require( 'address-deduplicator-stream' );
var peliasHierarchyLookup = require( 'pelias-hierarchy-lookup' );

var importPipelines = require( './lib/import_pipelines' );

function importOpenAddressesDir( dirPath, opts ){
  var recordStream = combinedStream.create();
  fs.readdirSync( dirPath ).forEach( function forEach( filePath ){
    if( filePath.match( /.csv$/ ) ){
      console.error( 'Creating read stream for: ' + filePath );
      var fullPath = path.join( dirPath, filePath );
      recordStream.append( function ( next ){
        next( importPipelines.createRecordStream( fullPath ) );
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

  recordStream.pipe( importPipelines.createPeliasElasticsearchPipeline() );
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
