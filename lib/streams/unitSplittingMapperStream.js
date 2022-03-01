/**
  The unit splitting mapper is responsible for detecting when the address.number
  field contains the concatenation of the unit and the housenumber.

  eg. Flat 2 14 Smith St

  In this case we attempt to split the two terms into their consituent parts.

  note: Addressing formats vary between countries, it's unlikely that a pattern
  which works for one country will also work internationally. For this reason this
  mapper accepts a country code which can be used to select the appropriate pattern(s).

  Feel free to make changes to this mapping file!
**/

const _ = require('lodash');
const through = require('through2');
const logger = require('pelias-logger').get('openaddresses');
const mappers = {};

// Australasian Unit Number Mapper
// https://auspost.com.au/content/dam/auspost_corp/media/documents/Appendix-01.pdf
// https://www.nzpost.co.nz/sites/nz/files/2021-10/adv358-address-standards.pdf
const australasian = (doc) =>{
  const number = doc.getAddress('number');
  if(!_.isString(number) || number.length < 3){ return; }

  // 2/14
  const solidus = number.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (solidus) {
    doc.setAddress('unit', solidus[1]);
    doc.setAddress('number', solidus[2]);
    doc.setName('default', `${doc.getAddress('number')} ${doc.getAddress('street')}`);
    return;
  }

  // Flat 2 14 | F 2 14 | Unit 2 14 | APT 2 14
  const verbose = number.match(/^(flat|f|unit|apartment|apt)\s*(\d+)\s+(\d+)$/i);
  if (verbose) {
    doc.setAddress('unit', verbose[2]);
    doc.setAddress('number', verbose[3]);
    doc.setName('default', `${doc.getAddress('number')} ${doc.getAddress('street')}`);
    return;
  }
};

// associate mappers with country codes
mappers.AU = australasian;
mappers.NZ = australasian;

module.exports = function () {
  return through.obj((doc, enc, next) => {
    try {
      // only applies to records with a 'number' set and no 'unit' set (yet).
      if (doc.hasAddress('number') && !doc.hasAddress('unit')) {

        // select the appropriate mapper based on country code
        const mapper = _.get(mappers, doc.getMeta('country_code'));
        if (_.isFunction(mapper)) {

          // run the country-specific mapper
          mapper(doc);
        }
      }
    }

    catch (e) {
      logger.error('unit_mapper error');
      logger.error(e.stack);
      logger.error(JSON.stringify(doc, null, 2));
    }

    return next(null, doc);
  });
};
