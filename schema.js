const Joi = require('@hapi/joi');

// Schema Configuration
// datapath: string (required)
// files: array of strings
// adminLookup: boolean
module.exports = Joi.object().keys({
  imports: Joi.object().required().keys({
    openaddresses: Joi.object().required().keys({
      files: Joi.array().items(Joi.string()),
      datapath: Joi.string().required(true),
      dataHost: Joi.string(),
      s3Options: Joi.string(),
      adminLookup: Joi.boolean(),
      missingFilesAreFatal: Joi.boolean().default(false).truthy('yes').falsy('no')
    }).unknown(false)
  }).unknown(true)
}).unknown(true);
