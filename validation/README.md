# Validation Harness

Tests eslint-plugin-typed-jsdoc against popular JavaScript packages from npm.

## Usage

```bash
# Test all configured packages
pnpm validate

# Test specific packages
pnpm validate lodash express

# Just download packages (no linting)
pnpm validate:download

# Regenerate summary from existing reports
pnpm validate:report

# Sync reports to website
pnpm validate:sync
```

## Workflow

1. **Run validation** - `pnpm validate` downloads packages and runs ESLint
2. **Review reports** - Check `reports/` for results
3. **Sync to website** - `pnpm validate:sync` copies data to website

## Adding a New Package

Edit `packages.json` and add an entry:

```json
{
  "name": "package-name",
  "repo": "owner/repo",
  "branch": "main",
  "src": "lib",
  "types": "@types/package-name",
  "include": ["**/*.js"],
  "exclude": ["test/**"]
}
```

Fields:
- `name`: Package name (used for directory and report naming)
- `repo`: GitHub repository (owner/repo format)
- `branch`: Branch to clone
- `src`: Source directory within the repo
- `types`: DefinitelyTyped package name, or `null` if none
- `include`: Glob patterns for files to lint
- `exclude`: Glob patterns to exclude

## Reports

Reports are saved to `reports/`:
- `{package}.json` - Detailed report per package
- `_summary.json` - Aggregated summary

## Directory Structure

```
validation/
├── README.md              # This file
├── packages.json          # Package configurations
├── harness.js             # Main harness script
├── sync-to-website.js     # Sync script
├── packages/              # Downloaded package sources (gitignored)
│   ├── lodash/
│   ├── express/
│   └── ...
└── reports/               # Generated reports
    ├── lodash.json
    ├── express.json
    └── _summary.json
```

## Interpreting Results

The harness reports issues from two rules:
- **accurate-jsdoc** (error): JSDoc types don't match TypeScript inference
- **no-redundant-jsdoc** (warning): JSDoc types that add no information
