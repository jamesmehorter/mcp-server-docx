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

## Questions or Problems?

- Check existing [issues](../../issues)
- Create a new issue with a clear description
- Be respectful and constructive

## License

By contributing, you agree that your contributions will be licensed under the ISC License.

## Thank You!

Your contributions help make this project better for everyone!
