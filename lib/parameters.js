const fs = require('fs');
const util = require('util');
const glob = require('glob');
const path = require('path');
const _ = require('lodash');
const minimist = require('minimist');
const logger = require('pelias-logger').get('openaddresses');

const peliasConfig = require('pelias-config').generate();
const OpenAddressesAPI = require('../utils/OpenAddressesAPI');

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
    '\tnode import.js --help | [--admin-values] [OPENADDRESSES_DIR]',
    '',
    '',
    '\t--help: Print this help message.',
    '',
    '\tOPENADDRESSES_DIR: A directory containing OpenAddresses CSV files.',
    '\t\tIf none is specified, the path from your PELIAS_CONFIG\'s',
    '\t\t`imports.openaddresses.datapath` will be used.',
  ].join( '\n' );

  argv = minimist(argv, {});

  var validArgs = ['help', '_'];
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
  // get the files to process
  const files = _.get(peliasConfig.imports.openaddresses, 'files', []);

  if (_.isEmpty(files)) {
    // no specific files listed, so return all .csv and .geojson files
    return glob.sync( args.dirPath + '/**/*.{csv,geojson,geojson.gz,csv.gz}' );
  } else {
    // otherwise return the requested files with full path
    return files.map(file => {

      // normalize source
      const source = OpenAddressesAPI.normalize(file);

      // search for files matching this source id, ending in either .geojson or .csv
      const found = glob.sync(`${source}.{csv,geojson}`, { cwd: args.dirPath, absolute: true });
      if (!_.isEmpty(found)) { return _.last(found); } // results are sorted, prefer .geojson

      // no matching files were found, return a non-matching absolute path
      return path.join(args.dirPath, file);
    });
  }
}

/**
 * The number of import pipelines to run. The OPENADDRESSES_PARALLELISM
 * environment variable (set by `bin/parallel`) takes priority over
 * `imports.openaddresses.parallelism`. An invalid value is ignored.
 */
function getParallelism(peliasConfig, env) {
  const fromEnv = _.get(env || process.env, 'OPENADDRESSES_PARALLELISM');

  if (!_.isNil(fromEnv) && fromEnv !== '') {
    const parallelism = Number(fromEnv);
    if (Number.isInteger(parallelism) && parallelism >= 1) { return parallelism; }
    logger.warn(`ignoring invalid OPENADDRESSES_PARALLELISM '${fromEnv}'`);
  }

  return _.get(peliasConfig, 'imports.openaddresses.parallelism', 1);
}

module.exports = {
  interpretUserArgs: interpretUserArgs,
  getFileList: getFileList,
  getParallelism: getParallelism
};
