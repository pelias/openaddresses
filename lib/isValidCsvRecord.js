var _ = require('lodash');

/*
 * Return true if a record has all of LON, LAT, NUMBER and STREET defined
 */
function isValidCsvRecord( record ){
  return hasAllProperties(record) &&
          !houseNumberIsLiteralWordNull(record) &&
          !streetContainsLiteralWordNull(record);
}

/*
 * Return false if record.NUMBER is literal word 'NULL' (case-insensitive)
*/
function houseNumberIsLiteralWordNull(record) {
  return _.toUpper(record['NUMBER']) === 'NULL';
}

/*
 * Return false if record.STREET contains literal word 'NULL' (case-insensitive)
*/
function streetContainsLiteralWordNull(record) {
  return /\bnull\b/i.test(record['STREET']);
}

function hasAllProperties(record) {
  return [ 'LON', 'LAT', 'NUMBER', 'STREET' ].every(function(prop) {
    return record[ prop ] && record[ prop ].length > 0;
  });
}

module.exports = isValidCsvRecord;
