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

tape( 'createAdminValues.create(): ', function ( test ){
  var testCases = [
    [ 'us-ny-ab', [ 'United States', 'New York', 'AB' ] ],
    [ 'cA-On-abc_def', [ 'Canada', 'Ontario', 'Abc Def' ] ],
    [ 'US-ZT-a_small_town', [ 'United States', 'ZT', 'A Small Town' ] ],
    [ 'ZZ-aa-a_small_town', [ 'ZZ', 'AA', 'A Small Town' ] ]
  ];

  test.plan( testCases.length );
  for( var ind = 0; ind < testCases.length; ind++ ){
    var actual = createAdminValues.create(
      testCases[ ind ][ 0 ], '/dev/null'
    );
    test.deepEqual( actual, {
      country: testCases[ ind ][ 1 ][ 0 ],
      region: testCases[ ind ][ 1 ][ 1 ],
      locality: testCases[ ind ][ 1 ][ 2 ]
    });
  }
});
