const _ = require('lodash');
const ordinals = require('./ordinals');
const dictionary = require('./dictionary');
const surnamePrefixes = dictionary('en', 'surname_prefixes.txt');

class Token {
  constructor(body) {
    this.body = _.isString(body) ? body : '';
  }

  isValid() {
    return _.isString(this.body) && !_.isEmpty(this.body);
  }

  findCase() {
    if (this.body === _.toLower(this.body)) { return Token.LOWERCASED; }
    if (this.body === _.toUpper(this.body)) { return Token.UPPERCASED; }
    return Token.MIXEDCASED;
  }

  // todo: this function is currently specific to English and can't reliably
  // be used for other languages without improvements.
  containsVowels() {
    return this.body.match(/[aeiou]/ig);
  }

  isOrdinalNumber() {
    return ordinals.test(this.body);
  }

  isLikelyAbbreviation() {
    const casing = this.findCase();
    if (casing !== Token.UPPERCASED) { return false; }
    if (this.body.endsWith('.')) { return true; }
    if (this.containsVowels()) { return false; }
    if (this.isOrdinalNumber()) { return false; }
    if (_.has(surnamePrefixes, _.toLower(this.body))){ return false; }
    return true;
  }

  removeLeadingZeros() {
    this.body = this.body.replace(/^(?:0*)([1-9]\d*(st|nd|rd|th))/, '$1');
  }

  selectivelyLowerCase() {
    if (this.findCase() === Token.UPPERCASED && !this.isLikelyAbbreviation()) {
      this.body = _.toLower(this.body);
    }
  }

  selectivelyCapitalize() {
    if (this.findCase() === Token.LOWERCASED) {
      this.body = this.body.split(/\s+/).map(word => _.capitalize(word)).join(' ');
    }
  }
}

Token.LOWERCASED = 0;
Token.UPPERCASED = 1;
Token.MIXEDCASED = 2;

module.exports = Token;
