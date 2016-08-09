/**
 * @file The main entry point for the OpenAddresses importer's unit-tests.
 */

'use strict';

require( './parameters' );
require( './isValidCsvRecord' );
require( './streams/adminLookupStream');
require( './streams/cleanupStream' );
require( './streams/deduplicatorStream');
require( './streams/documentStream' );
require( './streams/recordStream' );
require( './streams/isUSorCAHouseNumberZero' );
