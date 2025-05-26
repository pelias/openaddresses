const tape = require( 'tape' );
const schema = require( '../schema' );

function validate(config) {
  const result = schema.validate(config);
  if (result.error) {
    throw new Error(result.error.details[0].message);
  }
}

tape('missing imports should throw error', function(test) {
  const config = {};

  test.throws(validate.bind(null, config), /"imports" is required/);
  test.end();

});

tape('non-object imports should throw error', function(test) {
  [null, 17, 'string', [], true].forEach((value) => {
    const config = {
      imports: value
    };

    test.throws(validate.bind(null, config), /"imports" must be of type object/);
  });

  test.end();

});

tape('missing imports.openaddresses should throw error', function(test) {
  const config = {
    imports: {
    }
  };

  test.throws(validate.bind(null, config), /"imports.openaddresses" is required/);
  test.end();

});

tape('non-object imports.openaddresses should throw error', function(test) {
  [null, 17, 'string', [], true].forEach((value) => {
    const config = {
      imports: {
        openaddresses: value
      }
    };

    test.throws(validate.bind(null, config), /"imports.openaddresses" must be of type object/);
  });

  test.end();

});

tape( 'missing datapath should throw error', function(test) {
  const config = {
    imports: {
      openaddresses: {}
    }
  };

  test.throws(validate.bind(null, config), /"imports.openaddresses.datapath" is required/);
  test.end();

});

tape( 'non-string datapath should throw error', function(test) {
  [null, 17, {}, [], false].forEach((value) => {
    const config = {
      imports: {
        openaddresses: {
          datapath: value
        }
      }
    };

    test.throws(validate.bind(null, config), /"imports.openaddresses.datapath" must be a string/);

  });

  test.end();
});

tape( 'non-array files should throw error', function(test) {
  [null, 17, {}, 'string', false].forEach((value) => {
    const config = {
      imports: {
        openaddresses: {
          datapath: 'this is the datapath',
          files: value
        }
      }
    };

    test.throws(validate.bind(null, config), /"imports.openaddresses.files" must be an array/);
  });

  test.end();
});

tape( 'non-string elements in files array should throw error', function(test) {
  [null, 17, {}, [], false].forEach((value) => {
    const config = {
      imports: {
        openaddresses: {
          datapath: 'this is the datapath',
          files: [value]
        }
      }
    };

    test.throws(validate.bind(null, config),
      /"imports.openaddresses.files\[0\]" must be a string/, 'files elements must be strings');
  });

  test.end();
});

tape( 'non-boolean adminLookup should throw error', function(test) {
  [null, 17, {}, [], 'string'].forEach((value) => {
    const config = {
      imports: {
        openaddresses: {
          datapath: 'this is the datapath',
          adminLookup: value
        }
      }
    };

    test.throws(validate.bind(null, config),
      /"imports.openaddresses.adminLookup" must be a boolean/);
  });

  test.end();
});

tape( 'unknown config fields should throw error', function(test) {
  const config = {
    imports: {
      openaddresses: {
        datapath: 'this is the datapath',
        token: 'abc',
        unknown: 'value'
      }
    }
  };

  test.throws(validate.bind(null, config),
    /"imports.openaddresses.unknown" is not allowed/, 'unknown fields should be disallowed');
  test.end();

});

tape( 'configuration with only datapath & token should not throw error', function(test) {
  const config = {
    imports: {
      openaddresses: {
        datapath: 'this is the datapath',
        token: 'abc'
      }
    }
  };

  test.doesNotThrow(validate.bind(null, config), 'config should be valid');
  test.end();

});

tape( 'valid configuration should not throw error', function(test) {
  const config = {
    imports: {
      openaddresses: {
        datapath: 'this is the datapath',
        token: 'abc',
        adminLookup: false,
        files: ['file 1', 'file 2']
      }
    }
  };

  test.doesNotThrow(validate.bind(null, config), 'config should be valid');
  test.end();

});

tape( 'unknown children of imports should not throw error', function(test) {
  const config = {
    imports: {
      openaddresses: {
        datapath: 'this is the datapath',
        token: 'abc',
        adminLookup: false,
        files: ['file 1', 'file 2']
      },
      other: {}
    }
  };

  test.doesNotThrow(validate.bind(null, config), 'config should be valid');
  test.end();

});

tape( 'unknown children of root should not throw error', function(test) {
  const config = {
    imports: {
      openaddresses: {
        datapath: 'this is the datapath',
        token: 'abc',
        adminLookup: false,
        files: ['file 1', 'file 2']
      }
    },
    other: {}
  };

  test.doesNotThrow(validate.bind(null, config), 'config should be valid');
  test.end();

});
