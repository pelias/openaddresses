var through2 = require('through2');
var _ = require('lodash');

module.exports.create = function create() {
  return through2.obj(function(record, enc, next) {
    record.address_parts.number = _.trimStart(record.address_parts.number, '0');

    this.push(record);
    next();

  });
}
