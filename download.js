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

  if (!_.isEmpty(config.imports.openaddresses.files)) {
    downloadFiltered(callback);
  }
  else {
    downloadAll(callback);
  }
}

function downloadAll(callback) {
  logger.info('Attempting to download all data');

  const targetDir = config.imports.openaddresses.datapath;

  fs.ensureDir(targetDir, (err) => {
    if (err) {
      logger.error(`error making directory ${targetDir}`, err);
      return callback(err);
    }

    async.each(
      [
        // all non-share-alike data
        'https://s3.amazonaws.com/data.openaddresses.io/openaddr-collected-global.zip',

        // leave this out for now since we don't download it in production currently
        // all share-alike data
        // 'https://s3.amazonaws.com/data.openaddresses.io/openaddr-collected-global-sa.zip'
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
        child_process.exec(`curl -L -X GET -o ${tmpZipFile} ${sourceUrl}`, callback);
      },
      // unzip file into target directory
      (callback) => {
        logger.debug(`unzipping ${tmpZipFile} to ${targetDir}`);
        child_process.exec(`unzip -o -qq -d ${targetDir} ${tmpZipFile}`, callback);
      }
    ],
    callback);
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
        logger.debug(`unzipping ${tmpZipFile} to ${targetDir}`);
        child_process.exec(`unzip -o -qq -d ${targetDir} ${tmpZipFile}`, callback);
      }
    ],
    callback);
}
