function removeLeadingZerosFromStreet(token) {
  return token.replace(/^(?:0*)([1-9]\d*(st|nd|rd|th))/,'$1');
}

function cleanupStreetName(input) {
  var street_parts = input.split(' ');
  return street_parts.map(removeLeadingZerosFromStreet).join(' ');
}

module.exports = {
  streetName: cleanupStreetName
};
