/**
  The GNAF mapper is responsible for extracting Australian GNAF
  identifiers from the OA 'ID' property, where available.
**/

const _ = require('lodash');
const through = require('through2');
const logger = require('pelias-logger').get('openaddresses');

// examples: GAACT718519668, GASA_424005553
const GNAF_PID_PATTERN = /^(GA)(NSW|VIC|QLD|SA_|WA_|TAS|NT_|ACT|OT_)([0-9]{9})$/;

module.exports = function () {
  return through.obj((doc, enc, next) => {
    try {
      if (doc.getMeta('country_code') === 'AU') {

        // detect Australian G-NAF PID concordances
        const oaid = _.get(doc.getMeta('oa'), 'ID');
        if (oaid.length === 14 && oaid.match(GNAF_PID_PATTERN)) {
          doc.setAddendum('concordances', { 'gnaf:pid': oaid });
        }
      }
    }

    catch (e) {
      logger.error('gnaf_mapper error');
      logger.error(e.stack);
      logger.error(JSON.stringify(doc, null, 2));
    }

    return next(null, doc);
  });
};
