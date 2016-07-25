var _ = require('lodash');
var through = require('through2');

function expandGermanicStreetSuffixes(record) {
  if (_.isEqual(record.parent.country_a, ['DEU']) || _.isEqual(record.parent.country_a,['CHE']) ||
    _.isEqual(record.parent.country_a, ['AUT'])){
    var temp = record.address_parts.street.replace(/([^\s]+)str\.?$/i,'$1strasse');
    console.log(temp);
    return temp;
  }
  if (_.isEqual(record.parent.country_a, ['NED'])){
    return record.address_parts.street.replace(/([^\s]+)str\.?$/i,'$1straat');
  }
  if (_.isEqual(record.parent.country_a, ['DMK'])){
    return record.address_parts.street.replace(/([^\s]+)str\.?$/i,'$1stræde');
  }
  if (_.isEqual(record.parent.country_a, ['MDA'])){
    return record.address_parts.street.replace(/([\s]*)str\.?/i,'$1strada');
  }
  return record.address_parts.street;
}

function createGermanAbbStream(){
  return through.obj(function(record, enc, next){
    record.address_parts.street = expandGermanicStreetSuffixes(record);
    //console.log(record);
    next(null, record);
  });
}

module.exports.create = createGermanAbbStream;
