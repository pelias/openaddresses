/**
 * @file The main entry point for the OpenAddresses importer's unit-tests.
 */

require( './schema' );
require( './isValidCsvRecord' );
require( './import');
require( './importPipeline');
require( './parameters' );
require( './streams/cleanupStream' );
require( './cleanup_v2' );
require( './streams/contentHashStream' );
require( './streams/documentStream' );
require( './streams/gnafMapperStream' );
require( './streams/germanicAbbreviationStream');
require( './streams/isUSorCAHouseNumberZero' );
require( './streams/recordStream' );
