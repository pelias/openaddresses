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

tape( 'Identifies CSV files that have incorrect columns', function( test) {
  var record = { 'notLat': 'asdf', 'notLon': 5 };

  test.ok( !isValidCsvRecord( record ), 'Record identified as invalid' );
  test.end();
});

tape('complete record but house number is literal word `null` should return false', function(test) {
  var record = {
    LON: '1', LAT: '2', NUMBER: 'NuLl', STREET: 'Street'
  };

  test.ok( !isValidCsvRecord(record), 'Record identified as invalid');
  test.end();

});

tape('complete record but house number is literal word `undefined` should return false', function(test) {
  var record = {
    LON: '1', LAT: '2', NUMBER: 'uNdEfInEd', STREET: 'Street'
  };

  test.ok( !isValidCsvRecord(record), 'Record identified as invalid');
  test.end();

});

tape('complete record but house number is literal word `unavailable` should return false', function(test) {
  var record = {
    LON: '1', LAT: '2', NUMBER: 'uNaVaIlAbLe', STREET: 'Street'
  };

  test.ok( !isValidCsvRecord(record), 'Record identified as invalid');
  test.end();

});

tape('complete record but street contains literal word `null` should return false', function(test) {
  var records = [
    { LON: '1', LAT: '2', NUMBER: 'Number', STREET: 'NuLl Name St' },
    { LON: '1', LAT: '2', NUMBER: 'Number', STREET: 'South NULL St' },
    { LON: '1', LAT: '2', NUMBER: 'Number', STREET: 'South Name null' }
  ];

  records.forEach( function ( rec ){
    test.ok( !isValidCsvRecord( rec ), 'Record identified as invalid' );
  });

  test.end();

});

tape('complete record but street contains literal word `undefined` should return false', function(test) {
  var records = [
    { LON: '1', LAT: '2', NUMBER: 'Number', STREET: 'uNdEfInEd Name St' },
    { LON: '1', LAT: '2', NUMBER: 'Number', STREET: 'South UNDEFINED St' },
    { LON: '1', LAT: '2', NUMBER: 'Number', STREET: 'South Name undefined' }
  ];

  records.forEach( function ( rec ){
    test.ok( !isValidCsvRecord( rec ), 'Record identified as invalid' );
  });

  test.end();

});

tape('complete record but street contains literal word `unavailable` should return false', function(test) {
  var records = [
    { LON: '1', LAT: '2', NUMBER: 'Number', STREET: 'uNaVaIlAbLe Name St' },
    { LON: '1', LAT: '2', NUMBER: 'Number', STREET: 'South UNAVAILABLE St' },
    { LON: '1', LAT: '2', NUMBER: 'Number', STREET: 'South Name unavailable' }
  ];

  records.forEach( function ( rec ){
    test.ok( !isValidCsvRecord( rec ), 'Record identified as invalid' );
  });

  test.end();

});

tape('street with substring `null` but not on word boundary should return true', function(test) {
  var record = {
    LON: '1', LAT: '2', NUMBER: 'Number', STREET: 'Snull Street Nulls'
  };

  test.ok( isValidCsvRecord(record), 'Record identified as valid');
  test.end();

});

tape('street with substring `undefined` but not on word boundary should return true', function(test) {
  var record = {
    LON: '1', LAT: '2', NUMBER: 'Number', STREET: 'Sundefined Street Undefineds'
  };

  test.ok( isValidCsvRecord(record), 'Record identified as valid');
  test.end();

});

tape('street with substring `unavailable` but not on word boundary should return true', function(test) {
  var record = {
    LON: '1', LAT: '2', NUMBER: 'Number', STREET: 'Sunavailable Street Unavailables'
  };

  test.ok( isValidCsvRecord(record), 'Record identified as valid');
  test.end();

});
