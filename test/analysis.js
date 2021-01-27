const _ = require('lodash');
const through = require('through2');
const split = require('split2');
require('colors');
const Diff = require('diff');
const delim = '|';

const analyzers = {
  streetName: require('../lib/cleanup').streetName,
  streetNameV2: require('../lib/cleanup_v2').streetName
};

// print each line
const stream = through((chunk, enc, next) => {
  const line = chunk.toString('utf8');
  const columns = [line];

  _.forEach(analyzers, analyzer => {
    columns.push(analyzer(line));
  });

  // both analyzers produced the same result
  // skip these lines as they are not helpful
  // for debugging.
  // if (columns[1] === columns[2]) {
  //   return next();
  // }

  var diffString = '';
  var hasRemoval = false;
  Diff.diffChars(columns[1], columns[2]).forEach((part) => {
    hasRemoval = (hasRemoval || part.removed);
    // green for additions, red for deletions, grey for common parts
    const color = part.added ? 'green' : (part.removed ? 'red' : 'grey');
    diffString += part.value[color];
  });

  columns.push(diffString);

  // only show lines where characters have been removed
  // if (!hasRemoval){
  //   return next();
  // }

  console.log(columns.join(delim));
  next();
});

// print header line
stream.once('pipe', () => console.log(_.concat(['input'], _.keys(analyzers), ['diff']).join(delim)));

process.stdin.pipe(split()).pipe(stream);
