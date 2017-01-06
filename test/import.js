'use strict';

const tape = require( 'tape' );

const proxyquire = require('proxyquire').noCallThru();

tape( 'configValidation throwing error should rethrow', function(test) {
  test.throws(function() {
    proxyquire('../import', {
      './configValidation': {
        validate: () => {
          throw Error('config is not valid');
        }
      }
    })();

  }, /config is not valid/);

  test.end();

});
