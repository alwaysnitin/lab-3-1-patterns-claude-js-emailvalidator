# Email Validator

[![CI](https://github.com/alwaysnitin/lab-3-1-patterns-claude-js-emailvalidator/actions/workflows/ci.yml/badge.svg)](https://github.com/alwaysnitin/lab-3-1-patterns-claude-js-emailvalidator/actions/workflows/ci.yml)

A small, dependency-free Node.js module that validates email addresses. It checks
syntactic format and flags addresses from known **disposable** email providers
(e.g. Mailinator, 10MinuteMail), returning a structured result object.

## Features

- ✅ Pragmatic email format validation (no external libraries)
- 🗑️ Detects disposable / throwaway email domains from a bundled list
- 🌲 Matches subdomains of disposable domains (`x.mailinator.com` counts)
- 🔁 Synchronous API — never throws; bad input is reported in the result
- 🧪 Fully unit-tested with Jest

## Installation

This is a local module within the project. Require it directly:

```js
const { validate } = require('./'); // from the project root (uses index.js)
```

## Usage

```js
const { validate } = require('./');

validate('user@gmail.com');
// → { valid: true, reason: 'valid', isDisposable: false }

validate('throwaway@mailinator.com');
// → { valid: true, reason: 'valid', isDisposable: true }

validate('temp@inbox.mailinator.com'); // subdomain match
// → { valid: true, reason: 'valid', isDisposable: true }

validate('not-an-email');
// → { valid: false, reason: 'invalid_format', isDisposable: false }
```

## API

### `validate(email)`

| Parameter | Type     | Description                       |
|-----------|----------|-----------------------------------|
| `email`   | `string` | The email address to validate.    |

**Returns:** `ValidationResult`

```ts
{
  valid: boolean,        // true if the address is syntactically valid
  reason: string,        // see reason codes below
  isDisposable: boolean  // true if the domain is a disposable provider
}
```

#### `reason` codes

| Value            | Meaning                                              |
|------------------|------------------------------------------------------|
| `"valid"`        | The address is well-formed.                          |
| `"not_a_string"` | Input was not a string (e.g. `null`, number, object).|
| `"empty"`        | Input was an empty or whitespace-only string.        |
| `"too_long"`     | Input exceeded the maximum length of 254 characters (RFC 5321). |
| `"invalid_format"` | Input failed the format check.                     |

> **Note:** A disposable address is still considered **valid**. `isDisposable`
> is an independent flag, not a failure condition — a syntactically correct
> disposable address returns `{ valid: true, reason: 'valid', isDisposable: true }`.

> **Whitespace:** Surrounding whitespace is trimmed before validation, so
> `"  user@gmail.com  "` is accepted. Whitespace *within* the address is still
> rejected as `invalid_format`.

## Disposable domain list

The list lives in [`src/data/disposable-domains.json`](src/data/disposable-domains.json)
as a plain array of lowercase root domains. To add providers, simply add new
entries to that file — matching is case-insensitive and covers subdomains.

## Project structure

```
.
├── index.js                       # Public entry point (re-exports validate)
├── src/
│   ├── emailValidator.js          # Orchestrates format + disposable checks
│   ├── formatValidator.js         # Syntactic format validation (regex)
│   ├── disposableChecker.js       # Domain extraction + disposable matching
│   └── data/
│       └── disposable-domains.json
└── __tests__/
    ├── emailValidator.test.js
    ├── formatValidator.test.js
    └── disposableChecker.test.js
```

## Testing

```bash
npm test
```

Runs the Jest suite (44 tests across 3 suites).

## Notes & limitations

- Format validation is **pragmatic**, not full RFC 5322. It accepts the vast
  majority of real-world addresses and rejects common malformations, but does
  not support exotic forms like quoted local parts or IP-literal domains.
- The disposable list is a **static bundled snapshot**; it does not auto-update.
```
