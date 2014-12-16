/**
 * @file Inferences admin values for an OpenAddresses CSV file given its
 * basename.
 */

'use strict';

var fs = require( 'fs' );
var path = require( 'path' );
var util = require( 'util' );
var countryCodes = require( '../data/country_codes.json' );

function createAdminValues( basename, sourceDirPath ){
  var configFilePath = path.join( sourceDirPath, basename + '.json' );

  if( fs.existsSync( configFilePath ) ){
    var configObject = require( './' + configFilePath ).coverage;
  }
  else {
    var basenameParts = basename.split("-");
    configObject = {
      country: basenameParts[0],
      state: basenameParts[1]
    };

    if(basenameParts[ 2 ] !== undefined){
      var cityNameParts = basenameParts[ 2 ].split( '_' );
      configObject.city = cityNameParts.map(
        function capitalizeFirstLetter( currVal, ind, arr ){
          return currVal[ 0 ].toUpperCase() + currVal.slice( 1 );
        }
      ).join( ' ' );
    }
  }

  var admin = {
    country: caseInsensitiveProp( configObject.country, countryCodes ),
    region: configObject.state,
    locality: configObject.county || configObject.city
  };

  if( admin.region !== undefined ){
    var stateCodePath = util.format(
      'data/state_codes/%s.json', configObject.country.toLowerCase()
    );
    if( fs.existsSync( stateCodePath ) ){
      var stateCodes = require( path.join( '..', stateCodePath ) );
      admin.region = caseInsensitiveProp( admin.region, stateCodes );
    }
  }

  if( admin.locality !== undefined ){
    admin.locality = admin.locality[ 0 ].toUpperCase() +
      admin.locality.slice( 1 );
  }

  for( var prop in admin ){
    if( admin[ prop ].length <= 2 ){
      admin[ prop ] = admin[ prop ].toUpperCase();
    }
  }

  return admin;
}

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
