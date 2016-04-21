var filter = require('through2-filter');
var _ = require('lodash');

function isUSorCA(record) {
  return _.isEqual(record.parent.country_a, ['USA']) ||
          _.isEqual(record.parent.country_a, ['CAN']);
}

module.exports.create = function create() {
  return filter.obj(function(record) {
    if (record.address_parts.number === '0' && isUSorCA(record)) {
      return false;
    }
    return true;
  });
};
