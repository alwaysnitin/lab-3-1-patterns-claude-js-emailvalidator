'use strict';

const { validate } = require('../src/emailValidator');

describe('validate (integration)', () => {
  test('valid, non-disposable address', () => {
    expect(validate('user@gmail.com')).toEqual({
      valid: true,
      reason: 'valid',
      isDisposable: false,
      normalized: 'user@gmail.com',
    });
  });

  test('valid but disposable address stays valid (key precedence rule)', () => {
    // The agreed rule: disposable is an independent flag, NOT a failure.
    expect(validate('throwaway@mailinator.com')).toEqual({
      valid: true,
      reason: 'valid',
      isDisposable: true,
      normalized: 'throwaway@mailinator.com',
    });
  });

  test('valid disposable via subdomain', () => {
    expect(validate('temp@inbox.mailinator.com')).toEqual({
      valid: true,
      reason: 'valid',
      isDisposable: true,
      normalized: 'temp@inbox.mailinator.com',
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
      normalized: tooLong,
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
      normalized: atLimit,
    });
  });

  test('invalid format', () => {
    expect(validate('not-an-email')).toEqual({
      valid: false,
      reason: 'invalid_format',
      isDisposable: false,
      normalized: 'not-an-email',
    });
  });

  test('non-string input reports "not_a_string"', () => {
    const badInputs = [null, undefined, 42, {}, [], true];
    for (const input of badInputs) {
      expect(validate(input)).toEqual({
        valid: false,
        reason: 'not_a_string',
        isDisposable: false,
        normalized: null,
      });
    }
  });

  test('empty or whitespace-only string reports "empty"', () => {
    for (const input of ['', '   ', '\t\n']) {
      expect(validate(input)).toEqual({
        valid: false,
        reason: 'empty',
        isDisposable: false,
        normalized: '',
      });
    }
  });

  test('surrounding whitespace is trimmed and normalized reflects the trimmed value', () => {
    // validate() trims before checking, so padded-but-valid input passes -- and
    // `normalized` hands back the trimmed address callers should persist, not
    // the padded original.
    expect(validate('  user@gmail.com  ')).toEqual({
      valid: true,
      reason: 'valid',
      isDisposable: false,
      normalized: 'user@gmail.com',
    });
  });

  describe('control characters and malformed Unicode', () => {
    test('rejects an address containing a NUL byte as "control_char"', () => {
      // NUL passes the format regex but is an injection/truncation vector.
      const withNul = `user@exa${String.fromCharCode(0)}mple.com`;
      expect(validate(withNul)).toEqual({
        valid: false,
        reason: 'control_char',
        isDisposable: false,
        normalized: withNul,
      });
    });

    test('rejects other C0 control characters (e.g. unit separator)', () => {
      const withControl = `a${String.fromCharCode(0x1f)}b@x.com`;
      expect(validate(withControl).reason).toBe('control_char');
    });

    test('rejects a lone surrogate as "malformed_unicode"', () => {
      // A lone high surrogate is well-typed JS but cannot be encoded to UTF-8,
      // so downstream storage/transport would corrupt or reject it.
      const loneSurrogate = `user@${String.fromCharCode(0xd800)}x.com`;
      const result = validate(loneSurrogate);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('malformed_unicode');
    });
  });

  test('result always has exactly the four documented fields', () => {
    const result = validate('user@gmail.com');
    expect(Object.keys(result).sort()).toEqual(
      ['isDisposable', 'normalized', 'reason', 'valid']
    );
  });
});
