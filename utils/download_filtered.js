const child_process = require('child_process');
const config = require( 'pelias-config' ).generate();
const async = require('async');
const fs = require('fs-extra');
const temp = require('temp');
const logger = require('pelias-logger').get('openaddresses-download');
const Bottleneck = require('bottleneck/es5');

function downloadFiltered(config, callback) {
  const targetDir = config.imports.openaddresses.datapath;

  fs.ensureDir(targetDir, (err) => {
    if (err) {
      logger.error(`error making directory ${targetDir}`, err);
      return callback(err);
    }

    const files = getFiles(config, targetDir, callback);
    logger.info(`Attempting to download selected data files: ${files.map(file => file.csv)}`);

    // limit requests to avoid being banned by openaddresses.io
    // current policy is 10 request per minute
    // https://github.com/pelias/openaddresses/issues/433#issuecomment-527383976
    const options = {
      maxConcurrent: 1,
      minTime: 6000
    };
    const limiter = new Bottleneck(options);
    const callbackOnLastOne = () => {
      if (limiter.empty()) {
        callback();
      }
    };
    files.map(file => {
      limiter.submit(downloadSource, targetDir, file, callbackOnLastOne);
    });
    process.on('SIGINT', () => {
      limiter.stop({dropWaitingJobs: true});
      process.exit();
    });
  });

}

function getFiles(config, targetDir, main_callback){
  const errorsFatal = config.get('imports.openaddresses.missingFilesAreFatal');
  const files = config.imports.openaddresses.files;
  files.forEach(file => {
    // sources MUST end with '.csv'
    if( !file.endsWith('.csv') ){
      const msg = `invalid source '${file}': MUST end with '.csv'`;
      logger.warn(msg);

      // respect 'imports.openaddresses.missingFilesAreFatal' setting
      return main_callback(errorsFatal ? msg : null);
    }
  });
  return files.map(file => {
    const source = file.replace('.csv', '.zip');
    const name = file.replace('.csv', '').replace(/\//g,'-');
    return {
      csv: file,
      url: `https://results.openaddresses.io/latest/run/${source}`,
      zip: temp.path({prefix: name, dir: targetDir, suffix: '.zip'})
    };
  });
}

function downloadSource(targetDir, file, main_callback) {
  const errorsFatal = config.get('imports.openaddresses.missingFilesAreFatal');
  const referer = config.get('imports.openaddresses.dataReferer') || 'https://pelias-results.openaddresses.io';
  logger.info(`Downloading ${file.csv}`);

  async.series(
    [
      // download the zip file into the temp directory
      (callback) => {
        logger.debug(`downloading ${file.url}`);
        const flags = [
          '--request GET',                // HTTP GET
          '--silent',                     // be quiet
          '--location',                   // follow redirects
          '--fail',                       // exit with a non-zero code for >=400 responses
          '--write-out "%{http_code}"',   // print status code to STDOUT
          `--referer ${referer}`,         // set referer header
          `--output ${file.zip}`,         // set output filepath
          '--retry 5',                    // retry this number of times before giving up
          '--retry-connrefused',          // consider ECONNREFUSED as a transient error
          '--retry-delay 5'               // sleep this many seconds between retry attempts
        ].join(' ');

        // the `--fail*` flags cause an error to be returned as the first arg with `error.code`
        // as the process exit status, the `-w "%{http_code}"` flag writes the HTTP status to STDOUT.
        child_process.exec(`curl ${flags} ${file.url}`, (error, stdout) => {
          if (!error) { return callback(); }

          // provide a more user-friendly error message
          error.message = `cURL request failed, HTTP status: ${stdout}, exit code: ${error.code}`;
          callback(error);
        });
      },
      // unzip file into target directory
      (callback) => {
        logger.debug(`unzipping ${file.zip} to ${targetDir}`);
        child_process.exec(`unzip -o -qq -d ${targetDir} ${file.zip}`, callback);
      },
      // delete the temp downloaded zip file
      fs.remove.bind(null, file.zip)
    ],
    function(err) {
      if (err) {
          logger.warn(`failed to download ${file.url}: ${err}`);
      }

      // honour 'imports.openaddresses.missingFilesAreFatal' setting
      main_callback(errorsFatal ? err : null);
    });
}

module.exports = downloadFiltered;
