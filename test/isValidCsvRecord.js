var tape = require( 'tape' );

var importPipelines = require( '../lib/import_pipelines' );

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
