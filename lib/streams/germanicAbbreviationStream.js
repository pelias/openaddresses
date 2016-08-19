var through = require('through2');

// match strings ending in one of: ['str.', 'Str.', 'str', 'Str']
var REGEX_MATCH_STREET_ABBR_SUFFIX = /([^\s]+)(s)tr\.?$/i;

// match strings starting with one of: ['str. ', 'Str. ', 'str ', 'Str ']
var REGEX_MATCH_STREET_ABBR_PREFIX = /^([\s]*)(s)tr\.?\s/i;


function expandStrasse(token) {
  return token.replace(REGEX_MATCH_STREET_ABBR_SUFFIX,'$1$2trasse');
}

// expand '-str.' to '-straat'
function expandStraat(token) {
  return token.replace(REGEX_MATCH_STREET_ABBR_SUFFIX,'$1$2traat');
}

// expand '-str.' to '-stræde'
function expandStræde(token) {
  return token.replace(REGEX_MATCH_STREET_ABBR_SUFFIX,'$1$2træde');
}

// expand '-str.' to '-strada'
function expandStrada(token) {
  return token.replace(REGEX_MATCH_STREET_ABBR_PREFIX,'$1$2trada ');
}

function expandGermanicStreetSuffixes(record) {
  var countryCode = record.parent.country_a[0];

  if (countryCode === 'DEU' || countryCode ==='CHE' || countryCode === 'AUT'){
    return expandStrasse(record.address_parts.street);
  }
  if (countryCode === 'NLD'){
    return expandStraat(record.address_parts.street);
  }
  if (countryCode === 'DNK'){
    return expandStræde(record.address_parts.street);
  }
  if (countryCode=== 'MDA'){
    return expandStrada(record.address_parts.street);
  }
  return record.address_parts.street;
}

function createGermanicAbbStream(){
  return through.obj(function(record, enc, next){
    record.address_parts.street = expandGermanicStreetSuffixes(record);

    next(null, record);
  });
}

module.exports.create = createGermanicAbbStream;
