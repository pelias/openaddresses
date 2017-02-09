'use strict';

const tape = require( 'tape' );

const proxyquire = require('proxyquire').noCallThru();

tape( 'config.generate throwing error should rethrow', (test) => {
  test.throws(() => {
    proxyquire('../import', {
      './schema': 'this is the schema',
      'pelias-config': {
        generate: (schema) => {
          // the schema passed to generate should be the require'd schema
          test.equals(schema, 'this is the schema');

          throw Error('config is not valid');
        }
      }
    })();

  }, /config is not valid/);

  test.end();

});
