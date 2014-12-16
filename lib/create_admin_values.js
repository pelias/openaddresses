/**
 * @file Inferences admin values for an OpenAddresses CSV file given its
 * basename.
 */

'use strict';

var fs = require( 'fs' );
var path = require( 'path' );
var util = require( 'util' );
var countryCodes = require( '../data/country_codes.json' );

/**
 * @return {string} `string` with its first letter capitalized.
 */
function capitalizeFirstLetter( string ){
  return string[ 0 ].toUpperCase() + string.slice( 1 );
}

function createAdminValues( basename, sourceDirPath ){
  var configFilePath = path.join( sourceDirPath, basename + '.json' );

  if( fs.existsSync( configFilePath ) ){
    var coverageObj = require( './' + configFilePath ).coverage;
  }
  else {
    var basenameParts = basename.split("-");
    coverageObj = {
      country: basenameParts[0],
      state: basenameParts[1]
    };

    if(basenameParts[ 2 ] !== undefined){
      var cityNameParts = basenameParts[ 2 ].split( '_' );
      coverageObj.city = cityNameParts.map(capitalizeFirstLetter).join( ' ' );
    }
  }

  var admin = {
    country: caseInsensitiveProp( coverageObj.country, countryCodes ),
    region: coverageObj.state,
    locality: coverageObj.county || coverageObj.city
  };

  if( admin.region !== undefined ){
    var stateCodePath = util.format(
      'data/state_codes/%s.json', coverageObj.country.toLowerCase()
    );
    if( fs.existsSync( stateCodePath ) ){
      var stateCodes = require( path.join( '..', stateCodePath ) );
      admin.region = caseInsensitiveProp( admin.region, stateCodes );
    }
  }

  if( admin.locality !== undefined ){
    admin.locality = capitalizeFirstLetter( admin.locality );
  }

  for( var prop in admin ){
    if( admin[ prop ].length <= 2 ){
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
