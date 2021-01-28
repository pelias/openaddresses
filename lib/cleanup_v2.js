const _ = require('lodash');
const dictionary = require('./analysis/dictionary');
const synonyms = require('./analysis/synonyms');
const Token = require('./analysis/Token');

/**
 * This file contains a street name normalization algorithm
 * which attempts to convert poorly formatted street names
 * into a more stardardized and aethetically pleasing form.
 *
 * I've written up some more information about the potential
 * pitfall of doing this which explain why the code will always
 * tend to err on the side of caution.
 *
 * see: https://github.com/pelias/openaddresses/pull/477
 *
 * At time of writing the code follows this method:
 * 1. If the text is uppercase, with minor exceptions, lowercase it
 * 2. Expand the 'generic' portion of the name
 * 3. Expand the 'directional' portion of the name
 * 4. Capitalize all lowercased words
 */

// load dictionaries from disk
const dict = {
  directionalExpansions: dictionary('en', 'directional_expansions.txt', true),
  streetTypes: _.merge(
    dictionary('en', 'street_types_usps.txt', true, 2),
    dictionary('en', 'street_types_overrides.txt', true, 2)
  )
};

function cleanupStreetName(input) {
  // split by whitespace
  const words = input.split(/\s+/);

  // convert strings to objects
  var tokens = words.map(word => new Token(word));

  // remove leading zeros from housenumbers
  tokens.forEach(token => token.removeLeadingZeros());

  // remove empty tokens
  // @todo: is this required!? possibly when following remove leading zeros?
  tokens = tokens.filter(token => token.isValid());

  // if the token is all uppercase then try to lowercase it
  tokens.forEach(token => token.selectivelyLowerCase());

  // if the token is identified as an abbreviation then uppercase it
  tokens.forEach(token => token.selectivelyUpperCase());

  // street 'generic' expansion ie. the 'St.' or 'Rd.' portion
  if (tokens.length >= 2){
    tokens = synonyms({
      dictionary: dict.streetTypes,
      maxElements: 1,
      maxReplacements: 1,
      direction: 'left',

      // ignore tokens in the directionalExpansions dict
      ignore: (token) => _.has(dict.directionalExpansions, _.toLower(token.body))
    })(tokens);
  }

  // directional expansions (left tokens)
  if (tokens.length >= 3) {
    tokens = synonyms({
      dictionary: dict.directionalExpansions,
      maxElements: 1,
      maxReplacements: 1,
      predicate: (token, pos, tokens) => {
        // perform a look-ahead on the next token
        // and ensure it's not in the streetTypes dict
        const next = tokens[pos+1];
        if (!_.isObjectLike(next)){ return true; }
        return !_.has(dict.streetTypes, _.toLower(next.body));
      }
    })(tokens);
  }

  // directional expansions (rightmost token)
  if (tokens.length >= 3) {
    tokens = synonyms({
      dictionary: dict.directionalExpansions,
      maxElements: 1,
      maxReplacements: 1,
      direction: 'left'
    })(tokens);
  }

  // capitalize lowercased tokens (leaving mixed case tokens unchanged)
  tokens.forEach(token => token.selectivelyCapitalize());

  // convert objects to strings and join by whitespace
  return tokens.map(token => token.body).join(' ');
}

module.exports = {
  streetName: cleanupStreetName
};
