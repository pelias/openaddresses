const through = require( 'through2' );
const _ = require('lodash');
const logger = require( 'pelias-logger' ).get( 'openaddresses' );

// helper function that verifies that admin lookup should run
function adminLookupIsEnabled(config) {
  return _.get(config, 'imports.openaddresses.adminLookup', false);
}

function createAdminLookupStream(config,adminLookup) {
  if (adminLookupIsEnabled(config)) {
    logger.info( 'Setting up admin value lookup stream.' );
    const pipResolver = adminLookup.createLocalWofPipResolver();
    return adminLookup.createLookupStream(pipResolver);

  } else {
    return through.obj(function (doc, enc, next) {
      next(null, doc);
    });

  }

}

module.exports = {
  create: createAdminLookupStream
};
