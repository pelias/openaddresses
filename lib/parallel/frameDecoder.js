/**
  Decodes the byte stream of frames written by the coordinator into an object
  stream of `{ type, payload }`. A malformed frame is fatal: it means the
  stream was truncated, and silently dropping records would produce an
  incomplete index.
**/

const { Transform } = require('stream');
const frames = require('./frames');

class FrameDecoder extends Transform {
  constructor() {
    super({ writableObjectMode: false, readableObjectMode: true });
    this.pending = Buffer.alloc(0);
  }

  _transform(chunk, enc, next) {
    let buf = this.pending.length ? Buffer.concat([this.pending, chunk]) : chunk;

    while (buf.length >= frames.HEADER_LENGTH) {
      const type = buf.readUInt8(0);
      const length = buf.readUInt32BE(1);

      if (type !== frames.FILE && type !== frames.DATA) {
        return next(new Error('unknown frame type ' + type));
      }
      if (buf.length < frames.HEADER_LENGTH + length) { break; }

      const end = frames.HEADER_LENGTH + length;
      this.push({ type, payload: buf.subarray(frames.HEADER_LENGTH, end) });
      buf = buf.subarray(end);
    }

    this.pending = buf;
    next();
  }

  _flush(next) {
    next(this.pending.length ? new Error('input ended in the middle of a frame') : null);
  }
}

module.exports.create = () => new FrameDecoder();
