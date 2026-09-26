const tape = require( 'tape' );

const fileContext = require( '../lib/fileContext' );

tape( 'create derives country code from the id prefix', function( test ) {
  const context = fileContext.create('/base/path/us/ca/san_francisco.csv', 'us/ca/san_francisco');
  test.deepEqual(context, {
    path: '/base/path/us/ca/san_francisco.csv',
    idPrefix: 'us/ca/san_francisco',
    countryCode: 'us'
  });
  test.end();
});

tape( 'attach keeps the context out of enumerable keys', function( test ) {
  const row = fileContext.attach({ NUMBER: '1' }, fileContext.create('/a/b.csv', 'b'));
  test.deepEqual(Object.keys(row), ['NUMBER']);
  test.equal(JSON.stringify(row), '{"NUMBER":"1"}');
  test.equal(fileContext.get(row).idPrefix, 'b');
  test.end();
});

tape( 'getIdPrefix returns prefix based on OA directory structure - csv', function( test ) {
  var filename = '/base/path/us/ca/san_francisco.csv';
  var basePath = '/base/path';

  var actual = fileContext.getIdPrefix(filename, basePath);

  var expected = 'us/ca/san_francisco';
  test.equal(actual, expected, 'correct prefix generated');
  test.end();
});

tape( 'getIdPrefix handles multiple levels of heirarchy - csv', function ( test ) {
  var filename = '/base/path/cz/countrywide.csv';
  var basePath = '/base/path';

  var actual = fileContext.getIdPrefix(filename, basePath);

  var expected = 'cz/countrywide';
  test.equal(actual, expected, 'correct prefix generated');
  test.end();
});

tape( 'getIdPrefix returns basename without extension when invalid basepath given - csv', function( test ) {
  var filename = '/path/to/a/document.csv';
  var basePath = '/somewhere/else';

  var actual = fileContext.getIdPrefix(filename, basePath);
  var expected = 'document';

  test.equal(actual, expected);
  test.end();
});

tape( 'getIdPrefix returns prefix based on OA directory structure - geojson', function( test ) {
  var filename = '/base/path/us/ca/san_francisco.geojson';
  var basePath = '/base/path';

  var actual = fileContext.getIdPrefix(filename, basePath);

  var expected = 'us/ca/san_francisco';
  test.equal(actual, expected, 'correct prefix generated');
  test.end();
});

tape( 'getIdPrefix handles multiple levels of heirarchy - geojson', function ( test ) {
  var filename = '/base/path/cz/countrywide.geojson';
  var basePath = '/base/path';

  var actual = fileContext.getIdPrefix(filename, basePath);

  var expected = 'cz/countrywide';
  test.equal(actual, expected, 'correct prefix generated');
  test.end();
});

tape( 'getIdPrefix returns basename without extension when invalid basepath given - geojson', function( test ) {
  var filename = '/path/to/a/document.geojson';
  var basePath = '/somewhere/else';

  var actual = fileContext.getIdPrefix(filename, basePath);
  var expected = 'document';

  test.equal(actual, expected);
  test.end();
});
