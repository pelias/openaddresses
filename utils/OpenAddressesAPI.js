const _ = require('lodash');
const axios = require('axios');
const config = require('pelias-config');
const HOST = 'https://batch.openaddresses.io';

class OpenAddressesAPI {
  constructor() {
    this.config = _.get(config.generate(), 'imports.openaddresses', {});
    this.token = _.get(this.config, 'token');
  }

  // remove file extensions from 'source'
  normalize(source) {
    if (!_.isString(source)) { return source; }
    return source.replace(/\.[^/.]+$/, '');
  }

  // return the http url for a specific job id
  url(job) {
    return `${HOST}/api/job/${job}/output/source.geojson.gz`;
  }

  // if the 'validated' mode is enabled (for financial supporters only)
  isValidatedModeEnabled() {
    return _.get(this.config, 'validated') === true;
  }

  async lookup(filename) {
    // normalize 'source' property
    // support the 'validated' property for financial supporters
    const params = {
      source: this.normalize(filename),
      layer: 'addresses',
      validated: this.isValidatedModeEnabled() ? 'true' : 'false'
    };

    // request extended info and return the first result
    const versions = await axios.get(`${HOST}/api/data`, { params });
    return _.isArray(versions.data) && !_.isEmpty(versions.data) ? _.head(versions.data) : {};
  }
}

module.exports = OpenAddressesAPI;
