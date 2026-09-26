const Joi = require('@hapi/joi');

// Schema Configuration
// datapath: string (required)
// files: array of strings
// adminLookup: boolean
// parallelism: integer >= 1, the number of import pipelines to run
module.exports = Joi.object().keys({
  imports: Joi.object().required().keys({
    openaddresses: Joi.object().required().keys({
      files: Joi.array().items(Joi.string()),
      datapath: Joi.string().required(true),
      dataHost: Joi.string(),
      s3Options: Joi.string(),
      adminLookup: Joi.boolean(),
      missingFilesAreFatal: Joi.boolean().default(false).truthy('yes').falsy('no'),
      parallelism: Joi.number().integer().min(1).default(1),
      token: Joi.string().required(true),
    }).unknown(false)
  }).unknown(true)
}).unknown(true);
