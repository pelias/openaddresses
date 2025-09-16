const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const dictionary = require('./analysis/dictionary');
const synonyms = require('./analysis/synonyms');
const ordinals = require('./analysis/ordinals');
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
const dictPath = path.join(__dirname,  'analysis', 'dictionaries');
const locales = fs.readdirSync(dictPath).filter(item => fs.statSync(path.join(dictPath, item)).isDirectory());

const dict = locales.reduce((acc, countryCode) => {
  acc[countryCode] = {
    directionalExpansions: dictionary({
      countryCode,
      filename: 'directional_expansions.txt',
      includeSelfReferences: true
    }),
    diagonalContractions: dictionary({
      countryCode,
      filename: 'diagonal_contractions.txt',
      includeSelfReferences: false
    }),
    suffixedStreetTypes: _.merge(
      dictionary({
        countryCode,
        filename: 'suffixed_street_types_usps.txt',
        includeSelfReferences: true,
        minLength: 2
      }),
      dictionary({
        countryCode,
        filename: 'suffixed_street_types.txt',
        includeSelfReferences: true,
        minLength: 2
      }),
    ),
    prefixedStreetTypes: _.merge(
      dictionary({
        countryCode,
        filename: 'prefixed_street_types.txt',
        includeSelfReferences: true,
        minLength: 1
      }),
    ),
  };
  return acc;
}, {});

function cleanupStreetName(input, locale = 'en') {
  // split by whitespace
  const words = input.split(/\s+/);

  // convert strings to objects
  var tokens = words.map(word => new Token(word));

  // remove leading zeros from housenumbers
  tokens.forEach(token => token.removeLeadingZeros());

  // if the token is all uppercase then try to lowercase it
  tokens.forEach(token => token.selectivelyLowerCase());

  // if the token is identified as an abbreviation then uppercase it
  tokens.forEach(token => token.selectivelyUpperCase());

  // street 'generic' expansion ie. the 'St.' or 'Rd.' portion (rightmost token)
  if (tokens.length >= 2){
    
    // suffixed street type expansions (rightmost token)
    tokens = synonyms({
      dictionary: dict[locale].suffixedStreetTypes,
      maxElements: 1,
      maxReplacements: 1,
      direction: 'left',

      // ignore tokens in the directionalExpansions dict
      ignore: (token) => _.has(dict[locale].directionalExpansions, _.toLower(token.body))
    })(tokens);

    // prefixed street type expansions (second to rightmost token)
    tokens = synonyms({
      dictionary: dict[locale].prefixedStreetTypes,
      maxElements: 1,
      maxReplacements: 1,
      direction: 'right',

      // ignore tokens in the directionalExpansions dict
      ignore: (token) => _.has(dict[locale].directionalExpansions, _.toLower(token.body))
    })(tokens);
  }

  // directional expansions (leftmost token)
  if (tokens.length >= 3) {
    tokens = synonyms({
      dictionary: dict[locale].directionalExpansions,
      maxElements: 1,
      maxReplacements: 1,
      predicate: (token, pos, tokens) => {
        // perform a look-ahead on the next token
        // and ensure it's not in the streetTypes dict
        const next = tokens[pos+1];
        if (!_.isObjectLike(next)){ return true; }
        return !_.has(dict[locale].suffixedStreetTypes, _.toLower(next.body));
      }
    })(tokens);
  }

  // directional expansions (rightmost token)
  if (tokens.length >= 3) {
    tokens = synonyms({
      dictionary: dict[locale].directionalExpansions,
      maxElements: 1,
      maxReplacements: 1,
      direction: 'left'
    })(tokens);
  }

  // diagonal contractions (all tokens)
  if (tokens.length >= 3) {
    tokens = synonyms({
      dictionary: dict[locale].diagonalContractions,
      maxReplacements: 1,
      direction: 'left'
    })(tokens);
  }

  // capitalize lowercased tokens (leaving mixed case tokens unchanged)
  tokens.forEach(token => token.selectivelyCapitalize());

  // add ordinals to english numeric street names
  tokens = ordinals({ dict: dict[locale] })(tokens);

  // convert objects to strings and join by whitespace
  return tokens.map(token => token.body).join(' ');
}

module.exports = {
  streetName: cleanupStreetName
};
