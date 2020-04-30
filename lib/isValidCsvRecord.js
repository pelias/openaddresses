const _ = require('lodash');
const NULL_ISLAND_THRESHOLD = 0.0005;

/*
 * Return true if a record has all of LON, LAT, NUMBER and STREET defined
 */
function isValidCsvRecord( record ){
  return hasAllProperties(record) &&
          !houseNumberIsExclusionaryWord(record) &&
          !streetContainsExclusionaryWord(record) &&
          !latLonAreOnNullIsland(record);
}

/*
 * Return false if record.NUMBER is literal word 'NULL', 'UNDEFINED',
 * or 'UNAVAILABLE' (case-insensitive)
*/
function houseNumberIsExclusionaryWord(record) {
  return ['NULL', 'UNDEFINED', 'UNAVAILABLE'].indexOf(_.toUpper(record.NUMBER)) !== -1;
}

/*
 * Return false if record.STREET contains literal word 'NULL', 'UNDEFINED',
 * or 'UNAVAILABLE' (case-insensitive)
*/
function streetContainsExclusionaryWord(record) {
  return /\b(NULL|UNDEFINED|UNAVAILABLE)\b/i.test(record.STREET);
}

function hasAllProperties(record) {
  return [ 'LON', 'LAT', 'NUMBER', 'STREET' ].every(function(prop) {
    return record[ prop ] && record[ prop ].length > 0;
  });
}

// returns true when LON and LAT are both parseable < $NULL_ISLAND_THRESHOLD
// > parseFloat('0');
// 0
// > parseFloat('0.000000');
// 0
// > parseFloat('0.000001');
// 0.000001
function latLonAreOnNullIsland(record) {
  return ['LON', 'LAT'].every(prop => Math.abs(parseFloat(record[prop])) < NULL_ISLAND_THRESHOLD);
}

module.exports = isValidCsvRecord;
