/**
 * @file Entry-point script for the OpenAddresses import pipeline.
 */

'use strict';

var peliasConfig = require( 'pelias-config' ).generate();
var logger = require( 'pelias-logger' ).get( 'openaddresses' );

var parameters = require( './lib/parameters' );
var importPipeline = require( './lib/importPipeline' );

var adminLookupStream = require('./lib/streams/adminLookupStream');
var deduplicatorStream = require('./lib/streams/deduplicatorStream');

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

var args = parameters.interpretUserArgs( process.argv.slice( 2 ) );

if( 'exitCode' in args ){
  ((args.exitCode > 0) ? console.error : console.info)( args.errMessage );
  process.exit( args.exitCode );
} else {
  startTiming();

  var files = parameters.getFileList(peliasConfig, args);

  var deduplicator = deduplicatorStream.create(args.deduplicate);
  var adminLookup = adminLookupStream.create(args.adminValues, peliasConfig);

  importPipeline.create( files, args, deduplicator, adminLookup );
}
