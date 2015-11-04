/**
 * @file The main entry point for the OpenAddresses importer's unit-tests.
 */

'use strict';

var peliasModel = require( 'pelias-model' );
var tape = require( 'tape' );
var through = require( 'through2' );
var util = require( 'util' );

var importScript = require( '../import' );
var importPipelines = require( '../lib/import_pipelines' );

tape( 'interpretUserArgs() correctly handles arguments', function ( test ){
  var testCases = [
    [
      [ '--deduplicate', '--admin-values', 'test'  ],
      { deduplicate: true, adminValues: true, dirPath: 'test' },
    ],
    [
      [ '--admin-values', 'test' ],
      { deduplicate: false, adminValues: true, dirPath: 'test' },
    ],
    [
      [ '--deduplicate', 'test' ],
      { deduplicate: true, adminValues: false, dirPath: 'test' },
    ]
  ];

  testCases.forEach( function execTestCase( testCase, ind ){
    test.deepEqual(
      importScript( testCase[ 0 ] ), testCase[ 1 ],
      util.format( 'Arguments case %d passes.', ind )
    );
  });

  var badArguments = [
    [ 'not an arg', 'some dir' ],
    [ '--deduplicate', 'not an arg', 'some dir' ],
    [ '--deduplicate', 'not a dir' ],
    [ '--deduplicate', 'package.json' ],
  ];
  badArguments.forEach( function execTestCase( testCase, ind ){
    var errorObj = importScript( testCase );
    test.ok(
      'exitCode' in errorObj &&  'errMessage' in errorObj,
      'Invalid arguments yield an error object: ' + ind
    );
  });
  test.end();
});

/**
 * Tests whether records read from `test/openaddresses_sample.csv` are created
 * into Document objects with expected values.
 */
tape(
  'importPipelines.createRecordStream() creates Document objects with expected values.',
  function ( test ){
    function createTestRec( lon, lat ){
      return { lon: lon, lat: lat };
    }

    var expectedRecords = [
      createTestRec( -118.0170157, 55.546026835788886, '23042 Twp Road 755 A' ),
      createTestRec( -118.75318353, 55.14959214890181, '712046 Rge Road 34' ),
      createTestRec( -118.8218384, 55.15506788763259, '712078 Rge Road 34' ),
      createTestRec( -118.79719936, 55.153343057595535, '712068 Rge Road 34' ),
      createTestRec( -118.66743097, 55.151807043809917, '712060 Rge Road 34' ),
      createTestRec( -118.74783569, 55.155320792497442, '712082 Rge Road 35' ),
      createTestRec( 1, 2, 'number too many spaces' ),
      createTestRec( 1, 2, 'trim multiple spaces' )
    ];
    test.plan( expectedRecords.length * 3 + 1);

    var dataStream = importPipelines.createRecordStream(
      'test/openaddresses_sample.csv'
    );
    test.ok( dataStream.readable, 'Stream is readable.' );
    var testStream = through.obj(function ( data, enc, next ){
      test.ok(
        data instanceof peliasModel.Document, 'Data is a Document object.'
      );

      var expected = expectedRecords.splice( 0, 1 )[ 0 ];
      var centroid = data.getCentroid();
      test.ok( expected.lon - centroid.lon < 1e-6, 'Longitude matches.' );
      test.ok( expected.lat - centroid.lat < 1e-6, 'Latitude matches.' );
      next();
    });
    dataStream.pipe( testStream );
  }
);

tape( 'Don\'t create records for invalid data.', function ( test ){
  var dataStream = importPipelines.createRecordStream(
    'test/openaddresses_bad_data.csv'
  );

  dataStream.pipe( through.obj(
    function write( data, _, next ){
      test.fail( 'Document was created from bad data: ' + JSON.stringify( data, undefined, 4 ) );
      next();
    },
    function end( done ){
      test.pass( 'No Documents were created from bad data.' );
      test.end();
      done();
    }
  ));
});

tape(
  'importPipeline.createPeliasElasticsearchPipeline() interface',
  function ( test ){
    test.plan( 1 );
    var esPipeline = importPipelines.createPeliasElasticsearchPipeline();
    test.ok( esPipeline.writable, 'Stream is writable' );
  }
);

tape( 'Identifies invalid CSV records.', function ( test ){
  var records = [
    {LON: '1', LAT: '2', STREET: '3', NUMBER: '', FOO: '', SOME_PROP: ''},
    {LON: '', LAT: '2', STREET: '3', NUMBER: '', FOO: '', SOME_PROP: 'something'},
    {LON: '', LAT: '2', STREET: '', NUMBER: '4', SOME_PROP: 'value'}
  ];
  records.forEach( function ( rec ){
    test.ok( !importPipelines.isValidCsvRecord( rec ), 'Record identified as invalid' );
  });

  var validRecord = {LON: '1', LAT: '2', STREET: '3', NUMBER: '4', SOME_PROP: 'abs'};
  test.ok( importPipelines.isValidCsvRecord( validRecord ), 'Record identified as valid.' );
  test.end();
});
