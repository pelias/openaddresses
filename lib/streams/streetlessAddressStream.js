const _ = require('lodash');
const through2 = require('through2');

/*
 * a stream that uses the city name in place of a missing street name.
 *
 * see: https://github.com/pelias/pelias/issues/642
 */

function createStreetlessAddressStream() {
  return through2.obj((record, enc, next) => {
    if (_.has(record, 'NUMBER') && _.has(record, 'CITY') && !_.has(record, 'STREET')){
      _.set(record, 'STREET', _.get(record, 'CITY'));
    }
    next(null, record);
  });
}

module.exports = {
  create: createStreetlessAddressStream
};
