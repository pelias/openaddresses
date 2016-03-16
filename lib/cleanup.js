var _ = require('lodash');

function removeLeadingZerosFromStreet(token) {
  return token.replace(/^(?:0*)([1-9]\d*(st|nd|rd|th))/,'$1');
}

function capitalizeProperly(streetname){
  if (streetname.toUpperCase() === streetname || streetname.toLowerCase() === streetname){
    streetname = _.capitalize(streetname);
  }
  return streetname;
}

// expand '-str.' to '-strasse'
// note: '-straße' is only used in Germany, other countries like
// switzerland use 'strasse'.
function expandGermanicStreetSuffixes(token) {
  return token.replace(/([^\s]+)str\.?$/i,'$1strasse');
}

function cleanupStreetName(input) {
  return input.split(/\s/)
  .map(expandGermanicStreetSuffixes)
  .map(removeLeadingZerosFromStreet)
  .filter(function(part){
    return part.length > 0;
  }).map(capitalizeProperly)
  .join(' ');
}

module.exports = {
  streetName: cleanupStreetName
};
