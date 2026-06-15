'use strict';

const { isDisposable, extractDomain } = require('../src/disposableChecker');
const disposableDomains = require('../src/data/disposable-domains.json');

describe('extractDomain', () => {
  test('returns the lowercased domain after "@"', () => {
    expect(extractDomain('user@Example.COM')).toBe('example.com');
  });

  test('uses the domain after the LAST "@" for malformed multi-"@" input', () => {
    // Domain extraction is intentionally lenient; format validity is checked
    // elsewhere. The portion after the final "@" is treated as the domain.
    expect(extractDomain('weird@host@final.com')).toBe('final.com');
  });

  test('returns null when there is no "@"', () => {
    expect(extractDomain('no-at-symbol')).toBeNull();
  });

  test('returns null when the domain is empty (trailing "@")', () => {
    expect(extractDomain('user@')).toBeNull();
  });

  test('returns null for non-string input', () => {
    expect(extractDomain(null)).toBeNull();
    expect(extractDomain(undefined)).toBeNull();
    expect(extractDomain(123)).toBeNull();
  });
});

describe('isDisposable', () => {
  test('detects a known disposable domain', () => {
    expect(isDisposable('someone@mailinator.com')).toBe(true);
    expect(isDisposable('test@10minutemail.com')).toBe(true);
  });

  test('is case-insensitive', () => {
    expect(isDisposable('User@MAILINATOR.COM')).toBe(true);
  });

  test('matches subdomains of a disposable domain', () => {
    // Per requirement: "x.mailinator.com" counts as disposable because it is a
    // subdomain of the listed "mailinator.com".
    expect(isDisposable('user@inbox.mailinator.com')).toBe(true);
    expect(isDisposable('user@a.b.mailinator.com')).toBe(true);
  });

  test('does NOT match a domain that merely ends with a listed domain', () => {
    // The leading-dot anchoring guards against false positives like this.
    expect(isDisposable('user@notmailinator.com')).toBe(false);
  });

  test('returns false for normal, non-disposable domains', () => {
    expect(isDisposable('user@gmail.com')).toBe(false);
    expect(isDisposable('employee@company.co.uk')).toBe(false);
  });

  test('returns false when no domain can be extracted', () => {
    expect(isDisposable('no-at-symbol')).toBe(false);
    expect(isDisposable(null)).toBe(false);
  });
});

describe('disposable-domains.json integrity', () => {
  // Guards against careless edits to the data file that would silently weaken
  // matching (matching lowercases input, so an uppercase/padded entry would
  // never be hit; duplicates and blanks are pure noise).
  test('is a non-empty array', () => {
    expect(Array.isArray(disposableDomains)).toBe(true);
    expect(disposableDomains.length).toBeGreaterThan(0);
  });

  test('every entry is a lowercase, trimmed, non-empty string', () => {
    for (const entry of disposableDomains) {
      expect(typeof entry).toBe('string');
      expect(entry.length).toBeGreaterThan(0);
      expect(entry).toBe(entry.toLowerCase().trim());
    }
  });

  test('every entry looks like a domain (has a dot, no "@" or spaces)', () => {
    for (const entry of disposableDomains) {
      expect(entry).toContain('.');
      expect(entry).not.toMatch(/[@\s]/);
    }
  });

  test('contains no duplicate entries', () => {
    expect(new Set(disposableDomains).size).toBe(disposableDomains.length);
  });
});
