'use strict';

const tape = require( 'tape' );

const configValidation = require( '../configValidation' );

tape( 'missing datapath should throw error', function(test) {
  const config = {};

  test.throws(() => {
    configValidation.validate(config);
  }, /"datapath" is required/);

  test.end();
});

tape( 'non-string datapath should throw error', function(test) {
  [null, 17, {}, [], false].forEach((value) => {
    const config = {
      datapath: value
    };

    test.throws(() => {
      configValidation.validate(config);
    }, /"datapath" must be a string/);

  });

  test.end();
});

tape( 'non-array files should throw error', function(test) {
  [null, 17, {}, 'string', false].forEach((value) => {
    const config = {
      datapath: 'this is the datapath',
      files: value
    };

    test.throws(() => {
      configValidation.validate(config);
    }, /"files" must be an array/, 'datapath is required');
  });

  test.end();
});

tape( 'non-string elements in files array should throw error', function(test) {
  [null, 17, {}, [], false].forEach((value) => {
    const config = {
      datapath: 'this is the datapath',
      files: [value]
    };

    test.throws(() => {
      configValidation.validate(config);
    }, /"0" must be a string/, 'files elements must be strings');
  });

  test.end();
});

tape( 'non-boolean adminLookup should throw error', function(test) {
  [null, 17, {}, [], 'string'].forEach((value) => {
    const config = {
      datapath: 'this is the datapath',
      adminLookup: value
    };

    test.throws(() => {
      configValidation.validate(config);
    }, /"adminLookup" must be a boolean/);
  });

  test.end();
});

tape( 'non-boolean deduplicate should throw error', function(test) {
  [null, 17, {}, [], 'string'].forEach((value) => {
    const config = {
      datapath: 'this is the datapath',
      deduplicate: value
    };

    test.throws(() => {
      configValidation.validate(config);
    }, /"deduplicate" must be a boolean/);
  });

  test.end();
});

tape( 'unknown config fields should throw error', function(test) {
  const config = {
    datapath: 'this is the datapath',
    unknown: 'value'
  };

  test.throws(() => {
    configValidation.validate(config);
  }, /"unknown" is not allowed/, 'unknown fields should be disallowed');
  test.end();

});

tape( 'configuration with only datapath should not throw error', function(test) {
  const config = {
    datapath: 'this is the datapath'
  };

  test.doesNotThrow(() => {
    configValidation.validate(config);
  }, 'config should be valid');
  test.end();

});

tape( 'valid configuration should not throw error', function(test) {
  const config = {
    datapath: 'this is the datapath',
    deduplicate: false,
    adminLookup: false,
    files: ['file 1', 'file 2']
  };

  test.doesNotThrow(() => {
    configValidation.validate(config);
  }, 'config should be valid');
  test.end();

});
