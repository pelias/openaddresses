var fs = require( 'fs' );
var util = require( 'util' );
var glob = require( 'glob' );
var path = require( 'path' );
var _ = require('lodash');

var minimist = require( 'minimist' );

var peliasConfig = require( 'pelias-config' ).generate();

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
function interpretUserArgs( argv, config ){
  config = config || peliasConfig;

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
  ].join( '\n' );

  argv = minimist(argv, {});

  var validArgs = ['help', '_', 'parallel-count', 'parallel-id' ];
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
    'parallel-count': argv['parallel-count'],
    'parallel-id': argv['parallel-id'],
    dirPath: null
  };
  if( argv._.length > 0 ){
    opts.dirPath = argv._[ 0 ];
  }
  else {
    opts.dirPath = config.imports.openaddresses.datapath;
  }

  opts.dirPath = path.normalize(opts.dirPath);

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

function getFullFileList(peliasConfig, args) {
  // get the files to process
  const files = _.get(peliasConfig.imports.openaddresses, 'files', []);

  if (_.isEmpty(files)) {
    // no specific files listed, so return all .csv files
    return glob.sync( args.dirPath + '/**/*.csv' );
  } else {
    // otherwise return the requested files with full path
    return files.map(function(file) {
      return path.join(args.dirPath, file);
    });
  }
}

function getFileList(peliasConfig, args) {
  var files = getFullFileList(peliasConfig, args);

  if (args['parallel-count'] > 0 && args['parallel-id'] >= 0) {
    files = files.filter(function(element, index) {
      return index % args['parallel-count'] === args['parallel-id'];
    });
  }

  return files;
}

module.exports = {
  interpretUserArgs: interpretUserArgs,
  getFileList: getFileList
};
