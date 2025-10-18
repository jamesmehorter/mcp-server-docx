# Contributing to MCP Server Docx

Thank you for your interest in contributing! This document provides guidelines and setup instructions.

## Development Setup

### Prerequisites

- **Node.js**: This project uses [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions
- **Git**: For version control

### Getting Started

1. **Clone the repository**

```bash
git clone <repository-url>
cd mcp-server-docx
```

2. **Install the correct Node.js version**

```bash
nvm install  # Reads from .nvmrc and installs/uses the correct version
```

This will automatically install and use the Node.js version specified in `.nvmrc`.

3. **Install dependencies**

```bash
npm install
```

4. **Build the project**

```bash
npm run build
```

5. **Run tests**

```bash
npm test
```

## Development Workflow

### Running Tests

We use Vitest for testing with 54 comprehensive tests:

```bash
npm test              # Run all tests once
npm run test:watch    # Watch mode (recommended for development)
npm run test:coverage # Generate coverage report
npm run test:ui       # Visual test UI
```

**All tests must pass before submitting a PR.**

### Code Quality

Before committing, ensure your code passes all quality checks:

```bash
npm run type:check    # TypeScript type checking
npm run lint:check    # ESLint (no warnings allowed)
npm run format:check  # Prettier formatting check
```

Auto-fix issues:

```bash
npm run lint:fix      # Fix ESLint issues
npm run format:fix    # Format code with Prettier
```

### Local Development with Claude Desktop

1. Build the project:

   ```bash
   npm run build
   ```

2. Configure Claude Desktop to use your local build:

   ```json
   {
     "mcpServers": {
       "mcp-server-docx": {
         "command": "node",
         "args": ["/absolute/path/to/mcp-server-docx/dist/index.js"]
       }
     }
   }
   ```

3. Restart Claude Desktop to load changes

4. Make changes to the TypeScript files in `src/`

5. Rebuild and restart Claude Desktop to test:
   ```bash
   npm run build
   # Then restart Claude Desktop
   ```

**Pro tip:** Use `npm run dev` to run the server directly for debugging.

## Pull Request Process

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write tests for new functionality
   - Update documentation if needed
   - Follow existing code style

3. **Test your changes**

   ```bash
   npm test
   npm run type:check
   npm run lint:check
   npm run format:check
   ```

4. **Commit your changes**

   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

5. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Provide a clear description of the changes
   - Reference any related issues
   - Ensure CI checks pass

## Code Style Guidelines

- **TypeScript**: Use strict mode, provide type definitions
- **Formatting**: Prettier with 2-space indents, single quotes, 100 char width
- **Linting**: ESLint with zero warnings policy
- **Naming**: camelCase for variables/functions, PascalCase for classes/types
- **Comments**: Use JSDoc for public APIs

## Testing Guidelines

- Write tests for all new features
- Maintain or improve code coverage
- Test both success and error cases
- Use descriptive test names

Example:

```typescript
test('should handle markdown links in paragraphs', async () => {
  // Test implementation
});
```

## Project Structure

```
mcp-server-docx/
├── src/
│   ├── __tests__/           # Test files
│   │   ├── document-manager.test.ts
│   │   └── markdown-parser.test.ts
│   ├── index.ts             # MCP server entry point
│   ├── document-manager.ts  # Core document logic
│   ├── markdown-parser.ts   # Markdown parsing
│   └── types.ts             # Type definitions
├── dist/                    # Compiled JavaScript (gitignored)
├── bundle/                  # Single-file bundle (gitignored)
├── .github/workflows/       # CI/CD workflows
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Release Process

See [RELEASING.md](./RELEASING.md) for information about creating releases.

**For contributors:** You typically don't need to worry about releases. Maintainers will handle version bumps and releases when merging PRs.

## For Maintainers

### Managing the OpenAI API Key

This project uses OpenAI's API to automatically generate release notes from code changes when merging to `main`. The release workflow (`.github/workflows/release.yml`) requires an OpenAI API key stored as a repository secret.

#### Creating an OpenAI API Key

1. **Sign up or log in to OpenAI:**
   - Go to [platform.openai.com](https://platform.openai.com)
   - Create an account or sign in

2. **Create an API key:**
   - Navigate to [API Keys](https://platform.openai.com/api-keys)
   - Click "Create new secret key"
   - Configure the key with these settings:
     - **Owned by:** You (default, recommended for personal projects)
     - **Name:** `mcp-server-docx-releases` (or any descriptive name)
     - **Project:** Select your project (or "Default project")
     - **Permissions:**
       - **"All"** (recommended - simplest option)
       - **"Restricted"** (if you want fine-grained control):
         - **Model capabilities:** Write ✅ (required for `/v1/chat/completions`)
         - All other permissions: None (not needed for release notes)
   - Click "Create secret key"
   - **Important:** Copy the key immediately - you won't be able to see it again

3. **Set up billing (required):**
   - Go to [Billing Settings](https://platform.openai.com/account/billing)
   - Add a payment method
   - The workflow uses `gpt-4o-mini` which is very cost-effective (~$0.01 per release)

#### Adding the API Key to GitHub

1. **Navigate to repository secrets:**
   - Go to: `https://github.com/jamesmehorter/mcp-server-docx/settings/secrets/actions`
   - Or: Repository Settings → Secrets and variables → Actions

2. **Add the secret:**
   - Click "New repository secret"
   - **Name:** `OPENAI_API_KEY` (must be exact)
   - **Value:** Paste your OpenAI API key
   - Click "Add secret"

3. **Verify it's working:**
   - The next time a PR is merged to `main`, check the Actions tab
   - The "Generate release notes with OpenAI" step should succeed
   - The release notes should appear automatically generated

#### Security Notes

- **Never commit the API key** to the repository
- The key is only accessible to GitHub Actions workflows
- Only repository admins can view/edit secrets
- Rotate the key periodically for security
- Monitor OpenAI usage at [platform.openai.com/usage](https://platform.openai.com/usage)

#### If the API Key Expires or Fails

If the release workflow fails with an authentication error:

1. Generate a new API key following the steps above
2. Update the `OPENAI_API_KEY` secret in GitHub
3. Re-run the failed workflow from the Actions tab

## Questions or Problems?

- Check existing [issues](../../issues)
- Create a new issue with a clear description
- Be respectful and constructive

## License

By contributing, you agree that your contributions will be licensed under the ISC License.

## Thank You!

Your contributions help make this project better for everyone!
