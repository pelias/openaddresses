/**
 * @file Entry-point script for the OpenAddresses import pipeline.
 */

'use strict';

var fs = require( 'fs' );
var path = require( 'path' );

var through = require( 'through2' );
var csvParser = require( 'fast-csv' );
var peliasAddresses = require( 'pelias-addresses' );
var createAdminValues = require( './lib/create_admin_values' );

function importOpenAddressesFile( filePath ){
  var recordStream = fs.createReadStream( filePath )
    .pipe( csvParser( { headers: true } ) );

  var baseName = path.basename(filePath, ".csv")
  var adminValues = createAdminValues( baseName );

  var addressCreator = through.obj( function write( record, enc, next ){
    this.push( new peliasAddresses.Address(
      undefined,
      record[ ' NUMBER' ],
      record[ ' STREET' ],
      adminValues.locality,
      adminValues.region,
      undefined,
      adminValues.country,
      record[ 'LAT' ],
      record[ 'LON' ],
    ));
    next();
  });

  // Temporary pipeline endpoint for testing: will be replaced by the real
  // Pelias address pipeline.
  var addressesPipeline = through.obj( function ( address, enc, next ){
    console.log( address );
    next();
  });

  recordStream.pipe( addressesPipeline );
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
