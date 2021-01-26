const fs = require('fs');
const path = require('path');

/**
  load a libpostal dictionary from disk
  eg: https://raw.githubusercontent.com/openvenues/libpostal/master/resources/dictionaries/en/street_types.txt

  libpostal format:
    The leftmost string is treated as the canonical/normalized version.
    Synonyms if any, are appended to the right, delimited by the pipe character.

  see: https://github.com/openvenues/libpostal/tree/master/resources/dictionaries

  arguments:
  - cc (string) country-code corresponding to a subdirectory in the the ./directories folder
  - filename (string) the name of the file to load inside the directory mentioed above
  - includeSelfReferences (bool) whether to also include the canonical synonym in the map
  - minLength (int) minimum valid length for a synonym in the dictionary

  output example:
  {
    'bruecke': 'bruecke',
    'brücke':  'bruecke',
    'brucke':  'bruecke',
    'br.':     'bruecke'
  }
 */

// regular expression to target removal of common punctuation
const PUNCTUATION_REGEX = /[.,\/#!$%\^&\*;:{}=\-_`~()]/g;

module.exports = (cc, filename, includeSelfReferences, minLength) => {
  try {
    const file = fs.readFileSync(path.resolve(__dirname, 'dictionaries', cc, filename)).toString();
    const lines = file.trim().split('\n');

    const map = lines.reduce((obj, line) => {

      // sort the columns so the longest token is considered canonical
      // note: this is required for autocomplete
      const cols = line.trim().split('|').sort((a, b) => b.length - a.length);

      cols.forEach((col, pos) => {
        if (!includeSelfReferences && 0 === pos) { return; } // skip first column ( the expansion )
        if (/[\s]/.test(col)) { return; } // skip multi-word synonyms
        if (col.replace(PUNCTUATION_REGEX).length < (minLength || 0)) { return; } // skip very short synonyms
        obj[col] = cols[0];
      });
      return obj;
    }, {});

    return map;
  }
  catch (e) {
    return {};
  }
};
