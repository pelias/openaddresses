/**
  Turns frames into row objects: the FILE frame sets the context which is
  attached to every row of the DATA frames that follow it.
**/

const { Transform } = require('stream');
const csvParse = require('csv-parse/sync').parse;

const logger = require('pelias-logger').get('openaddresses');
const fileContext = require('../fileContext');
const frames = require('./frames');
const { CSV_OPTIONS } = require('./reader');

function geojsonRow(line) {
  const geojson = JSON.parse(line);
  const geometry = geojson && geojson.geometry;
  if (!geometry || geometry.type !== 'Point') { return; }

  const props = geojson.properties || {};
  const coordinates = geometry.coordinates || [];
  return {
    NUMBER: props.number,
    STREET: props.street,
    LON: coordinates[0],
    LAT: coordinates[1],
    POSTCODE: props.postcode,
    UNIT: props.unit,
    DISTRICT: props.district,
    REGION: props.region,
    CITY: props.city
  };
}

class RowParser extends Transform {
  constructor() {
    super({ readableObjectMode: true, writableObjectMode: true });
    this.file = null;
    this.context = null;
  }

  _transform(frame, enc, next) {
    if (frame.type === frames.FILE) {
      this.file = JSON.parse(frame.payload.toString('utf8'));
      this.context = fileContext.create(this.file.path, this.file.idPrefix);
      return next();
    }

    if (!this.file) { return next(new Error('received data before any file')); }

    const { blockIndex, block } = frames.decodeData(frame.payload);

    if (this.file.format === 'geojson') {
      this.parseGeojson(block, blockIndex);
      return next();
    }
    next(this.parseCsv(block, blockIndex));
  }

  parseGeojson(block, blockIndex) {
    block.toString('utf8').split('\n').forEach((line, i) => {
      if (!line.trim()) { return; }
      try {
        const row = geojsonRow(line);
        if (row) { this.push(fileContext.attach(row, this.context, `${blockIndex}-${i}`)); }
      } catch (e) {
        logger.error(e);
      }
    });
  }

  // returns an Error if the block could not be parsed. dropping a block of
  // records silently would produce an incomplete index, so this is fatal
  parseCsv(block, blockIndex) {
    let rows;
    try {
      rows = csvParse(block, Object.assign({}, CSV_OPTIONS, { bom: false, columns: this.file.columns }));
    } catch (e) {
      return new Error(`failed parsing ${this.file.path}: ${e.message}`);
    }
    rows.forEach((row, i) => this.push(fileContext.attach(row, this.context, `${blockIndex}-${i}`)));
  }
}

module.exports.create = () => new RowParser();
