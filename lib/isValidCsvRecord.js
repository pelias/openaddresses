var _ = require('lodash');

/*
 * Return true if a record has all of LON, LAT, NUMBER and STREET defined
 */
function isValidCsvRecord( record ){
  return hasAllProperties(record) &&
          !houseNumberIsExclusionaryWord(record) &&
          !streetContainsExclusionaryWord(record);
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

module.exports = isValidCsvRecord;
