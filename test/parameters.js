var tape = require( 'tape' );
var util = require( 'util' );
var path = require( 'path' );

var temp = require( 'temp' ).track();

var parameters = require( '../lib/parameters' );

tape( 'interpretUserArgs() correctly handles arguments', function ( test ){
  var testCases = [
    [
      [ '--deduplicate', '--admin-values', 'test'  ],
      { deduplicate: true, adminValues: true, dirPath: 'test',
	'parallel-count': undefined, 'parallel-id': undefined, 'language': undefined },
    ],
    [
      [ '--admin-values', 'test' ],
      { deduplicate: false, adminValues: true, dirPath: 'test',
	'parallel-count': undefined, 'parallel-id': undefined, 'language': undefined },
    ],
    [
      [ '--deduplicate', 'test' ],
      { deduplicate: true, adminValues: false, dirPath: 'test',
	'parallel-count': undefined, 'parallel-id': undefined, 'language': undefined },
    ]
  ];

  testCases.forEach( function execTestCase( testCase, ind ){
    test.deepEqual(
      parameters.interpretUserArgs( testCase[ 0 ] ), testCase[ 1 ],
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

tape('getFileList handles parallel builds', function(test) {
  var peliasConfig = {
    imports: {
      openaddresses: {
        files: ['filea.csv', 'fileb.csv', 'filec.csv']
      }
    }
  };

  temp.mkdir('parallelBuilds', function(err, temporary_dir) {
    test.test('3 workers, id 0', function(t) {
      var args = {
        dirPath: temporary_dir,
        'parallel-count': 3,
        'parallel-id': 0
      };

      var expected = [path.join(temporary_dir, 'filea.csv')];

      var actual = parameters.getFileList(peliasConfig, args);

      t.deepEqual(actual, expected, 'only first file is indexed');
      t.end();
    });

    test.test('3 workers, id 1', function(t) {
      var args = {
        dirPath: temporary_dir,
        'parallel-count': 3,
        'parallel-id': 1
      };

      var expected = [path.join(temporary_dir, 'fileb.csv')];

      var actual = parameters.getFileList(peliasConfig, args);

      t.deepEqual(actual, expected, 'only second file indexed');
      t.end();
    });

    test.test('3 workers, id 2', function(t) {
      var args = {
        dirPath: temporary_dir,
        'parallel-count': 3,
        'parallel-id': 2
      };

      var expected = [path.join(temporary_dir, 'filec.csv')];

      var actual = parameters.getFileList(peliasConfig, args);

      t.deepEqual(actual, expected, 'only third file indexed');
      t.end();
    });

    test.test('3 workers, id 3', function(t) {
      var args = {
        dirPath: temporary_dir,
        'parallel-count': 3,
        'parallel-id': 3
      };

      var expected = [];

      var actual = parameters.getFileList(peliasConfig, args);

      t.deepEqual(actual, expected, 'file list is empty');
      t.end();
    });
  });
});
