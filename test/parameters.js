var tape = require( 'tape' );
var path = require( 'path' );
var fs = require('fs');

var temp = require( 'temp' ).track();

var parameters = require( '../lib/parameters' );

tape( 'interpretUserArgs() correctly handles arguments', function ( test ){
  var testCase = [
      [ 'test'  ],
      { dirPath: 'test' },
  ];

  test.deepEqual(
    parameters.interpretUserArgs( testCase[ 0 ] ), testCase[ 1 ],
    'Basic arguments case passes.'
  );

  var badArguments = [
    [ 'not an arg', 'some dir' ],
    [ 'not an arg', 'some dir' ],
    [ 'not a dir' ],
    [ 'package.json' ],
  ];
  badArguments.forEach( function execTestCase( testCase, ind ){
    var errorObj = parameters.interpretUserArgs( testCase );
    test.ok(
      'exitCode' in errorObj &&  'errMessage' in errorObj,
      'Invalid arguments yield an error object: ' + ind
    );
  });
  test.end();
});

tape('interpretUserArgs returns given path as dirPath', function(test) {
  temp.mkdir('tmpdir', function(err, temporary_dir) {

    var input = [temporary_dir];
    var result = parameters.interpretUserArgs(input);

    test.equal(result.dirPath, temporary_dir, 'path should be equal to specified path');
    test.end();
  });
});

tape('intepretUserArgs normalizes path given as parameter', function(test) {
  temp.mkdir('tmpdir', function(err, temporary_dir) {
    var input_dir = temporary_dir + path.sep + path.sep;

    var input = [input_dir];
    var result = parameters.interpretUserArgs(input);

    var expected_dir = path.normalize(input_dir);
    test.equal(result.dirPath, expected_dir, 'path should be equal to specified path');
    test.end();
  });
});

tape('interpretUserArgs returns dir from pelias config if no dir specified on command line', function(test) {
  temp.mkdir('tmpdir2', function(err, temporary_dir) {
    var peliasConfig = {
      imports: {
        openaddresses: {
          datapath: temporary_dir
        }
      }
    };

    var input = [];
    var result = parameters.interpretUserArgs(input, peliasConfig);

    test.equal(result.dirPath, temporary_dir, 'path should be equal to path from config');
    test.end();
  });
});

tape('interpretUserArgs returns normalized path from config', function(test) {
  temp.mkdir('tmpdir2', function(err, temporary_dir) {
    var input_dir = path.sep + '.' + temporary_dir;
    var peliasConfig = {
      imports: {
        openaddresses: {
          datapath: input_dir
        }
      }
    };

    var input = [];
    var result = parameters.interpretUserArgs(input, peliasConfig);

    var expected_dir = path.normalize(input_dir);
    test.equal(result.dirPath, expected_dir, 'path should be equal to path from config');
    test.end();
  });
});

tape('getFileList returns all .csv path names when config has empty files list', function(test) {
  temp.mkdir('multipleFiles', function(err, temp_dir) {
    // add some files to the data path to be globbed
    fs.mkdirSync(path.join(temp_dir, 'dirA'));
    fs.writeFileSync(path.join(temp_dir, 'dirA', 'fileA.csv'), '');

    fs.mkdirSync(path.join(temp_dir, 'dirB'));
    fs.writeFileSync(path.join(temp_dir, 'dirB', 'fileB.csv'), '');

    fs.writeFileSync(path.join(temp_dir, 'fileC.csv'), '');

    // should not be included since it's not a .csv file
    fs.writeFileSync(path.join(temp_dir, 'fileD.txt'), '');

    var peliasConfig = {
      imports: {
        openaddresses: {
          files: []
        }
      }
    };
    var args = {
      dirPath: temp_dir
    };

    var actual = parameters.getFileList(peliasConfig, args);

    test.equal(actual.length, 3);
    test.ok(actual.find((f) => f === path.join(temp_dir, 'dirA', 'fileA.csv')));
    test.ok(actual.find((f) => f === path.join(temp_dir, 'dirB', 'fileB.csv')));
    test.ok(actual.find((f) => f === path.join(temp_dir, 'fileC.csv')));
    test.end();

  });
});

tape('getFileList returns all .csv path names when config doesn\'t have files property', function(test) {
  temp.mkdir('multipleFiles', function(err, temp_dir) {
    // add some files to the data path to be globbed
    fs.mkdirSync(path.join(temp_dir, 'dirA'));
    fs.writeFileSync(path.join(temp_dir, 'dirA', 'fileA.csv'), '');

    fs.mkdirSync(path.join(temp_dir, 'dirB'));
    fs.writeFileSync(path.join(temp_dir, 'dirB', 'fileB.csv'), '');

    fs.writeFileSync(path.join(temp_dir, 'fileC.csv'), '');

    // should not be included since it's not a .csv file
    fs.writeFileSync(path.join(temp_dir, 'fileD.txt'), '');

    var peliasConfig = {
      imports: {
        openaddresses: {
        }
      }
    };
    var args = {
      dirPath: temp_dir
    };

    var actual = parameters.getFileList(peliasConfig, args);

    test.equal(actual.length, 3);
    test.ok(actual.find((f) => f === path.join(temp_dir, 'dirA', 'fileA.csv')));
    test.ok(actual.find((f) => f === path.join(temp_dir, 'dirB', 'fileB.csv')));
    test.ok(actual.find((f) => f === path.join(temp_dir, 'fileC.csv')));
    test.end();

  });
});

tape('getFileList returns fully qualified path names when config has a files list', function(test) {
  temp.mkdir('multipleFiles', function(err, temporary_dir) {
    var peliasConfig = {
      imports: {
        openaddresses: {
          files: ['filea.csv', 'fileb.csv']
        }
      }
    };
    var args = {
      dirPath: temporary_dir
    };

    var expected = [path.join(temporary_dir, 'filea.csv'), path.join(temporary_dir, 'fileb.csv')];

    var actual = parameters.getFileList(peliasConfig, args);

    test.deepEqual(actual, expected, 'file names should be equal');
    test.end();
  });
});


tape('getParallelism prefers OPENADDRESSES_PARALLELISM over the config', function(test) {
  const config = { imports: { openaddresses: { parallelism: 3 } } };

  test.equal(parameters.getParallelism(config, {}), 3, 'config used when no env var');
  test.equal(parameters.getParallelism(config, { OPENADDRESSES_PARALLELISM: '2' }), 2, 'env var wins');
  test.equal(parameters.getParallelism(config, { OPENADDRESSES_PARALLELISM: '1' }), 1, 'env var can lower it');
  test.equal(parameters.getParallelism({ imports: { openaddresses: {} } }, {}), 1, 'defaults to 1');
  test.end();
});

tape('getParallelism ignores invalid OPENADDRESSES_PARALLELISM values', function(test) {
  const config = { imports: { openaddresses: { parallelism: 3 } } };

  ['', '0', '-2', '1.5', 'lots'].forEach((bad) => {
    test.equal(parameters.getParallelism(config, { OPENADDRESSES_PARALLELISM: bad }), 3, `'${bad}' ignored`);
  });
  test.end();
});
