const _ = require('lodash');

// The ordinal function replaces all numeric street names (ie. 30 street)
// with a version including ordinals (ie. 30th street).
// note: this is currently only configured for the English language

function ordinals(opts) {
  return (tokens) => {

    // consider all but final token
    for (var o = 0; o < tokens.length-1; o++) {

      // token must be entirely numeric
      if (!tokens[o].isNumeric()) { continue; }

      // token must be followed by a street type token
      if (!_.has(opts.dict.streetTypes, _.toLower(tokens[o+1].body))) { continue; }

      // token must either be the leftmost token or be preceeded by a directional token
      if(o !== 0) {
        if (!_.has(opts.dict.directionalExpansions, _.toLower(tokens[o-1].body))) {
          continue;
        }
      }

      // append the english ordinal suffix
      tokens[o].body += englishOrdinalSuffix(tokens[o].body);

      // maximum of one replacement
      break;
    }

    return tokens;
  };
}

function englishOrdinalSuffix(i) {
  const j = i % 10, k = i % 100;
  if (j === 1 && k !== 11) { return 'st'; }
  if (j === 2 && k !== 12) { return 'nd'; }
  if (j === 3 && k !== 13) { return 'rd'; }
  return 'th';
}

module.exports = ordinals;
