const Joi = require('joi');

// Schema Configuration
// datapath: string (required)
// files: array of strings
// adminLookup: boolean
module.exports = Joi.object().keys({
  imports: Joi.object().keys({
    openaddresses: Joi.object().keys({
      files: Joi.array().items(Joi.string()),
      datapath: Joi.string(),
      adminLookup: Joi.boolean(),
      missingFilesAreFatal: Joi.boolean().default(false).truthy('yes').falsy('no').insensitive(true)
    }).requiredKeys('datapath').unknown(false)
  }).requiredKeys('openaddresses').unknown(true)
}).requiredKeys('imports').unknown(true);
