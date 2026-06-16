'use strict';

const { isValidFormat, MAX_EMAIL_LENGTH } = require('../src/formatValidator');

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

  describe('length bounds', () => {
    test('exposes a sane MAX_EMAIL_LENGTH', () => {
      expect(MAX_EMAIL_LENGTH).toBe(254);
    });

    test('rejects input longer than MAX_EMAIL_LENGTH', () => {
      const tooLong = 'a'.repeat(MAX_EMAIL_LENGTH) + '@x.com';
      expect(isValidFormat(tooLong)).toBe(false);
    });

    test('accepts an otherwise-valid address at exactly MAX_EMAIL_LENGTH', () => {
      const suffix = '@example.com';
      const local = 'a'.repeat(MAX_EMAIL_LENGTH - suffix.length);
      const atLimit = `${local}${suffix}`;
      expect(atLimit.length).toBe(MAX_EMAIL_LENGTH);
      expect(isValidFormat(atLimit)).toBe(true);
    });
  });

  describe('control characters and malformed Unicode', () => {
    // These pass the [^\s@] character classes but must be rejected: control
    // chars are an injection/truncation hazard, lone surrogates can't be
    // encoded to UTF-8 downstream.
    test('rejects an embedded NUL byte', () => {
      expect(isValidFormat(`user@x${String.fromCharCode(0)}.com`)).toBe(false);
    });

    test('rejects a C0 control character', () => {
      expect(isValidFormat(`a${String.fromCharCode(0x1f)}@x.com`)).toBe(false);
    });

    test('rejects DEL (0x7f)', () => {
      expect(isValidFormat(`a${String.fromCharCode(0x7f)}@x.com`)).toBe(false);
    });

    test('rejects a lone surrogate', () => {
      expect(isValidFormat(`user@${String.fromCharCode(0xd800)}x.com`)).toBe(false);
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
