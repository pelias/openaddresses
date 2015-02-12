/**
 * @file Entry-point script for the OpenAddresses import pipeline.
 */

'use strict';

var fs = require( 'fs' );
var path = require( 'path' );
var util = require( 'util' );

var peliasConfig = require( 'pelias-config' );
var minimist = require( 'minimist' );
var combinedStream = require( 'combined-stream' );
var winston = require( 'winston' );
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

  winston.info( 'Importing files in the `%s` directory.', dirPath );
  fs.readdirSync( dirPath ).forEach( function forEach( filePath ){
    if( filePath.match( /.csv$/ ) ){
      var fullPath = path.join( dirPath, filePath );
      recordStream.append( function ( next ){
        winston.info( 'Creating read stream for: ' + filePath );
        next( importPipelines.createRecordStream( fullPath ) );
      });
    }
  });

  if( opts.deduplicate ){
    winston.info( 'Setting up deduplicator.' );
    var deduplicatorStream = addressDeduplicatorStream( 100, 10 );
    recordStream.pipe( deduplicatorStream );
    recordStream = deduplicatorStream;
  }

  if( opts.adminValues ){
    winston.info( 'Setting up admin value lookup stream.' );
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
    '\tnode import.js --help | [--deduplicate] [--admin-values] [OPENADDRESSES_DIR]',
    '',
    '',
    '\t--help: Print this help message.',
    '',
    '\tOPENADDRESSES_DIR: A directory containing OpenAddresses CSV files.',
    '\t\tIf none is specified, the path from your PELIAS_CONFIG\'s',
    '\t\t`imports.openaddresses.datapath` will be used.',
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

  argv = minimist(
    argv,
    {
      boolean: [ 'deduplicate', 'admin-values' ],
      default: {
        deduplicate: false,
        'admin-values': false,
      }
    }
  );

  var validArgs = [ 'deduplicate', 'admin-values', 'help', '_' ];
  for( var arg in argv ){
    if( validArgs.indexOf( arg ) === -1 ){
      return {
        errMessage: util.format( '`%s` is not a recognized argument.', arg ),
        exitCode: 1
      };
    }
  }

  if( argv.help ){
    return { errMessage: usageMessage, exitCode: 0 };
  }

  var opts = {
    deduplicate: argv.deduplicate,
    adminValues: argv[ 'admin-values' ],
    dirPath: null
  };
  if( argv._.length > 0 ){
    opts.dirPath = argv._[ 0 ];
  }
  else {
    var conf = peliasConfig.generate();
    opts.dirPath = conf.imports.openaddresses.datapath;
  }

  if( !fs.existsSync( opts.dirPath ) ){
    return {
      errMessage: util.format( 'Directory `%s` does not exist.', opts.dirPath ),
      exitCode: 2
    };
  }
  else if( !fs.statSync( opts.dirPath ).isDirectory() ){
    return {
      errMessage: util.format( '`%s` is not a directory.', opts.dirPath ),
      exitCode: 2
    };
  }

  return opts;
}

if( require.main === module ){
  winston.remove( winston.transports.Console );
  winston.add( winston.transports.Console, {
    timestamp: true, colorize: true
  });

  var args = interpretUserArgs( process.argv.slice( 2 ) );

  if( 'exitCode' in args ){
    ((args.exitCode > 0) ? winston.error : winston.info)( args.errMessage );
    process.exit( args.exitCode );
  }
  else {
    console.log( args );process.exit( 0 );
    importOpenAddressesDir( args.dirPath, args );
  }
}
else {
  module.exports = interpretUserArgs; // for tests
}
