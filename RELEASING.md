# Release Process

This project uses automated GitHub releases. When you merge a PR to `main`, GitHub Actions automatically:

1. Runs all tests
2. Builds the TypeScript code
3. Creates a bundled version (`bundle/index.js`)
4. Creates a GitHub release with the bundle attached

## How to Create a New Release

### Step 1: Update the version in `package.json`

```bash
# Example: update from 1.0.0 to 1.1.0
npm version patch  # 1.0.0 -> 1.0.1
# or
npm version minor  # 1.0.0 -> 1.1.0
# or
npm version major  # 1.0.0 -> 2.0.0
```

This will update `package.json` automatically.

### Step 2: Commit and create a PR

```bash
git add package.json
git commit -m "Bump version to 1.1.0"
git push origin your-branch
```

Create a PR and get it reviewed.

### Step 3: Merge to main

When the PR is merged to `main`, GitHub Actions will:
- Detect the new version in `package.json`
- Run tests
- Create the bundle
- Create a GitHub release at `v1.1.0` with the bundle attached

## Important Notes

- **The release is tied to the version in `package.json`**
- If the version already exists as a Git tag, the workflow will skip creating a release
- To create a new release, you **must** bump the version in `package.json`
- The workflow automatically generates release notes from PR titles/commits

## Manual Release (if needed)

If you need to create a release manually:

```bash
# Build and bundle
npm run build
npm run bundle

# Create a Git tag
git tag v1.1.0
git push origin v1.1.0

# Then create a release on GitHub manually and attach bundle/index.js
```

## Viewing Releases

All releases are available at:
https://github.com/jamesmehorter/mcp-server-docx/releases
