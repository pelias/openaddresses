const { Readable } = require('stream');

const reader = require('./parallel/reader');
const frameDecoder = require('./parallel/frameDecoder');
const rowParser = require('./parallel/rowParser');

/**
 * Read OpenAddresses files into a stream of rows, in this process.
 * This is the same path a parallel import worker uses, its frames simply come
 * from the coordinator over stdin instead.
 */
function createRowStream(files, dirPath) {
  const frames = Readable.from(reader.readFiles(files, dirPath), { objectMode: false });
  const decoder = frameDecoder.create();
  const parser = rowParser.create();

  // pipe() does not forward errors, and a failed read must not go unnoticed
  frames.on('error', (err) => parser.destroy(err));
  decoder.on('error', (err) => parser.destroy(err));

  frames.pipe(decoder).pipe(parser);
  return parser;
}

// a stream of rows read from a byte stream of frames, such as stdin
function fromFrames(byteStream) {
  const decoder = frameDecoder.create();
  const parser = rowParser.create();

  decoder.on('error', (err) => parser.destroy(err));

  byteStream.pipe(decoder).pipe(parser);
  return parser;
}

module.exports = { createRowStream, fromFrames };
