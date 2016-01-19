/**
 * @file Entry-point script for the OpenAddresses import pipeline.
 */

'use strict';

var peliasConfig = require( 'pelias-config' ).generate();
var logger = require( 'pelias-logger' ).get( 'openaddresses' );
var addressDeduplicatorStream = require( 'pelias-address-deduplicator' );
var peliasAdminLookup = require( 'pelias-admin-lookup' );

var interpretUserArgs = require( './lib/interpretUserArgs' );
var importPipelines = require( './lib/import_pipelines' );

/**
 * Import all OpenAddresses CSV files in a directory into Pelias elasticsearch.
 *
 * @param {array of string} files An array of the absolute file-paths to import.
 * @param {object} opts Options to configure the import. Supports the following
 *    keys:
 *
 *      deduplicate: Pass address object through `address-deduplicator-stream`
 *        to perform deduplication. See the documentation:
 *        https://github.com/pelias/address-deduplicator-stream
 *
 *      admin-values: Add admin values to each address object (since
 *        OpenAddresses doesn't contain any) using `admin-lookup`. See the
 *        documentation: https://github.com/pelias/admin-lookup
 */
function importOpenAddressesFiles( files, opts ){
  logger.info( 'Importing %s files.', files.length );
  var recordStream = importPipelines.createFullRecordStream(files);

  var esPipeline = importPipelines.createPeliasElasticsearchPipeline();

  if( opts.deduplicate ){
    logger.info( 'Setting up deduplicator.' );
    var deduplicatorStream = addressDeduplicatorStream();
    recordStream.pipe( deduplicatorStream );
    recordStream = deduplicatorStream;
  }

  if( opts.adminValues ){
    logger.info( 'Setting up admin value lookup stream.' );
    var lookupStream = peliasAdminLookup.stream();
    recordStream.pipe( lookupStream );
    recordStream = lookupStream;
  }

  // Pretty-print the total time the import took.
  var startTime;
  esPipeline.once( 'data', function (){
    startTime = new Date().getTime();
  });
  process.on( 'exit', function (){
    var totalTimeTaken = (new Date().getTime() - startTime).toString();
    var seconds = totalTimeTaken.slice(0, totalTimeTaken.length - 3);
    var milliseconds = totalTimeTaken.slice(totalTimeTaken.length - 3);
    logger.info( 'Total time taken: %s.%ss', seconds, milliseconds );
  });

  recordStream.pipe( esPipeline );
}

var args = interpretUserArgs.interpretUserArgs( process.argv.slice( 2 ) );

if( 'exitCode' in args ){
  ((args.exitCode > 0) ? console.error : console.info)( args.errMessage );
  process.exit( args.exitCode );
}
else {
  var files = interpretUserArgs.getFileList(peliasConfig, args);

  importOpenAddressesFiles( files, args );
}
