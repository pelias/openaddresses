'use strict';

const child_process = require('child_process');
const async = require('async');
const fs = require('fs-extra');
const tmp = require('tmp');
const _ = require('lodash');
const logger = require('pelias-logger').get('download');

function downloadFiltered(config, callback) {
  const targetDir = config.imports.openaddresses.datapath;
  const files = config.imports.openaddresses.files;

  logger.info(`Attempting to download selected data files: ${files}`);

  fs.ensureDir(targetDir, (err) => {
    if (err) {
      logger.error(`error making directory ${targetDir}`, err);
      return callback(err);
    }

    async.each(files, downloadSource.bind(null, targetDir), callback);

  });

}

function downloadSource(targetDir, file, callback) {
  logger.info(`Downloading ${file}`);

  const source = _.replace(file, '.csv', '.zip');
  const sourceUrl = `https://results.openaddresses.io/latest/run/${source}`;
  const tmpZipFile = tmp.tmpNameSync({postfix: '.zip'});

  async.series(
    [
      // download the zip file into the temp directory
      (callback) => {
        logger.debug(`downloading ${sourceUrl}`);
        child_process.exec(`curl -L -X GET -o ${tmpZipFile} ${sourceUrl}`, callback);
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

module.exports = downloadFiltered;