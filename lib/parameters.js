var fs = require( 'fs' );
var util = require( 'util' );
var glob = require( 'glob' );
var path = require( 'path' );

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
    '',
    '\t--deduplicate: (advanced use) Deduplicate addresses using the',
    '\t\tOpenVenues deduplicator: https://github.com/openvenues/address_deduper.',
    '\t\tIt must be running at localhost:5000.',
    '',
    '\t--admin-values: (advanced use) OpenAddresses records lack admin values',
    '\t\t(country, state, city, etc., names), so auto-fill them',
    '\t\tusing `admin-lookup` See the documentation:',
    '\t\thttps://github.com/pelias/admin-lookup'
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

function getFileList(peliasConfig, args) {
  var configFiles = peliasConfig.imports.openaddresses? peliasConfig.imports.openaddresses.files : undefined;
  if (configFiles !== undefined && configFiles.length > 0) {
    return configFiles.map(function(file) {
      return path.join(args.dirPath, file);
    });
  } else {
    return glob.sync( args.dirPath + '/**/*.csv' );
  }
}

module.exports = {
  interpretUserArgs: interpretUserArgs,
  getFileList: getFileList
};
