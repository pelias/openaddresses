const tape = require('tape');
const csvParse = require('csv-parse/sync').parse;

const { LineCutter, CsvCutter } = require('../../lib/parallel/cutters');
const { CSV_OPTIONS } = require('../../lib/parallel/reader');

function cutAll(cutter, input, chunkSize) {
  const blocks = [];
  for (let i = 0; i < input.length; i += chunkSize) {
    const block = cutter.push(input.subarray(i, i + chunkSize));
    if (block) { blocks.push(block); }
  }
  const rest = cutter.end();
  if (rest) { blocks.push(rest); }
  return blocks;
}

const parse = (buf, columns) => csvParse(buf, Object.assign({}, CSV_OPTIONS, { columns }));

tape('LineCutter blocks contain only whole lines and lose nothing', (t) => {
  const lines = [];
  for (let i = 0; i < 5000; i++) { lines.push(`{"n":${i},"s":"${'x'.repeat(i % 50)}"}`); }
  const input = Buffer.from(lines.join('\n') + '\n');

  [1, 7, 100, 4096, 100000].forEach((chunkSize) => {
    const blocks = cutAll(new LineCutter(1024), input, chunkSize);
    blocks.slice(0, -1).forEach((b) => t.equal(b[b.length - 1], 0x0a, 'block ends on a newline'));
    t.ok(Buffer.concat(blocks).equals(input), `content preserved with chunk size ${chunkSize}`);
  });
  t.end();
});

tape('LineCutter keeps an unterminated last line', (t) => {
  const input = Buffer.from('a\nb\nc');
  t.ok(Buffer.concat(cutAll(new LineCutter(1), input, 2)).equals(input));
  t.end();
});

const HEADER = 'LON,LAT,NUMBER,STREET,POSTCODE';

function csvFixture(eol) {
  const rows = [];
  for (let i = 0; i < 3000; i++) {
    switch (i % 6) {
      case 0: rows.push(`1,2,${i},Main St,`); break;
      case 1: rows.push(`1,2,${i},"Main St, Apt",90210`); break;
      case 2: rows.push(`1,2,${i},"Main\nSt",`); break;              // quoted newline
      case 3: rows.push(`1,2,${i},"He said ""hi""\n""yo""",1`); break; // escaped quotes
      case 4: rows.push(`1,2,${i},5" pipe road,`); break;            // stray quote
      case 5: rows.push(`1,2,${i},"",`); break;                      // empty quoted
    }
  }
  return { rows, text: HEADER + eol + rows.join(eol) + eol };
}

tape('CsvCutter cuts only at record boundaries', (t) => {
  ['\n', '\r\n'].forEach((eol) => {
    const { rows, text } = csvFixture(eol);
    const input = Buffer.from('﻿' + text);
    const expected = parse(Buffer.from(text), true);
    t.equal(expected.length, rows.length, 'fixture parses as expected');

    [1, 2, 3, 11, 200, 4096, 1 << 20].forEach((chunkSize) => {
      const cutter = new CsvCutter(512);
      const blocks = cutAll(cutter, input, chunkSize);
      const columns = parse(cutter.header, false)[0];

      t.deepEqual(columns, HEADER.split(','), 'header found');

      const actual = [];
      blocks.forEach((block) => parse(block, columns).forEach((r) => actual.push(r)));
      t.deepEqual(actual, expected, `same records, chunk size ${chunkSize}, eol ${JSON.stringify(eol)}`);
    });
  });
  t.end();
});

tape('CsvCutter does not lose the header of a file without records', (t) => {
  const cutter = new CsvCutter();
  t.equal(cutter.push(Buffer.from(HEADER)), null);
  t.equal(cutter.end(), null);
  t.equal(cutter.header.toString(), HEADER);
  t.end();
});

tape('CsvCutter recovers when quotes never balance', (t) => {
  const rows = ['1,2,3,"unterminated'];
  for (let i = 0; i < 100000; i++) { rows.push(`1,2,${i},street`); }
  const input = Buffer.from(HEADER + '\n' + rows.join('\n') + '\n');

  const blocks = cutAll(new CsvCutter(1024), input, 65536);
  t.ok(blocks.length > 1, 'data was still split into blocks');
  t.ok(Buffer.concat([Buffer.from(HEADER + '\n'), ...blocks]).equals(input), 'nothing lost');
  t.end();
});
