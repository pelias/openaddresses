'use strict';

const through = require( 'through2' );
const _ = require('lodash');
const logger = require( 'pelias-logger' ).get( 'openaddresses' );

// helper function that verifies that deduplicate should run
function deduplicateIsEnabled(config) {
  return _.get(config, 'imports.openaddresses.deduplicate', false);
}

function createDeduplicatorStream(config,dedupe) {
  if (deduplicateIsEnabled(config)) {
    logger.info( 'Setting up deduplicator.' );
    return dedupe();

  } else {
    return through.obj(function (doc, enc, next) {
      next(null, doc);
    });

  }

}

module.exports = {
  create: createDeduplicatorStream
};
