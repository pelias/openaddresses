const _ = require('lodash');
const axios = require('axios');
const config = require('pelias-config');
const logger = require('pelias-logger').get('openaddresses');
const HOST = 'https://batch.openaddresses.io';

class OpenAddressesAPI {
  constructor() {
    this.config = _.get(config.generate(), 'imports.openaddresses', {});
    this.token = _.get(this.config, 'token');
  }

  // remove file extensions from 'source'
  static normalize(source) {
    if (!_.isString(source)) { return source; }
    const norm = source.replace(/\.[^/.]+$/, '');

    // source definitions previously required a file extension.
    // please remove file extensions from your ~/pelias.json file
    // to silence these warning messages.
    if (source !== norm) {
      logger.warn(`source definitions no longer require a file extension '${source}'`);
    }

    return norm;
  }

  // return the http url for a specific job id
  static url(job) {
    return `${HOST}/api/job/${job}/output/source.geojson.gz`;
  }

  // if the 'validated' mode is enabled (for financial supporters only)
  isValidatedModeEnabled() {
    return _.get(this.config, 'validated') === true;
  }

  async lookup(source) {
    // support the 'validated' property for financial supporters
    const params = {
      source,
      layer: 'addresses',
      validated: this.isValidatedModeEnabled() ? 'true' : 'false'
    };

    // request extended info and return the first result
    const versions = await axios.get(`${HOST}/api/data`, { params });
    return _.isArray(versions.data) && !_.isEmpty(versions.data) ? _.head(versions.data) : {};
  }
}

module.exports = OpenAddressesAPI;
