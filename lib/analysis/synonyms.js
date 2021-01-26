const _ = require('lodash');

// The synonyms function replaces all matching occurrences of tokens in the
// supplied dictionary.
// Some options are provided to control the iteration and termination behaviour
// of the replacer.
// @todo: this does not currently handle matching onmulti-word synonyms
// (although it's technically possible to do so if desired at a later date)

function synonyms(opts) {
  /**
   * options
   *
   * dictionary -- the dictionary to use for looking up replacements
   * maxElements -- maximum elements to iterate
   * maxReplacements -- maximum replacements which can be made
   * direction -- default is iterating left-to-right through the array, use 'left' for the inverse
   * normalizer -- control how the token is normalized before matching occurs
   *
   * return function(tokens) => tokens
   */
  const options = _.defaults({}, opts, {
    dictionary: {},
    maxElements: Infinity,
    maxReplacements: Infinity,
    direction: 'right',
    normalizer: (body) => _.trim(_.toLower(body), '.')
  });

  // iterate from right-to-left
  if (options.direction === 'left') {
    return (tokens) => {
      for (var o = tokens.length - 1; o >= 0; o--) {
        if (o < tokens.length - options.maxElements) { break; }
        var replacement = _.get(options.dictionary, options.normalizer(tokens[o].body));
        if (replacement) {
          tokens[o].body = replacement;
          options.maxReplacements--;
          if (options.maxReplacements <= 0) {
            break;
          }
        }
      }
      return tokens;
    };
  }

  // iterate from left-to-right
  return (tokens) => {
    for (var o = 0; o < tokens.length; o++) {
      if (o >= options.maxElements) { break; }
      var replacement = _.get(options.dictionary, options.normalizer(tokens[o].body));
      if (replacement) {
        tokens[o].body = replacement;
        options.maxReplacements--;
        if (options.maxReplacements <= 0) {
          break;
        }
      }
    }
    return tokens;
  };
}

module.exports = synonyms;
