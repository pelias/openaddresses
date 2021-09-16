const child_process = require('child_process');
const async = require('async');
const fs = require('fs-extra');
const temp = require('temp');
const logger = require('pelias-logger').get('openaddresses-download');
const _ = require('lodash');

function downloadAll(config, callback) {
  logger.info('Attempting to download all data');

  const targetDir = config.imports.openaddresses.datapath;

  fs.ensureDir(targetDir, (err) => {
    if (err) {
      logger.error(`error making directory ${targetDir}`, err);
      return callback(err);
    }

    const dataHost = config.get('imports.openaddresses.dataHost') || 'https://data.openaddresses.io';

    async.eachSeries(
      [
        // all non-share-alike data
        `${dataHost}/openaddr-collected-global.zip`,

        // all share-alike data
        `${dataHost}/openaddr-collected-global-sa.zip`
      ],
      downloadBundle.bind(null, targetDir, config),
      callback);
  });
}

function downloadBundle(targetDir, config, sourceUrl, callback) {

  const tmpZipFile = temp.path({suffix: '.zip'});
  const referer = config.get('imports.openaddresses.dataReferer') || 'https://pelias-results.openaddresses.io';

  async.series(
    [
      // download the zip file into the temp directory
      (callback) => {
        logger.debug(`downloading ${sourceUrl}`);
        if (_.startsWith(sourceUrl, 's3://')) {
          const s3Options = config.imports.openaddresses.s3Options || '';
          child_process.exec(`aws s3 cp ${sourceUrl} ${tmpZipFile} --only-show-errors ${s3Options}`, callback);
        } else {
          const flags = [
            '--request GET',                // HTTP GET
            '--silent',                     // be quiet
            '--location',                   // follow redirects
            '--fail',                       // exit with a non-zero code for >=400 responses
            '--write-out "%{http_code}"',   // print status code to STDOUT
            `--referer ${referer}`,         // set referer header
            `--output ${tmpZipFile}`,       // set output filepath
            '--retry 5',                    // retry this number of times before giving up
            '--retry-connrefused',          // consider ECONNREFUSED as a transient error
            '--retry-delay 5'               // sleep this many seconds between retry attempts
          ].join(' ');

          // the `--fail*` flags cause an error to be returned as the first arg with `error.code`
          // as the process exit status, the `-w "%{http_code}"` flag writes the HTTP status to STDOUT.
          child_process.exec(`curl ${flags} ${sourceUrl}`, (error, stdout) => {
            if (!error) { return callback(); }

            // provide a more user-friendly error message
            error.message = `cURL request failed, HTTP status: ${stdout}, exit code: ${error.code}`;
            callback(error);
          });
        }
      },
      // unzip file into target directory
      (callback) => {
        logger.debug(`unzipping ${tmpZipFile} to ${targetDir}`);
        child_process.exec(`unzip -o -qq -d ${targetDir} ${tmpZipFile}`, callback);
      },
      // delete the temp downloaded zip file
      fs.remove.bind(null, tmpZipFile)
    ],
    callback);
}

module.exports = downloadAll;
