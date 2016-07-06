function removeLeadingZerosFromStreet(token) {
  return token.replace(/^(?:0*)([1-9]\d*(st|nd|rd|th))/,'$1');
}

function cleanupStreetName(input) {
  return input.split(/\s/)
  .map(removeLeadingZerosFromStreet)
  .filter(function(part){
    return part.length > 0;
  }).join(' ');
}

module.exports = {
  streetName: cleanupStreetName
};
