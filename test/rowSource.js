const tape = require('tape');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const temp = require('temp').track();
const through = require('through2');
const stream_mock = require('stream-mock');
const proxyquire = require('proxyquire');

const rowSource = require('../lib/rowSource');
const fileContext = require('../lib/fileContext');

function collect(files, dirPath, callback) {
  const writer = new stream_mock.ObjectWritableMock();
  const source = rowSource.createRowStream(files, dirPath);
  source.on('error', callback);
  writer.on('finish', () => callback(null, writer.data));
  source.pipe(writer);
}

tape('rows read from a csv file carry their file context', (t) => {
  const file = path.join(__dirname, 'openaddresses_sample.csv');

  collect([file], __dirname, (err, rows) => {
    t.error(err);
    t.equal(rows.length, 8, 'all rows read');
    t.equal(rows[0].NUMBER, '23042', 'columns come from the header');
    t.deepEqual(Object.keys(rows[0]).slice(0, 4), ['LON', 'LAT', 'NUMBER', 'STREET']);
    t.equal(fileContext.get(rows[0]).path, file);
    t.equal(fileContext.get(rows[0]).idPrefix, 'openaddresses_sample');
    t.end();
  });
});

tape('rows from consecutive files keep separate contexts', (t) => {
  const dirPath = path.join(__dirname, 'data');
  const files = [path.join(dirPath, 'input_file_1.csv'), path.join(dirPath, 'au/input_file_3.csv')];

  collect(files, dirPath, (err, rows) => {
    t.error(err);
    const prefixes = new Set(rows.map((row) => fileContext.get(row).idPrefix));
    t.deepEqual([...prefixes].sort(), ['au/input_file_3', 'input_file_1']);
    t.end();
  });
});

tape('geojson and gzipped files are read', (t) => {
  temp.mkdir('rowSource', (err, dir) => {
    const line = (n, geometry) => JSON.stringify({
      type: 'Feature',
      properties: { number: String(n), street: 'Main St', postcode: '12345' },
      geometry: geometry || { type: 'Point', coordinates: [1, 2] }
    });
    const lines = [line(1), line(2, { type: 'LineString', coordinates: [] }), 'not json', '', line(3)].join('\n');

    fs.mkdirSync(path.join(dir, 'us'));
    fs.writeFileSync(path.join(dir, 'us/a.geojson'), lines);
    fs.writeFileSync(path.join(dir, 'us/b.geojson.gz'), zlib.gzipSync(lines + '\n'));

    collect([path.join(dir, 'us/a.geojson'), path.join(dir, 'us/b.geojson.gz')], dir, (err, rows) => {
      t.error(err);
      t.deepEqual(rows.map((r) => r.NUMBER), ['1', '3', '1', '3'], 'points only, bad lines skipped');
      t.deepEqual(rows.map((r) => fileContext.get(r).idPrefix), ['us/a', 'us/a', 'us/b', 'us/b']);
      t.equal(rows[0].LON, 1);
      t.equal(rows[0].LAT, 2);
      t.equal(rows[0].POSTCODE, '12345');
      t.end();
    });
  });
});

tape('csv records with quoted newlines survive across many blocks', (t) => {
  temp.mkdir('rowSourceCsv', (err, dir) => {
    const rows = [];
    for (let i = 0; i < 20000; i++) {
      rows.push(`1,2,${i},"Main St\nUnit ""${i}"", Rear",`);
    }
    fs.writeFileSync(path.join(dir, 'a.csv'), 'LON,LAT,NUMBER,STREET,POSTCODE\r\n' + rows.join('\n') + '\n');

    collect([path.join(dir, 'a.csv')], dir, (err, actual) => {
      t.error(err);
      t.equal(actual.length, 20000);
      t.equal(actual[19999].STREET, 'Main St\nUnit "19999", Rear');
      t.deepEqual(actual.map((r) => r.NUMBER), rows.map((r, i) => String(i)));
      t.end();
    });
  });
});

tape('every row of a file gets a unique, repeatable uid across blocks', (t) => {
  temp.mkdir('rowSourceUid', (err, dir) => {
    const rows = [];
    for (let i = 0; i < 20000; i++) { rows.push(`1,2,${i},Main St`); }
    fs.writeFileSync(path.join(dir, 'a.csv'), 'LON,LAT,NUMBER,STREET\n' + rows.join('\n') + '\n');

    collect([path.join(dir, 'a.csv')], dir, (err, first) => {
      t.error(err);
      const uids = first.map((row) => fileContext.getUid(row));
      t.equal(new Set(uids).size, 20000, 'no two rows share a uid');

      collect([path.join(dir, 'a.csv')], dir, (err, second) => {
        t.error(err);
        t.deepEqual(second.map((row) => fileContext.getUid(row)), uids, 'same uids on every read');
        t.end();
      });
    });
  });
});

tape('a stray quote inside an unquoted value does not stop the import', (t) => {
  temp.mkdir('rowSourceStray', (err, dir) => {
    fs.writeFileSync(path.join(dir, 'stray.csv'), 'LON,LAT,NUMBER,STREET\n1,2,10,5" Pipe Road\n3,4,20,Main Street\n');

    collect([path.join(dir, 'stray.csv')], dir, (err, rows) => {
      t.error(err);
      t.deepEqual(rows.map((r) => r.NUMBER), ['10', '20'], 'both records read');
      t.equal(rows[0].STREET, '5" Pipe Road');
      t.end();
    });
  });
});

tape('a missing file is skipped unless configured as fatal', (t) => {
  const files = [path.join(__dirname, 'nope.csv'), path.join(__dirname, 'openaddresses_sample.csv')];

  collect(files, __dirname, (err, rows) => {
    t.error(err);
    t.equal(rows.length, 8);
    t.end();
  });
});

tape('creates Document objects with expected values', (t) => {
  const source = rowSource.createRowStream([path.join(__dirname, 'openaddresses_sample.csv')], __dirname);
  const docs = [];

  const pipeline = proxyquire('../lib/importPipeline', {
    'pelias-dbclient': () => through.obj((doc, enc, next) => { docs.push(doc); next(); }, (done) => {
      t.equal(docs.length, 8);
      t.equal(docs[0].data.source, 'openaddresses');
      t.equal(docs[0].data.name.default, '23042 Twp Road 755 A');
      t.equal(docs[6].data.name.default, 'number Too Many Spaces');
      t.equal(docs[7].data.name.default, 'trim Multiple Spaces');
      done();
      t.end();
    })
  });

  pipeline.create(source, 'test', through.obj());
});

tape('invalid data creates no records', (t) => {
  const source = rowSource.createRowStream([path.join(__dirname, 'openaddresses_bad_data.csv')], __dirname);

  const pipeline = proxyquire('../lib/importPipeline', {
    'pelias-dbclient': () => through.obj(
      (doc, enc, next) => { t.fail('Document created from bad data'); next(); },
      (done) => { t.pass('no Documents created'); done(); t.end(); }
    )
  });

  pipeline.create(source, 'test', through.obj());
});
