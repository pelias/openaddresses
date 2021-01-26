const _ = require('lodash');
const through2 = require('through2');
const cleanup = require('../cleanup');
const cleanupV2 = require('../cleanup_v2');

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

function createCleanupStream(options) {
  const locale = _.get(cc2LocaleMap, _.get(options, 'countryCode', ''), '').toLowerCase();

  // use 'cleanup_v2' when we know the locale is 'en', else use the existing 'cleanup' analyzer
  // note: this is a temporary solution to allow us to upgrade gradually without having to
  // test the entire world, with all it's different languages, all in the first release.
  const analyzer = (locale.length === 2) ? cleanupV2.streetName : cleanup.streetName;

  // generate a stream
  return through2.obj(( record, enc, next ) => {

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
