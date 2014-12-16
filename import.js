/**
 * @file Entry-point script for the OpenAddresses import pipeline.
 */

'use strict';

var fs = require( 'fs' );
var path = require( 'path' );

var through = require( 'through2' );
var csvParser = require( 'fast-csv' );
var peliasModel = require( 'pelias-model' );
var createAdminValues = require( './lib/create_admin_values' );

function importOpenAddressesFile( filePath ){
  var baseName = path.basename(filePath, ".csv")
  var adminValues = createAdminValues( baseName );

  var uid = 0;
  var documentCreator = through.obj( function write( record, enc, next ){
    var addrDoc = new peliasModel.Document( 'openaddresses', toString(uid++))
      .setName( 'default', record[ ' NUMBER' ] + ' ' + record[ ' STREET' ] )
      .setAdmin( 'admin0', adminValues.country )
      .setCentroid( { lat: record[ ' LAT' ], lon: record[ 'LON' ] } )

    if( adminValues.region !== undefined ){
      addrDoc.setAdmin( 'admin1', adminValues.region );
    }

    if( adminValues.locality !== undefined ){
      addrDoc.setAdmin( 'admin2', adminValues.locality );
    }

    this.push( addrDoc );
    next();
  });

  // Temporary pipeline endpoint for testing: will be replaced by the real
  // Pelias address pipeline.
  var addressesPipeline = through.obj( function ( address, enc, next ){
    console.log( address );
    next();
  });

  var recordStream = fs.createReadStream( filePath )
    .pipe( csvParser( { headers: true } ) )
    .pipe( documentCreator )
    .pipe( addressesPipeline );
}

function handleUserArgs( argv ){
  var usageMessage = 'TODO: usage message.';
  if( argv.length !== 1 ){
    console.error( usageMessage );
    process.exit( 1 );
  }
  else {
    importOpenAddressesFile( argv[ 0 ] );
  }
}

handleUserArgs( process.argv.slice( 2 ) );
