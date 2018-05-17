const fs = require('fs');
const through = require('through2');

function createJSONFileStream(filename) {
  console.log(`creating filestream to ${filename}`);

  const stats = {
    records: 0
  };

  const jsonStream = through.obj(function(model, enc, next) {
    const string = model.data.name.default;//JSON.stringify(model);
    stats.records++;

    return next(null, string + '\n');
  });

  const filestream = fs.createWriteStream(filename);

  // its only okay to connect this stream to the filestream once something is piped into this stream
  jsonStream.on('pipe', function() {
    jsonStream.pipe(filestream);
  });

  return jsonStream;
}

module.exports = createJSONFileStream;
