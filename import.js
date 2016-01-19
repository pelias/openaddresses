/**
 * @file Entry-point script for the OpenAddresses import pipeline.
 */

'use strict';

var peliasConfig = require( 'pelias-config' ).generate();
var logger = require( 'pelias-logger' ).get( 'openaddresses' );

var interpretUserArgs = require( './lib/interpretUserArgs' );
var importPipelines = require( './lib/import_pipelines' );

// Pretty-print the total time the import took.
function startTiming() {
  var startTime = new Date().getTime();
  process.on( 'exit', function (){
    var totalTimeTaken = (new Date().getTime() - startTime).toString();
    var seconds = totalTimeTaken.slice(0, totalTimeTaken.length - 3);
    var milliseconds = totalTimeTaken.slice(totalTimeTaken.length - 3);
    logger.info( 'Total time taken: %s.%ss', seconds, milliseconds );
  });
}

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
 *      adminValues: Add admin values to each address object (since
 *        OpenAddresses doesn't contain any) using `admin-lookup`. See the
 *        documentation: https://github.com/pelias/admin-lookup
 */
function importOpenAddressesFiles( files, opts ){
  logger.info( 'Importing %s files.', files.length );
  var pipeline = [ importPipelines.createFullRecordStream(files) ];


  if( opts.deduplicate ){
    pipeline.push(importPipelines.createDeduplicatorStream());
  }

  if( opts.adminValues ){
    pipeline.push(importPipelines.createAdminLookupStream());
  }

  pipeline.push(importPipelines.createPeliasElasticsearchPipeline());

  startTiming();

  // start the import process by piping all the streams appropriately
  for(var i = 0; i < pipeline.length - 1; i++) {
    pipeline[i].pipe(pipeline[i+1]);
  }
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
