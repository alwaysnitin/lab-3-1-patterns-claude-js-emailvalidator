'use strict';

const { validate } = require('../src/emailValidator');

// Focused acceptance tests for the five required scenarios. Uses toMatchObject
// so each test asserts only the fields named in the requirement, ignoring the
// other documented fields (reason, normalized) where they aren't the point.
describe('validate (requirements)', () => {
  test('1. happy path: a valid normal email is valid and not disposable', () => {
    expect(validate('user@gmail.com')).toMatchObject({
      valid: true,
      isDisposable: false,
    });
  });

  test('2. disposable detection: a mailinator email is valid but disposable', () => {
    expect(validate('throwaway@mailinator.com')).toMatchObject({
      valid: true,
      isDisposable: true,
    });
  });

  test('3. invalid format: "not-an-email" is rejected as invalid_format', () => {
    // Reason code is snake_case ("invalid_format"), per the module's API.
    expect(validate('not-an-email')).toMatchObject({
      valid: false,
      reason: 'invalid_format',
    });
  });

  test('4. empty input: "" is rejected as empty', () => {
    expect(validate('')).toMatchObject({
      valid: false,
      reason: 'empty',
    });
  });

  test('5. null input: null is rejected as not_a_string', () => {
    // The implementation intentionally distinguishes "wrong type" from "empty
    // string", so null reports "not_a_string" (not "empty"). Confirmed with
    // the maintainer to keep this distinction.
    expect(validate(null)).toMatchObject({
      valid: false,
      reason: 'not_a_string',
    });
  });
});
