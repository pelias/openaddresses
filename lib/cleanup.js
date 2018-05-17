var _ = require('lodash');

function removeLeadingZerosFromStreet(token) {
  return token.replace(/^(?:0*)([1-9]\d*(st|nd|rd|th))/,'$1');
}

const directionals = ['NE', 'NW', 'SE', 'SW'];

function capitalizeProperly(token){
  const lowercase = token.toLowerCase();
  const uppercase = token.toUpperCase();

  // token is a directional, return uppercase variant
  if (directionals.includes(uppercase)) {
    return uppercase;
  }

  // token is all lowercase or all uppercase, return capitalized variant
  if (token === lowercase || token === uppercase) {
    return _.capitalize(token);
  }

  return token;
}

function cleanupStreetName(input) {
  // split streetname into tokens by whitespace
  return input.split(/\s/)
  .map(removeLeadingZerosFromStreet)
  // remove empty tokens
  .filter(function(part){
    return part.length > 0;
  }).map(capitalizeProperly)
  .join(' ');
}

module.exports = {
  streetName: cleanupStreetName
};
