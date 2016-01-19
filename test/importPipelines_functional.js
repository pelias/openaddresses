var tape = require( 'tape' );
var through = require( 'through2' );

var peliasModel = require( 'pelias-model' );

var importPipelines = require( '../lib/import_pipelines' );

/**
 * Tests whether records read from `test/openaddresses_sample.csv` are created
 * into Document objects with expected values.
 */
tape(
  'importPipelines.createRecordStream() creates Document objects with expected values.',
  function ( test ){
    function createTestRec( lon, lat, name ){
      return { lon: lon, lat: lat, name: name };
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
    test.plan( expectedRecords.length * 4 + 1);

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
      test.equal( expected.name, data.getName( 'default' ), 'Name matches.' );
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
