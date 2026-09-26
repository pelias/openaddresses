/**
  Wire format between the coordinator and the import pipelines:

    [type: 1 byte][payload length: 4 bytes, big endian][payload]

  FILE payloads are JSON describing the file that all following DATA frames
  belong to. DATA payloads are a block of complete records from that file,
  preceded by the block's index within the file (4 bytes, big endian). Rows
  are identified by block index and position in the block, which is stable
  however the blocks are shared out between workers.
  Frames are used instead of newline delimiters because CSV records may
  contain newlines within quoted fields.
**/

const FILE = 1;
const DATA = 2;
const HEADER_LENGTH = 5;

function encode(type, payload) {
  const header = Buffer.allocUnsafe(HEADER_LENGTH);
  header.writeUInt8(type, 0);
  header.writeUInt32BE(payload.length, 1);
  return Buffer.concat([header, payload]);
}

function encodeFile(meta) {
  return encode(FILE, Buffer.from(JSON.stringify(meta)));
}

function encodeData(blockIndex, block) {
  const index = Buffer.allocUnsafe(4);
  index.writeUInt32BE(blockIndex, 0);
  return encode(DATA, Buffer.concat([index, block]));
}

function decodeData(payload) {
  return { blockIndex: payload.readUInt32BE(0), block: payload.subarray(4) };
}

module.exports = { FILE, DATA, HEADER_LENGTH, encode, encodeFile, encodeData, decodeData };
