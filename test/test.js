/**
 * @file The main entry point for the OpenAddresses importer's unit-tests.
 */

'use strict';

var tape = require( 'tape' );
var createAdminValues = require( '../lib/create_admin_values' );

tape( 'createAdminValues.getCoverageObject(): ', function ( test ){
  var testCases = [
    [ 'a-b-c', [ 'a', 'b', 'c' ] ],
    [ 'a-b-c_d', [ 'a', 'b', 'c d' ] ]
  ];

  test.plan( testCases.length );
  for( var ind = 0; ind < testCases.length; ind++ ){
    var actual = createAdminValues.getCoverageObject(
      testCases[ ind ][ 0 ], '/dev/null'
    );
    test.deepEqual( actual, {
      country: testCases[ ind ][ 1 ][ 0 ],
      state: testCases[ ind ][ 1 ][ 1 ],
      city: testCases[ ind ][ 1 ][ 2 ]
    });
  }
});
