/**
 * @file Inferences admin values for an OpenAddresses CSV file given its
 * basename.
 */

'use strict';

var fs = require( 'fs' );
var path = require( 'path' );
var util = require( 'util' );
var countryCodes = require( '../admin_data/country_codes.json' );

/**
 * @return {string} `string` with its first letter capitalized.
 */
function capitalizeFirstLetter( string ){
  return string[ 0 ].toUpperCase() + string.slice( 1 );
}

/**
 * @param {string} basename See `basename` in `createAdminValues()`
 *    documentation comment.
 * @param {string} sourceDirPath See `sourceDirPath` in `createAdminValues()`
 *    documentation comment.
 *
 * @return {object} If a JSON configuration file with the basename `basename`
 *    was found in `sourceDirPath`, return its `coverage` object, which always
 *    (?) contains a `country` key, usually contain `state`/`county`, and
 *    sometimes contain `city`. Otherwise, return an object with the following
 *    keys: `country`, `state`, and `city`, with whatever values could be
 *    derived from `basename` (which contains dash-separated admin names): some
 *    of the corresponding values may be `undefined`.
 */
function getCoverageObject( basename, sourceDirPath ){
  var configFilePath = path.join( sourceDirPath, basename + '.json' );

  if( !fs.existsSync( sourceDirPath ) ){
    console.error(
      'OpenAddresses source file dir `%s` not found.', sourceDirPath
    );
    process.exit( 1 );
  }

  if( fs.existsSync( configFilePath ) ){
    var coverageObj = require( configFilePath ).coverage;
  }
  else {
    var basenameParts = basename.split( '-' );
    var coverageObj = {
      country: basenameParts[ 0 ],
      state: basenameParts[ 1 ],
      city: basenameParts[ 2 ].replace( '_', ' ' )
    };
  }

  return coverageObj;
}

/**
 * Inference the admin values for a particular OpenAddresses dataset by reading
 * its OpenAddresses JSON configuration file/scraping its file basename, and
 * expanding abbreviated names using files in the `/admin_data/` directory.
 *
 * @param {string} basename The basename of the OpenAddresses CSV file being
 *    imported, for which admin values are needed. For instance, `us-ca-marin`
 *    for `us-ca-marin.csv`.
 * @param {string} sourceDirPath The path of the OpenAddresses sources
 *    directory, which contains all OpenAddresses JSON source files.
 *
 * @return {object}
 */
function createAdminValues( basename, sourceDirPath ){
  var coverageObj = getCoverageObject( basename, sourceDirPath );
  var admin = {
    country: caseInsensitiveProp( coverageObj.country, countryCodes ),
    region: coverageObj.state,
    locality: coverageObj.county || coverageObj.city
  };

  if( admin.region !== undefined ){
    var stateCodePath = util.format(
      'admin_data/state_codes/%s.json', coverageObj.country.toLowerCase()
    );
    if( fs.existsSync( stateCodePath ) ){
      var stateCodes = require( path.join( '..', stateCodePath ) );
      admin.region = caseInsensitiveProp( admin.region, stateCodes );
    }
  }

  if( admin.locality !== undefined ){
    var localityNameParts = admin.locality.split( ' ' );
    admin.locality = localityNameParts.map(capitalizeFirstLetter).join( ' ' );
  }

  for( var prop in admin ){
    if( admin[ prop ] !== undefined && admin[ prop ].length <= 2 ){
      admin[ prop ] = admin[ prop ].toUpperCase();
    }
  }

  return admin;
}

/**
 * @param {string} prop
 * @param {object} object
 * @return {object} Either a value in `object` whose key /case insensitively/
 *  matches `prop`, or, if one was not found, `prop` itself. Used for
 *  abbreviated-to-unabbreviated name lookups in `createAdminValues()`.
 */
function caseInsensitiveProp( prop, object ){
  var lowerCaseProp = prop.toLowerCase();
  for( var key in object ){
    if( lowerCaseProp === key.toLowerCase() ){
      return object[ key ];
    }
  }
  return prop;
}

module.exports = createAdminValues;
