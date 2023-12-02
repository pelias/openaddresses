const child_process = require('child_process');
const config = require('pelias-config').generate();
const async = require('async');
const fs = require('fs-extra');
const path = require('path');
const temp = require('temp');
const logger = require('pelias-logger').get('openaddresses-download');
const Bottleneck = require('bottleneck/es5');

const OpenAddressesAPI = require('./OpenAddressesAPI');
const oa = new OpenAddressesAPI();

function downloadFiltered(config, callback) {
  const targetDir = config.imports.openaddresses.datapath;
  const errorsFatal = config.get('imports.openaddresses.missingFilesAreFatal');

  fs.ensureDir(targetDir, async (err) => {
    if (err) {
      logger.error(`error making directory ${targetDir}`, err);
      return callback(err);
    }

    // validate sources
    const files = config.get('imports.openaddresses.files', []);
    const sources = await getSources(files);
    const validSources = sources.filter(source => source.url);

    // respect 'imports.openaddresses.missingFilesAreFatal' setting
    if (errorsFatal && (sources.length !== validSources.length)) {
      callback(sources.find(source => source.error)); // return first error
      return;
    }

    logger.info(`Attempting to download selected data sources: ${sources.map(source => source.id)}`);

    // limit requests to avoid being banned by openaddresses.io
    // current policy is 10 request per minute
    // https://github.com/pelias/openaddresses/issues/433#issuecomment-527383976
    // @todo: contact OA team to check if this is still required with the batch. endpoint?
    const options = {
      maxConcurrent: 1,
      minTime: 6000
    };
    const limiter = new Bottleneck(options);
    const done = () => {
      if (limiter.empty()) {
        callback();
      }
    };
    validSources.map(source => {
      limiter.submit(downloadSource, targetDir, source, done);
    });
    process.on('SIGINT', () => {
      limiter.stop({ dropWaitingJobs: true });
      process.exit();
    });
  });

}

async function getSources(files) {
  return await Promise.all(files.map(async file => {

    // normalize source
    let id = OpenAddressesAPI.normalize(file);

    // lookup the source using the OpenAddresses API
    // to find the most current job id and ensure validity
    const version = await oa.lookup(id);
    const valid = (version && version.job);

    // invalid source
    if (!valid) {
      return { id, error: `invalid source '${file}'` };
    }

    // valid source
    return { id, url: OpenAddressesAPI.url(version.job) };
  }));
}

function downloadSource(targetDir, source, done) {

  const errorsFatal = config.get('imports.openaddresses.missingFilesAreFatal');
  const token = config.get('imports.openaddresses.token');
  const referer = config.get('imports.openaddresses.dataReferer') || 'https://pelias-results.openaddresses.io';
  logger.info(`Downloading ${source.id}`);

  const outFile = path.join(targetDir, `${source.id}.geojson`);
  const tmpFile = temp.path({
    prefix: source.id.replace(new RegExp(path.sep, 'g'), '-'),
    dir: targetDir,
    suffix: '.gz'
  });

  async.series(
    [
      // download the compressed file into the temp directory
      (callback) => {
        logger.debug(`downloading ${source.url}`);
        const flags = [
          '--request GET',                // HTTP GET
          '--silent',                     // be quiet
          '--location',                   // follow redirects
          '--fail',                       // exit with a non-zero code for >=400 responses
          '--write-out "%{http_code}"',   // print status code to STDOUT
          `--referer ${referer}`,         // set referer header
          `--output ${tmpFile}`,          // set output filepath
          '--retry 5',                    // retry this number of times before giving up
          '--retry-connrefused',          // consider ECONNREFUSED as a transient error
          '--retry-delay 5',              // sleep this many seconds between retry attempts
          `-H 'Authorization: Bearer ${token}'` // authorization token
        ].join(' ');

        // the `--fail*` flags cause an error to be returned as the first arg with `error.code`
        // as the process exit status, the `-w "%{http_code}"` flag writes the HTTP status to STDOUT.
        child_process.exec(`curl ${flags} ${source.url}`, (error, stdout) => {
          if (!error) { return callback(); }

          // provide a more user-friendly error message
          error.message = `cURL request failed, HTTP status: ${stdout}, exit code: ${error.code}`;
          callback(error);
        });
      },
      // decompress file into target directory
      (callback) => {
        logger.debug(`decompress ${tmpFile} to ${outFile}`);
        child_process.exec(`
          mkdir -p ${path.dirname(outFile)};
          gzip -d < ${tmpFile} > ${outFile};
        `, (error, stdout) => {
          if (!error) { return callback(); }

          // provide a more user-friendly error message
          error.message = `decompress failed, ${stdout}`;
          callback(error);
        });
      },
    ],
    (err) => {
      if (err) {
        logger.warn(`failed to download ${source.url}: ${err}`);
      }

      // ensure temp files are cleaned up
      if (fs.existsSync(tmpFile)) { fs.unlinkSync(tmpFile); }

      // honour 'imports.openaddresses.missingFilesAreFatal' setting
      done(errorsFatal ? err : null);
    }
  );
}

module.exports = downloadFiltered;
