/**
 * @file The main entry point for the OpenAddresses importer's unit-tests.
 */

'use strict';

require( './parameters' );
require( './isValidCsvRecord' );
require( './streams/elasticsearchStream' );
require( './streams/cleanupStream' );
require( './streams/documentStream' );
require( './streams/recordStream' );
