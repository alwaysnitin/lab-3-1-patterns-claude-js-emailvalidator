'use strict';

const { validate } = require('../src/emailValidator');

describe('validate (integration)', () => {
  test('valid, non-disposable address', () => {
    expect(validate('user@gmail.com')).toEqual({
      valid: true,
      reason: 'valid',
      isDisposable: false,
    });
  });

  test('valid but disposable address stays valid (key precedence rule)', () => {
    // The agreed rule: disposable is an independent flag, NOT a failure.
    expect(validate('throwaway@mailinator.com')).toEqual({
      valid: true,
      reason: 'valid',
      isDisposable: true,
    });
  });

  test('valid disposable via subdomain', () => {
    expect(validate('temp@inbox.mailinator.com')).toEqual({
      valid: true,
      reason: 'valid',
      isDisposable: true,
    });
  });

  test('over-length address reports "too_long"', () => {
    // 254 is the max; build a syntactically valid address that exceeds it so
    // we know the length check fires before the format check.
    const longLocal = 'a'.repeat(250);
    const tooLong = `${longLocal}@x.com`; // 256 chars
    expect(tooLong.length).toBeGreaterThan(254);
    expect(validate(tooLong)).toEqual({
      valid: false,
      reason: 'too_long',
      isDisposable: false,
    });
  });

  test('address exactly at the 254-char limit is accepted', () => {
    // Boundary case: length === 254 must NOT be rejected as too_long.
    const suffix = '@example.com'; // 12 chars
    const local = 'a'.repeat(254 - suffix.length);
    const atLimit = `${local}${suffix}`;
    expect(atLimit.length).toBe(254);
    expect(validate(atLimit)).toEqual({
      valid: true,
      reason: 'valid',
      isDisposable: false,
    });
  });

  test('invalid format', () => {
    expect(validate('not-an-email')).toEqual({
      valid: false,
      reason: 'invalid_format',
      isDisposable: false,
    });
  });

  test('non-string input reports "not_a_string"', () => {
    const badInputs = [null, undefined, 42, {}, [], true];
    for (const input of badInputs) {
      expect(validate(input)).toEqual({
        valid: false,
        reason: 'not_a_string',
        isDisposable: false,
      });
    }
  });

  test('empty or whitespace-only string reports "empty"', () => {
    for (const input of ['', '   ', '\t\n']) {
      expect(validate(input)).toEqual({
        valid: false,
        reason: 'empty',
        isDisposable: false,
      });
    }
  });

  test('surrounding whitespace around an otherwise valid address is trimmed', () => {
    // validate() trims before checking, so padded-but-valid input passes.
    expect(validate('  user@gmail.com  ')).toEqual({
      valid: true,
      reason: 'valid',
      isDisposable: false,
    });
  });

  test('result always has exactly the three documented fields', () => {
    const result = validate('user@gmail.com');
    expect(Object.keys(result).sort()).toEqual(
      ['isDisposable', 'reason', 'valid']
    );
  });
});
