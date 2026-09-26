/**
 * @file Entry-point script for the OpenAddresses import pipeline.
 */

var peliasConfig = require( 'pelias-config' ).generate(require('./schema'));

var logger = require( 'pelias-logger' ).get( 'openaddresses' );

var parameters = require( './lib/parameters' );
var importPipeline = require( './lib/importPipeline' );
var rowSource = require( './lib/rowSource' );

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

  if (peliasConfig.imports.openaddresses.hasOwnProperty('adminLookup')) {
    logger.info('imports.openaddresses.adminLookup has been deprecated, ' +
                'enable adminLookup using imports.adminLookup.enabled = true');
  }

  var files = parameters.getFileList(peliasConfig, args);

  // a parallelism greater than one runs a single reader which fans its output
  // out to that many worker processes, each running the full pipeline
  const parallelism = parameters.getParallelism(peliasConfig);

  if (parallelism > 1) {
    require('./lib/parallel/coordinator').run(files, args.dirPath, parallelism);
  } else {
    logger.info( 'Importing %s files.', files.length );

    const source = rowSource.createRowStream(files, args.dirPath);
    source.on('error', (err) => {
      logger.error(err.message);
      process.exit(1);
    });

    importPipeline.create(source, 'openaddresses');
  }
}
