# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-01-30

### Added

- Initial release of eslint-plugin-typed-jsdoc
- Four ESLint rules for JSDoc type accuracy:
  - `tjd/accurate-jsdoc` - Ensure JSDoc types match TypeScript inference
  - `tjd/no-redundant-jsdoc` - Remove unnecessary type annotations
  - `tjd/no-implicit-any` - Require types where TypeScript infers `any`
  - `tjd/require-jsdoc-types` - Require complete JSDoc on exported functions
- All rules include auto-fix support
- Three preset configurations:
  - `recommended` - Balanced defaults
  - `strict` - All rules as errors
  - `minimal` - Just accuracy rules
- `ignorePatterns` option for all rules to skip functions by name
- `keepDescriptions` option for `no-redundant-jsdoc`
- Comprehensive type comparison handling:
  - `Array<T>` vs `T[]`
  - `Object<K, V>` vs `{ [x: K]: V }`
  - Wrapper types (`String` vs `string`)
  - Nullable types (`?T` vs `T | null`)
  - Union type ordering
  - Namespace prefixes (`fs.Stats` vs `Stats`)
  - Generic defaults (`Buffer` vs `Buffer<ArrayBufferLike>`)

### Validated

- Tested against 68 popular npm packages
- 3,699 files analyzed
- 118 legitimate type mismatch errors found (not false positives)
- Zero-issue packages: cookie, escape-html, fresh, methods, vary, encodeurl, browserify
