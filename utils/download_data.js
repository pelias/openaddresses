'use strict';

const _ = require('lodash');
const config = require( 'pelias-config' ).generate(require('../schema'));
const logger = require('pelias-logger').get('download');

const downloadAll = require('./download_all');
const downloadFiltered = require('./download_filtered');

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
  if (!_.isEmpty(config.imports.openaddresses.files)) {
    downloadFiltered(config, callback);
  }
  else {
    downloadAll(config, callback);
  }
}

module.exports = download;