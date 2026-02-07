# Release Process

Releases are automated using [release-plan](https://github.com/release-plan/release-plan/).

## PR Labels

All PRs must be labeled with one of:

- `breaking` - Breaking changes
- `enhancement` - New features
- `bug` - Bug fixes
- `documentation` - Documentation updates
- `internal` - Internal changes

## How It Works

1. Label your PRs appropriately
2. When PRs are merged to `trunk`, release-plan creates a "Prepare Release" PR
3. Merge the "Prepare Release" PR to publish to npm

## Manual Release

For the initial release or manual releases:

```bash
npx release-plan prepare
# Review changes, then:
npx release-plan publish
```
