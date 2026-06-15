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
