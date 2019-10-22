const child_process = require('child_process');
const config = require( 'pelias-config' ).generate();
const async = require('async');
const fs = require('fs-extra');
const tmp = require('tmp');
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
      zip: tmp.tmpNameSync({prefix: name, dir: targetDir, postfix: '.zip'})
    };
  });
}

function downloadSource(targetDir, file, main_callback) {
  const errorsFatal = config.get('imports.openaddresses.missingFilesAreFatal');
  logger.info(`Downloading ${file.csv}`);

  async.series(
    [
      // download the zip file into the temp directory
      (callback) => {
        logger.debug(`downloading ${file.url}`);
        child_process.exec(`curl -s -L -X GET -o ${file.zip} ${file.url}`, callback);
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
