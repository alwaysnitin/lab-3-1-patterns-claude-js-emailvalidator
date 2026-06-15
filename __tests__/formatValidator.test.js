'use strict';

const { isValidFormat } = require('../src/formatValidator');

describe('isValidFormat', () => {
  describe('valid addresses', () => {
    // A spread of realistic, well-formed addresses that must all pass.
    const validEmails = [
      'a@b.com',
      'first.last@sub.domain.io',
      'user+tag@x.co',
      'USER@EXAMPLE.COM', // case should not affect format validity
      'name123@example.co.uk',
    ];

    test.each(validEmails)('accepts "%s"', (email) => {
      expect(isValidFormat(email)).toBe(true);
    });
  });

  describe('invalid addresses', () => {
    // Each entry pairs an input with the failure mode it exercises, so a
    // failing test message points straight at the gap in the rules.
    const invalidEmails = [
      ['plainaddress', 'no "@" at all'],
      ['@no-local.com', 'missing local part'],
      ['no-domain@', 'missing domain'],
      ['no-tld@example', 'missing dotted TLD'],
      ['user@localhost', 'bare host, no TLD'],
      ['two@@at.com', 'double "@"'],
      ['has space@x.com', 'whitespace in local part'],
      ['user@do main.com', 'whitespace in domain'],
      ['user..name@x.com', 'consecutive dots'],
      ['.leading@x.com', 'leading dot'],
      ['trailing.@x.com', 'trailing dot before "@"'],
      ['user@x.com.', 'trailing dot at end'],
      ['user@.com', 'dot immediately after "@"'],
    ];

    test.each(invalidEmails)('rejects "%s" (%s)', (email) => {
      expect(isValidFormat(email)).toBe(false);
    });
  });

  describe('non-string and empty input', () => {
    // isValidFormat answers only the yes/no format question; any non-string
    // or empty value is simply "not valid" here (reason codes live in validate()).
    const badInputs = [null, undefined, 42, {}, [], true, ''];

    test.each(badInputs)('returns false for %p', (input) => {
      expect(isValidFormat(input)).toBe(false);
    });
  });
});
