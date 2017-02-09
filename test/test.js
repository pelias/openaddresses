/**
 * @file The main entry point for the OpenAddresses importer's unit-tests.
 */

'use strict';

require( './configValidation' );
require( './isValidCsvRecord' );
require( './import');
require( './importPipeline');
require( './parameters' );
require( './streams/cleanupStream' );
require( './streams/deduplicatorStream');
require( './streams/documentStream' );
require( './streams/germanicAbbreviationStream');
require( './streams/isUSorCAHouseNumberZero' );
require( './streams/recordStream' );
