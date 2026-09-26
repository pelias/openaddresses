/**
  Reads OpenAddresses files one at a time and yields them as encoded frames:
  a FILE frame, then DATA frames of complete records. Nothing is parsed here,
  see cutters.js.
**/

const fs = require('fs');
const zlib = require('zlib');
const { pipeline } = require('stream');
const csvParse = require('csv-parse/sync').parse;

const logger = require('pelias-logger').get('openaddresses');
const config = require('pelias-config').generate();

const fileContext = require('../fileContext');
const frames = require('./frames');
const { LineCutter, CsvCutter } = require('./cutters');

const CSV_OPTIONS = {
  bom: true,
  trim: true,
  skip_empty_lines: true,
  relax_column_count: true,
  relax_quotes: true
};

function formatOf(filePath) {
  return /\.geojson(\.gz)?$/.test(filePath) ? 'geojson' : 'csv';
}

function openFile(filePath) {
  const file = fs.createReadStream(filePath, { highWaterMark: 256 * 1024 });
  if (!filePath.endsWith('.gz')) { return file; }

  // pipeline() so that read and gunzip errors surface to the consumer
  return pipeline(file, zlib.createGunzip(), (err) => {
    if (err) { logger.error(`failed reading ${filePath}: ${err.message}`); }
  });
}

function csvColumns(header) {
  const rows = csvParse(header, Object.assign({ columns: false }, CSV_OPTIONS));
  return rows.length ? rows[0] : [];
}

async function* fileFrames(filePath, dirPath) {
  const format = formatOf(filePath);
  const cutter = format === 'csv' ? new CsvCutter() : new LineCutter();
  const idPrefix = fileContext.getIdPrefix(filePath, dirPath);
  let announced = false;
  let blockIndex = 0;

  // csv columns are only known once the header record has been read
  function* announce() {
    if (announced) { return; }
    if (format === 'csv' && !cutter.header) { return; }
    announced = true;

    const meta = { path: filePath, idPrefix, format };
    if (format === 'csv') { meta.columns = csvColumns(cutter.header); }
    yield frames.encodeFile(meta);
  }

  function* emit(block) {
    yield* announce();
    if (block && announced) { yield frames.encodeData(blockIndex++, block); }
  }

  for await (const chunk of openFile(filePath)) {
    const block = cutter.push(chunk);
    if (block) { yield* emit(block); } else { yield* announce(); }
  }

  const rest = cutter.end();
  yield* emit(rest);
}

/**
 * @param {string[]} files absolute paths of the files to read
 * @param {string} dirPath the base directory of all files, used for ids
 * @return {AsyncGenerator<Buffer>} frames, in order
 */
async function* readFiles(files, dirPath) {
  // checked up front so that a fatal missing file stops the import before it starts
  const found = files.filter((filePath) => {
    if (fs.existsSync(filePath)) { return true; }

    if (config.get('imports.openaddresses.missingFilesAreFatal')) {
      throw new Error(`File ${filePath} not found, quitting`);
    }
    logger.warn(`File ${filePath} not found, skipping`);
    return false;
  });

  for (const filePath of found) {
    logger.info('Creating read stream for: ' + filePath);
    yield* fileFrames(filePath, dirPath);
  }
}

module.exports = { readFiles, formatOf, CSV_OPTIONS };
