const tape = require( 'tape' );
const through = require( 'through2' );
const peliasModel = require( 'pelias-model' );
const recordStream = require( '../../lib/streams/recordStream' );

/**
 * Tests whether records read from `test/openaddresses_sample.csv` are created
 * into Document objects with expected values.
 */
tape(
  'importPipelines.createRecordStream() creates Document objects with expected values.',
  function ( test ){
    function createTestRec( lon, lat, postcode, street, number ){
      return { lon: lon, lat: lat, postcode: postcode, street: street, number: number };
    }

    let expectedRecords = [
      createTestRec( -118.0170157, 55.546026835788886, '23042', 'Twp Road', '755 A' ),
      createTestRec( -118.75318353, 55.14959214890181, '712046', 'Rge Road', '34' ),
      createTestRec( -118.8218384, 55.15506788763259, '712078', 'Rge Road', '34' ),
      createTestRec( -118.79719936, 55.153343057595535, '712068', 'Rge Road', '34' ),
      createTestRec( -118.66743097, 55.151807043809917, '712060', 'Rge Road', '34' ),
      createTestRec( -118.74783569, 55.155320792497442, '712082', 'Rge Road', '35' ),
      createTestRec( 1, 2, 'number', 'Too Many Spaces', '36' ),
      createTestRec( 1, 2, 'trim', 'Multiple Spaces', '37' )
    ];
    test.plan(( expectedRecords.length * 7 ) + 1);

    let dataStream = recordStream.create(['test/openaddresses_sample.csv']);
    test.ok( dataStream.readable, 'Stream is readable.' );

    let currentTestRecord = 0;
    let testStream = through.obj(( data, _, next ) => {
      test.ok(
        data instanceof peliasModel.Document, 'Data is a Document object.'
      );

      let expected = expectedRecords[ currentTestRecord ];
      let centroid = data.getCentroid();
      test.ok( expected.lon - centroid.lon < 1e-6, 'Longitude matches.' );
      test.ok( expected.lat - centroid.lat < 1e-6, 'Latitude matches.' );
      test.false( data.getName( 'default' ) , 'Name not set.' );
      test.equal( data.getAddress( 'zip' ), expected.postcode , 'Postcode matches.' );
      test.equal( data.getAddress( 'street' ), expected.street , 'Street matches.' );
      test.equal( data.getAddress( 'number' ), expected.number , 'Number matches.' );

      currentTestRecord++;
      next();
    }, () => {
      test.end();
    });

    dataStream.pipe( testStream );
  }
);

tape( 'Don\'t create records for invalid data.', function ( test ){
  var dataStream = recordStream.create(['test/openaddresses_bad_data.csv']);

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

tape( 'getIdPrefix returns prefix based on OA directory structure', function( test ) {
  var filename = '/base/path/us/ca/san_francisco.csv';
  var basePath = '/base/path';

  var actual = recordStream.getIdPrefix(filename, basePath);

  var expected = 'us/ca/san_francisco';
  test.equal(actual, expected, 'correct prefix generated');
  test.end();
});

tape( 'getIdPrefix handles multiple levels of heirarchy', function ( test ) {
  var filename = '/base/path/cz/countrywide.csv';
  var basePath = '/base/path';

  var actual = recordStream.getIdPrefix(filename, basePath);

  var expected = 'cz/countrywide';
  test.equal(actual, expected, 'correct prefix generated');
  test.end();
});

tape( 'getIdPrefix returns basename without extension when invalid basepath given', function( test ) {
  var filename = '/path/to/a/document.csv';
  var basePath = '/somewhere/else';

  var actual = recordStream.getIdPrefix(filename, basePath);
  var expected = 'document';

  test.equal(actual, expected);
  test.end();
});
