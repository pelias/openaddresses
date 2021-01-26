const _ = require('lodash');
const dictionary = require('./analysis/dictionary');
const synonyms = require('./analysis/synonyms');
const Token = require('./analysis/Token');

// load dictionaries from disk
const dict = {
  directionals: dictionary('en', 'directionals.txt'),
  personalTitles: dictionary('en', 'personal_titles.txt'),
  highwayTypes: dictionary('en', 'highway_types.txt', null, 2),
  streetTypes: _.merge(
    dictionary('en', 'street_types.txt', null, 2),
    dictionary('en', 'street_types_overrides.txt')
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

  // highway expansion ie. the 'sr' => 'state road'
  // note: this is held in a separate dictionary to the street types
  // as some streets can have both ie. 'Foo Expressway State Route'
  tokens = synonyms({
    dictionary: dict.highwayTypes,
    maxReplacements: 1,
    direction: 'left'
  })(tokens);

  // street 'generic' expansion ie. the 'St.' or 'Rd.' portion
  tokens = synonyms({
    dictionary: dict.streetTypes,
    maxReplacements: 1,
    direction: 'left'
  })(tokens);

  // directionals substitution
  tokens = synonyms({
    dictionary: dict.directionals,
    maxReplacements: 2
  })(tokens);

  // first token replacements
  tokens = synonyms({
    dictionary: dict.personalTitles,
    maxElements: 1,
    maxReplacements: 1
  })(tokens);

  // capitalize lowercased tokens (leaving mixed case tokens unchanged)
  tokens.forEach(token => token.selectivelyCapitalize());

  // convert objects to strings and join by whitespace
  return tokens.map(token => token.body).join(' ');
}

module.exports = {
  streetName: cleanupStreetName
};
