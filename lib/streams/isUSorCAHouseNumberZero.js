var filter = require('through2-filter');
var _ = require('lodash');

var allZeros = /^0+$/;

function isZeroHouseNumber(record) {
  return allZeros.test(record.address_parts.number);
}

function isUSorCA(record) {
  return _.isEqual(record.parent.country_a, ['USA']) ||
          _.isEqual(record.parent.country_a, ['CAN']);
}

module.exports.create = function create() {
  return filter.obj(function(record) {
    if (isZeroHouseNumber(record) && isUSorCA(record)) {
      return false;
    }
    return true;
  });
};
