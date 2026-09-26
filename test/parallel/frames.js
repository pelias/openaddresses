const tape = require('tape');

const frames = require('../../lib/parallel/frames');
const frameDecoder = require('../../lib/parallel/frameDecoder');

function decode(chunks) {
  return new Promise((resolve) => {
    const decoder = frameDecoder.create();
    const out = [];
    decoder.on('data', (frame) => out.push(frame));
    decoder.on('error', (err) => resolve({ err }));
    decoder.on('end', () => resolve({ out }));
    chunks.forEach((chunk) => decoder.write(chunk));
    decoder.end();
  });
}

tape('frames survive arbitrary chunking', async (t) => {
  const input = Buffer.concat([
    frames.encodeFile({ path: '/a.csv', format: 'csv' }),
    frames.encode(frames.DATA, Buffer.from('1,2,3\n4,5,6\n')),
    frames.encode(frames.DATA, Buffer.alloc(200000, 'x'))
  ]);

  // every chunk size, including ones which split the frame headers
  for (const size of [1, 3, 5, 7, 1000, 65536, input.length]) {
    const chunks = [];
    for (let i = 0; i < input.length; i += size) { chunks.push(input.subarray(i, i + size)); }

    const { err, out } = await decode(chunks);
    t.error(err, `chunk size ${size}`);
    t.deepEqual(out.map((f) => f.type), [frames.FILE, frames.DATA, frames.DATA]);
    t.deepEqual(JSON.parse(out[0].payload), { path: '/a.csv', format: 'csv' });
    t.equal(out[1].payload.toString(), '1,2,3\n4,5,6\n');
    t.equal(out[2].payload.length, 200000);
  }
  t.end();
});

tape('data frames carry their block index', (t) => {
  const frame = frames.encodeData(70000, Buffer.from('1,2,3\n'));
  t.equal(frame[0], frames.DATA);

  const { blockIndex, block } = frames.decodeData(frame.subarray(frames.HEADER_LENGTH));
  t.equal(blockIndex, 70000);
  t.equal(block.toString(), '1,2,3\n');
  t.end();
});

tape('a truncated frame is an error', async (t) => {
  const frame = frames.encode(frames.DATA, Buffer.from('abcdef'));
  const { err } = await decode([frame.subarray(0, frame.length - 1)]);
  t.ok(err, 'error emitted');
  t.end();
});

tape('an unknown frame type is an error', async (t) => {
  const { err } = await decode([Buffer.from([9, 0, 0, 0, 0])]);
  t.ok(err, 'error emitted');
  t.end();
});
