const _ = require('lodash');
const through2 = require('through2');
const cleanup = require('../cleanup');
const cleanupV2 = require('../cleanup_v2');
const fileContext = require('../fileContext');

/*
 * create a stream that performs any needed cleanup on a record
 */

 // mapping from openaddresses country codes (from the file names)
 // to a language code 'locale' required by next-gen analysis.
 const cc2LocaleMap = {
   'us': 'en',
   'ca': 'en',
   'gb': 'en',
   'ie': 'en',
   'au': 'en',
   'nz': 'en',
 };

// use 'cleanup_v2' when we know the locale is 'en', else use the existing 'cleanup' analyzer
// note: this is a temporary solution to allow us to upgrade gradually without having to
// test the entire world, with all it's different languages, all in the first release.
function getAnalyzer(countryCode) {
  const locale = _.get(cc2LocaleMap, countryCode, '').toLowerCase();
  const analyzer = (locale === 'en') ? cleanupV2.streetName : cleanup.streetName;
  return { locale, analyzer };
}

function createCleanupStream() {
  // the country code comes with each record, as the stream sees many files
  const analyzers = new Map();

  return through2.obj(( record, enc, next ) => {
    const countryCode = _.get(fileContext.get(record), 'countryCode', '');

    if (!analyzers.has(countryCode)) {
      analyzers.set(countryCode, getAnalyzer(countryCode));
    }
    const { locale, analyzer } = analyzers.get(countryCode);

    // analyze street field
    record.STREET = analyzer(record.STREET, { locale });

    // csvParse will only trim unquoted fields
    // so we have to do it ourselves to handle all whitespace
    Object.keys(record).forEach(key => {
      if (_.isFunction(_.get(record[key], 'trim'))) {
        record[key] = record[key].trim();
      }
    });

    next(null, record);
  });
}

module.exports = {
  create: createCleanupStream
};
