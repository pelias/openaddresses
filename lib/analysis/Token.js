const _ = require('lodash');

class Token {
  constructor(body) {
    this.body = _.isString(body) ? body : '';
  }

  isValid() {
    return _.isString(this.body) && !_.isEmpty(this.body);
  }

  isNumeric() {
    return /^\d+$/.test(this.body);
  }

  findCase() {
    if (this.body === _.toLower(this.body)) { return Token.LOWERCASED; }
    if (this.body === _.toUpper(this.body)) { return Token.UPPERCASED; }
    return Token.MIXEDCASED;
  }

  removeLeadingZeros() {
    this.body = this.body.replace(/^(?:0*)([1-9]\d*(st|nd|rd|th))/, '$1');
  }

  selectivelyLowerCase() {
    if (this.findCase() === Token.UPPERCASED) {
      this.body = _.toLower(this.body);
    }
  }

  selectivelyUpperCase() {
    if (this.findCase() === Token.LOWERCASED && this.body.endsWith('.')) {
      this.body = _.toUpper(this.body);
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
