const child_process = require('child_process');
const async = require('async');
const fs = require('fs-extra');
const temp = require('temp');
const logger = require('pelias-logger').get('openaddresses-download');
const _ = require('lodash');

function downloadAll(config, callback) {
  logger.info('Attempting to download all data');

  const targetDir = config.imports.openaddresses.datapath;

  fs.ensureDir(targetDir, (err) => {
    if (err) {
      logger.error(`error making directory ${targetDir}`, err);
      return callback(err);
    }

    const dataHost = config.get('imports.openaddresses.dataHost') || 'https://data.openaddresses.io';

    async.eachSeries(
      [
        // all non-share-alike data
        `${dataHost}/openaddr-collected-global.zip`,

        // all share-alike data
        `${dataHost}/openaddr-collected-global-sa.zip`
      ],
      downloadBundle.bind(null, targetDir, config),
      callback);
  });
}

function downloadBundle(targetDir, config, sourceUrl, callback) {

  const tmpZipFile = temp.path({suffix: '.zip'});
  const referer = config.get('imports.openaddresses.dataReferer') || 'https://pelias-results.openaddresses.io';

  async.series(
    [
      // download the zip file into the temp directory
      (callback) => {
        logger.debug(`downloading ${sourceUrl}`);
        if (_.startsWith(sourceUrl, 's3://')) {
          const s3Options = config.imports.openaddresses.s3Options || '';
          child_process.exec(`aws s3 cp ${sourceUrl} ${tmpZipFile} --only-show-errors ${s3Options}`, callback);
        } else {
          child_process.exec(`curl -s -L -X GET --referer ${referer} -o ${tmpZipFile} ${sourceUrl}`, callback);
        }
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
