'use strict';

const path = require('path');
const child_process = require('child_process');
const async = require('async');
const fs = require('fs-extra');
const tmp = require('tmp');
const _ = require('lodash');
const config = require( 'pelias-config' ).generate(require('./schema'));
const logger = require('pelias-logger').get('download');

let tmpDir;

if (require.main === module) {
  download((err) => {
    if (err) {
      logger.error('Failed to download data', err);
      process.exit(1);
    }
    logger.info('All done!');
  });
}

function download(callback) {
  tmpDir = tmp.dirSync();

  function cleanup(err) {
    // this will delete temp directory
    //fs.removeSync(tmpDir.name);
    callback(err);
  }

  if (!_.isEmpty(config.imports.openaddresses.files)) {
    downloadFiltered(cleanup);
  }
  else {
    downloadAll(cleanup);
  }
}

function downloadAll(callback) {
  logger.info('Attempting to download all data');
  callback(new Error('not implemented'));
}

function downloadFiltered(callback) {
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

  // first convert the file path to the source name, like 'us/ny/city_of_new_york.csv' -> 'us-ny-city_of_new_york.zip'
  const source = _.replace(file, '.csv', '.zip');
  const sourceUrl = `https://results.openaddresses.io/latest/run/${source}`;
  const tmpZipFile = path.join(tmpDir.name, _.replace(source, new RegExp('/', 'g'), '-'));

  async.series(
    [
      // download the zip file into the temp directory
      (callback) => {
        logger.debug(`downloading ${sourceUrl}`);
        child_process.exec(`curl -L -X GET -o ${tmpZipFile} ${sourceUrl}`, callback);
      },
      // unzip file into target directory
      (callback) => {
        logger.debug(`unziping ${tmpZipFile} to ${targetDir}`);
        child_process.exec(`unzip -o -d ${targetDir} ${tmpZipFile}`, callback);
      }
    ],
    callback);
}
