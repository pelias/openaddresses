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

/**
 * Import all OpenAddresses CSV files in a directory into Pelias elasticsearch.
 *
 * @param {string} dirPath The path to a directory. All *.csv files inside of
 *    it will be read and imported (they're assumed to contain OpenAddresses
 *    data).
 * @param {object} opts Options to configure the import. Supports the following
 *    keys:
 *
 *      deduplicate: Pass address object through `address-deduplicator-stream`
 *        to perform deduplication. See the documentation:
 *        https://github.com/pelias/address-deduplicator-stream
 *
 *      admin-values: Add admin values to each address object (since
 *        OpenAddresses doesn't contain any) using `hierarchy-lookup`. See the
 *        documentation: https://github.com/pelias/hierarchy-lookup
 */
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
 * Interprets the command-line arguments passed to the script.
 *
 * @param {array} argv Should be `process.argv.slice( 2 )`.
 * @return {object} If arguments were succesfully parsed, an object that can be
 *    used to call `importOpenAddressesDir`:
 *
 *      {
 *        dirPath: <string>,
 *        adminValues: <boolean>,
 *        deduplicate: <boolean>,
 *      }
 *
 *    Otherwise, an error object.
 *
 *      {
 *        exitCode: <number>,
 *        errMessage: <string>
 *      }
 */
function interpretUserArgs( argv ){
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
    adminValues: false,
    dirPath: null
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
        var errMessage = [
          'Error. unrecognized argument:', argv[ ind ], '\nUsage. ',
          usageMessage
        ].join( '' );
        return { errMessage: errMessage, exitCode: 1 };
    }
  }
  opts.dirPath = argv[ argv.length - 1 ];
  return opts;
}

if( require.main === module ){
  var opts = interpretUserArgs( process.argv.slice( 2 ) );
  if( opts.exitCode ){
    console.error( opts.errMessage );
    process.exit( opts.exitCode )
  }
  else {
    importOpenAddressesDir( opts.dirPath, opts );
  }
}
else {
  module.exports = interpretUserArgs; // for tests
}
