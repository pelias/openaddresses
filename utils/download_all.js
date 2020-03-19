const child_process = require('child_process');
const async = require('async');
const fs = require('fs');
const tmp = require('tmp');
const logger = require('pelias-logger').get('openaddresses-download');

function downloadAll(config, callback) {
  logger.info('Attempting to download all data');

  const targetDir = config.imports.openaddresses.datapath;

  fs.mkdir(targetDir, { recursive: true }, (err) => {
    if (err) {
      logger.error(`error making directory ${targetDir}`, err);
      return callback(err);
    }

    const dataHost = config.get('imports.openaddresses.dataHost') || 'https://data.openaddresses.io';

    async.each(
      [
        // all non-share-alike data
        `${dataHost}/openaddr-collected-global.zip`,

        // all share-alike data
        `${dataHost}/openaddr-collected-global-sa.zip`
      ],
      downloadBundle.bind(null, targetDir),
      callback);
  });
}

function downloadBundle(targetDir, sourceUrl, callback) {

  const tmpZipFile = tmp.tmpNameSync({postfix: '.zip'});

  async.series(
    [
      // download the zip file into the temp directory
      (callback) => {
        logger.debug(`downloading ${sourceUrl}`);
        child_process.exec(`curl -s -L -X GET -o ${tmpZipFile} ${sourceUrl}`, callback);
      },
      // unzip file into target directory
      (callback) => {
        logger.debug(`unzipping ${tmpZipFile} to ${targetDir}`);
        child_process.exec(`unzip -o -qq -d ${targetDir} ${tmpZipFile}`, callback);
      },
      // delete the temp downloaded zip file
      fs.remove.bind(null, tmpZipFile)
    ],
    callback);
}

module.exports = downloadAll;
