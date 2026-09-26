/**
  Cutters split a byte stream into blocks made only of complete records,
  without parsing them. The coordinator does this for every row of every file,
  so it is all native `indexOf` calls, no per-row work.

    push(chunk) -> Buffer | null   a block once enough data has accumulated
    end()       -> Buffer | null   whatever is left
**/

const logger = require('pelias-logger').get('openaddresses');

const NEWLINE = 0x0a;
const QUOTE = 0x22;
const COMMA = 0x2c;
const CR = 0x0d;

const BLOCK_SIZE = 64 * 1024;

// if a CSV file yields no record boundary within this many bytes, the quote
// tracking is assumed to have lost sync and blocks are cut at any newline
const MAX_RECORD_SIZE = 1024 * 1024;

/*
 * Cuts on every newline: one record per line (geojson)
 */
class LineCutter {
  constructor(blockSize) {
    this.blockSize = blockSize || BLOCK_SIZE;
    this.pending = Buffer.alloc(0);
  }

  push(chunk) {
    const buf = this.pending.length ? Buffer.concat([this.pending, chunk]) : chunk;
    const idx = buf.lastIndexOf(NEWLINE);

    if (idx + 1 < this.blockSize) {
      this.pending = buf;
      return null;
    }

    this.pending = buf.subarray(idx + 1);
    return buf.subarray(0, idx + 1);
  }

  end() {
    const rest = this.pending;
    this.pending = Buffer.alloc(0);
    return rest.length ? rest : null;
  }
}

// the first or last newline in buf[start, end), or -1
function newlineIn(buf, start, end, first) {
  if (end <= start) { return -1; }

  const idx = first ? buf.indexOf(NEWLINE, start) : buf.lastIndexOf(NEWLINE, end - 1);
  return (idx >= start && idx < end) ? idx : -1;
}

/*
 * Find the end of complete CSV records in `buf`, honouring newlines inside
 * quoted fields. `state` carries over between calls: whether the scan is inside
 * quotes, how far `buf` has been scanned and the last safe boundary found.
 *
 * A quote only opens a field when it is the first character of one, and only
 * closes it when followed by a delimiter or line end. Anything else is a stray
 * quote inside a value (5" pipe), which the parser tolerates and so must we.
 *
 * Returns the offset just after the last (or, with `first`, the first)
 * newline outside of quotes, or 0 if there is none yet.
 */
function findRecordEnd(buf, state, first) {
  let pos = state.pos;

  while (pos < buf.length) {
    if (!state.inQuote) {
      const q = buf.indexOf(QUOTE, pos);
      const segmentEnd = q === -1 ? buf.length : q;

      const nl = newlineIn(buf, pos, segmentEnd, first);
      if (nl !== -1) {
        state.safeEnd = nl + 1;
        if (first) { pos = state.safeEnd; break; }
      }

      if (q === -1) { pos = buf.length; break; }

      const prev = q === 0 ? NEWLINE : buf[q - 1];
      state.inQuote = (prev === COMMA || prev === NEWLINE);
      pos = q + 1;
    } else {
      const q = buf.indexOf(QUOTE, pos);
      if (q === -1) { pos = buf.length; break; }

      // need the byte after the quote to know what it means
      if (q + 1 >= buf.length) { pos = q; break; }

      const next = buf[q + 1];
      if (next === QUOTE) {
        pos = q + 2;
      } else {
        if (next === COMMA || next === NEWLINE || next === CR) { state.inQuote = false; }
        pos = q + 1;
      }
    }
  }

  state.pos = pos;
  return state.safeEnd;
}

function newState() {
  return { inQuote: false, pos: 0, safeEnd: 0 };
}

class CsvCutter {
  constructor(blockSize) {
    this.blockSize = blockSize || BLOCK_SIZE;
    this.pending = Buffer.alloc(0);
    this.state = newState();
    this.header = null;
  }

  // `header` is the first record as a Buffer, once it has been read
  push(chunk) {
    this.pending = this.pending.length ? Buffer.concat([this.pending, chunk]) : chunk;

    if (!this.header) {
      const end = findRecordEnd(this.pending, this.state, true);
      if (!end) { return this.overflow(); }
      this.header = this.pending.subarray(0, end);
      this.pending = this.pending.subarray(end);
      this.state = newState();
    }

    const end = findRecordEnd(this.pending, this.state, false);
    if (end >= this.blockSize) { return this.cut(end); }
    return this.overflow();
  }

  cut(end) {
    const block = this.pending.subarray(0, end);
    this.pending = this.pending.subarray(end);
    this.state.pos -= end;
    this.state.safeEnd = 0;
    return block;
  }

  // bail out of a record which never ends: cut at any newline instead
  overflow() {
    if (this.pending.length < MAX_RECORD_SIZE) { return null; }

    const idx = this.pending.lastIndexOf(NEWLINE);
    if (idx === -1) { return null; }

    logger.warn('no CSV record boundary found in %d bytes, splitting at plain newlines', this.pending.length);
    const block = this.pending.subarray(0, idx + 1);
    this.pending = this.pending.subarray(idx + 1);
    this.state = newState();
    return block;
  }

  end() {
    const rest = this.pending;
    this.pending = Buffer.alloc(0);

    // a file with a header and no records may not end in a newline
    if (!this.header) {
      this.header = rest;
      return null;
    }
    return rest.length ? rest : null;
  }
}

module.exports = { LineCutter, CsvCutter, findRecordEnd, BLOCK_SIZE };
