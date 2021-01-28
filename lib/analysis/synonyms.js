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
   * predicate -- after a match is found this function must return true before the substitution occurs
   * ignore -- run on each token before matching against the dictionary, must return true or the token is skipped
   * normalizer -- control how the token is normalized before matching occurs
   *
   * return function(tokens) => tokens
   */
  const options = _.defaults({}, opts, {
    dictionary: {},
    maxElements: Infinity,
    maxReplacements: Infinity,
    direction: 'right',
    predicate: () => true,
    ignore: () => false,
    normalizer: (body) => _.trim(_.toLower(body), '.')
  });

  // iterate from right-to-left
  if (options.direction === 'left') {
    return (tokens) => {
      var seen = 0; // keep track of how many elements we've seen
      var replaced = 0; // keep track of how many elements we've replaced

      // iterate over tokens in reverse order
      for (var o = tokens.length - 1; o >= 0; o--) {

        // support $ignore
        if (options.ignore(tokens[o], o, tokens)) { continue; }

        // support $maxElements
        if (++seen > options.maxElements) { break; }

        // search for replacement in dictionary
        var replacement = _.get(options.dictionary, options.normalizer(tokens[o].body));
        if (replacement) {

          // support $predicate
          if (!options.predicate(tokens[o], o, tokens)) { continue; }

          // perform replacement
          tokens[o].body = replacement;

          // support $maxReplacements
          replaced++;
          if (replaced >= options.maxReplacements) { break; }
        }
      }

      return tokens;
    };
  }

  // iterate from left-to-right
  return (tokens) => {
    var seen = 0; // keep track of how many elements we've seen
    var replaced = 0; // keep track of how many elements we've replaced

    // iterate over tokens in normal order
    for (var o = 0; o < tokens.length; o++) {

      // support $ignore
      if (options.ignore(tokens[o], o, tokens)){ continue; }

      // support $maxElements
      if (++seen > options.maxElements) { break; }

      // search for replacement in dictionary
      var replacement = _.get(options.dictionary, options.normalizer(tokens[o].body));
      if (replacement) {

        // support $predicate
        if (!options.predicate(tokens[o], o, tokens)) { continue; }

        // perform replacement
        tokens[o].body = replacement;

        // support $maxReplacements
        replaced++;
        if (replaced >= options.maxReplacements) { break; }
      }
    }

    return tokens;
  };
}

module.exports = synonyms;
