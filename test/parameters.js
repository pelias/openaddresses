var tape = require( 'tape' );
var util = require( 'util' );

var temp = require( 'temp' ).track();

var interpretUserArgs = require( '../lib/interpretUserArgs' );

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
      interpretUserArgs.interpretUserArgs( testCase[ 0 ] ), testCase[ 1 ],
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
    var errorObj = interpretUserArgs.interpretUserArgs( testCase );
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
    var result = interpretUserArgs.interpretUserArgs(input);

    test.equal(result.dirPath, temporary_dir, 'path should be equal to specified path');
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
    var result = interpretUserArgs.interpretUserArgs(input, peliasConfig);

    test.equal(result.dirPath, temporary_dir, 'path should be equal to path from config');
    test.end();
  });
});
