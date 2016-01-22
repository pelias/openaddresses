var tape = require( 'tape' );

var isValidCsvRecord = require( '../lib/isValidCsvRecord' );

tape( 'Identifies invalid CSV records.', function ( test ){
  var records = [
    {LON: '1', LAT: '2', STREET: '3', NUMBER: '', FOO: '', SOME_PROP: ''},
    {LON: '', LAT: '2', STREET: '3', NUMBER: '', FOO: '', SOME_PROP: 'something'},
    {LON: '', LAT: '2', STREET: '', NUMBER: '4', SOME_PROP: 'value'}
  ];
  records.forEach( function ( rec ){
    test.ok( !isValidCsvRecord( rec ), 'Record identified as invalid' );
  });

  var validRecord = {LON: '1', LAT: '2', STREET: '3', NUMBER: '4', SOME_PROP: 'abs'};
  test.ok( isValidCsvRecord( validRecord ), 'Record identified as valid.' );
  test.end();
});
