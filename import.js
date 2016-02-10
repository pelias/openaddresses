/**
 * @file Entry-point script for the OpenAddresses import pipeline.
 */

'use strict';

var fs = require( 'fs' );

var peliasConfig = require( 'pelias-config' ).generate();
var logger = require( 'pelias-logger' ).get( 'openaddresses' );
var through = require( 'through2' );

var parameters = require( './lib/parameters' );
var importPipeline = require( './lib/importPipeline' );

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
}
else {
  startTiming();

  var files = parameters.getFileList(peliasConfig, args);

  var outPath = './importer.out';
  var stream = through.obj(function(obj, _, next) {
    fs.appendFile(outPath, JSON.stringify(obj) + '\n');
    return next();
  });

  importPipeline.create( files, args, stream );
}
