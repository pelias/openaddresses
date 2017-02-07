'use strict';

const through = require( 'through2' );
const _ = require('lodash');
const logger = require( 'pelias-logger' ).get( 'openaddresses' );
const wofAdminLookup = require('pelias-wof-admin-lookup');

// helper function that verifies that admin lookup should run
function adminLookupIsEnabled(config) {
  return _.get(config, 'imports.openaddresses.adminLookup', false);
}

function createAdminLookupStream(config) {
  if (adminLookupIsEnabled(config)) {
    logger.info( 'Setting up admin value lookup stream.' );
    return wofAdminLookup.createLookupStream();

  } else {
    return through.obj(function (doc, enc, next) {
      next(null, doc);
    });

  }

}

module.exports = {
  create: createAdminLookupStream
};
