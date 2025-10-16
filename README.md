# High-Performance Word Document MCP Server

A fast, TypeScript-based MCP server for Word document generation that outperforms Python implementations by 10x.

## Performance

- **Target:** <300ms per MCP call (vs 1-2s in Python)
- **Full resume generation:** <5 seconds total (vs 35s in Python)
- **Memory efficient:** Documents kept in memory between calls to avoid repeated disk I/O

## Features

- **Batch Operation:** Create complete documents in a single MCP call (1 call vs 20-30)
- **Auto-Session Creation:** No need to explicitly create documents - sessions auto-create when adding content
- Create Word documents with custom metadata (title, author)
- Add formatted paragraphs (font, size, bold, italic, color)
- Add headings with optional borders (levels 1-9)
- Add bulleted lists
- In-memory document management for fast operations
- Save documents only when needed
- Comprehensive test suite with 21 passing tests

## Installation

```bash
npm install
npm run build
```

## Testing

Comprehensive test suite with 21 tests powered by **Vitest** (fast, modern, ESM-native):

```bash
npm test              # Run tests once
npm run test:watch    # Watch mode (fast HMR)
npm run test:coverage # Coverage report
npm run test:ui       # Visual UI mode
```

The test suite validates:

- Auto-session creation
- Paragraph, heading, and bullet list formatting
- Batch document creation
- Error handling
- Complex multi-section documents

**Performance:** All 21 tests complete in ~350ms (2x faster than Jest)

## Code Quality

This project enforces code quality with **ESLint**, **Prettier**, and **TypeScript**:

```bash
npm run lint         # Run ESLint (fails on warnings)
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format code with Prettier
npm run format:check # Check formatting (CI)
npm run typecheck    # TypeScript type checking
npm run ci           # Run all checks (typecheck + lint + format + test)
```

**Prettier** configuration:

- Single quotes
- 2-space indentation
- 100 character line width
- Trailing commas (ES5)
- Semicolons

**ESLint** rules:

- TypeScript-specific linting
- No unused variables (prefix with `_` to ignore)
- Prefer explicit types over `any` (warning)
- Integrated with Prettier

### GitHub Actions CI

Pull requests automatically run:

- ✅ TypeScript type checking
- ✅ ESLint (max 0 warnings)
- ✅ Prettier formatting check
- ✅ All 21 tests
- ✅ Build verification

**PRs cannot be merged until all checks pass.**

## Claude Desktop Integration

### 1. Build the project

```bash
npm run build
```

### 2. Update Claude Desktop config

Edit your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add the following configuration:

```json
{
  "mcpServers": {
    "word-document-server": {
      "command": "node",
      "args": ["/Users/james/MCP Servers/mcp-server-docx/dist/index.js"]
    }
  }
}
```

**Note:** Replace the path with the absolute path to your `dist/index.js` file.

### 3. Restart Claude Desktop

Quit and reopen Claude Desktop to load the new MCP server.

### 4. Verify installation

In Claude Desktop, you should now see the Word Document Server tools available:

- `create_document`
- `add_paragraph`
- `add_heading`
- `add_bullet_list`
- `save_document`
- `create_document_from_content` ⚡ **RECOMMENDED - Single call for entire document**

## Available Tools

### create_document_from_content ⚡ RECOMMENDED

**The fastest way to create documents - use this instead of multiple calls!**

Create a complete Word document in a single MCP call. This is **10x faster** than making multiple individual calls.

**Parameters:**

- `filename` (required): Path to save the document
- `content` (required): Array of content items
- `title` (optional): Document title
- `author` (optional): Document author

**Content Item Structure:**

```typescript
{
  type: 'paragraph' | 'heading' | 'bullets',
  text?: string,              // For paragraph and heading
  items?: string[],           // For bullets
  format?: {
    fontName?: string,
    fontSize?: number,        // in points
    bold?: boolean,
    italic?: boolean,
    color?: string,           // hex RGB
    level?: number,           // 1-9 for headings
    borderBottom?: boolean    // for headings
  }
}
```

**Example - Complete Resume in ONE Call:**

```typescript
create_document_from_content({
  filename: '/tmp/resume.docx',
  title: 'John Doe Resume',
  author: 'John Doe',
  content: [
    {
      type: 'paragraph',
      text: 'JOHN DOE',
      format: { fontName: 'Helvetica', fontSize: 36, bold: true },
    },
    {
      type: 'heading',
      text: 'PROFESSIONAL SUMMARY',
      format: { level: 2, fontName: 'Helvetica', fontSize: 14, borderBottom: true },
    },
    {
      type: 'paragraph',
      text: 'Software engineer with 10+ years experience building scalable systems.',
      format: { fontName: 'Times New Roman', fontSize: 14 },
    },
    {
      type: 'heading',
      text: 'EXPERIENCE',
      format: { level: 2, borderBottom: true },
    },
    {
      type: 'bullets',
      items: [
        'Led 4-engineer team building next-gen platform',
        'Architected React-based component library',
        'Built high-scale PostgreSQL systems handling 100M+ records',
      ],
      format: { fontName: 'Times New Roman', fontSize: 14 },
    },
  ],
});
```

**Result:** Document created and saved in ~300ms (vs 5-10 seconds with multiple calls)

---

## Individual Tools (For Incremental Building)

**Note:** Sessions auto-create when you start adding content! You can skip `create_document` and jump straight to `add_paragraph`, `add_heading`, or `add_bullet_list`. Just remember to call `save_document` when done.

### create_document

Create a new Word document (optional - sessions auto-create).

**Parameters:**

- `filename` (required): Path to save the document
- `title` (optional): Document title
- `author` (optional): Document author

**Example:**

```typescript
create_document({
  filename: '/tmp/resume.docx',
  title: 'My Resume',
  author: 'John Doe',
});
```

### add_paragraph

Add a paragraph with optional formatting.

**Parameters:**

- `filename` (required): Document filename
- `text` (required): Paragraph text
- `font_name` (optional): Font family (e.g., "Helvetica", "Times New Roman")
- `font_size` (optional): Font size in points
- `bold` (optional): Bold text
- `italic` (optional): Italic text
- `color` (optional): Hex RGB color (e.g., "FF0000" for red)

**Example:**

```typescript
add_paragraph({
  filename: '/tmp/resume.docx',
  text: 'Software Engineer with 10+ years experience',
  font_name: 'Times New Roman',
  font_size: 14,
  bold: false,
  italic: false,
});
```

### add_heading

Add a heading with optional formatting.

**Parameters:**

- `filename` (required): Document filename
- `text` (required): Heading text
- `level` (optional): Heading level 1-9 (default: 1)
- `font_name` (optional): Font family
- `font_size` (optional): Font size in points
- `bold` (optional): Bold text (default: true)
- `border_bottom` (optional): Add bottom border

**Example:**

```typescript
add_heading({
  filename: '/tmp/resume.docx',
  text: 'PROFESSIONAL SUMMARY',
  level: 2,
  font_name: 'Helvetica',
  font_size: 14,
  bold: true,
  border_bottom: true,
});
```

### add_bullet_list

Add a bulleted list.

**Parameters:**

- `filename` (required): Document filename
- `items` (required): Array of bullet point text
- `font_name` (optional): Font family
- `font_size` (optional): Font size in points

**Example:**

```typescript
add_bullet_list({
  filename: '/tmp/resume.docx',
  items: [
    'Led 4-engineer team',
    'Architected React platform',
    'Built high-scale PostgreSQL systems',
  ],
  font_name: 'Times New Roman',
  font_size: 14,
});
```

### save_document

Save the document to disk.

**Parameters:**

- `filename` (required): Document filename

**Example:**

```typescript
save_document({
  filename: '/tmp/resume.docx',
});
```

## Usage Examples

### Fast Mode (Recommended) - Single Batch Call

Tell Claude to use the batch operation for maximum speed:

```
Create a resume for me at /tmp/my-resume.docx using the create_document_from_content tool.

Include:
- My name "JANE SMITH" in large bold Helvetica (36pt)
- A "PROFESSIONAL SUMMARY" heading with a bottom border
- A paragraph about my experience as a software engineer
- An "EXPERIENCE" heading with a bottom border
- Bullet points for my key achievements
```

**Result:** Document created in ~300ms (1 MCP call)

### Incremental Mode - Multiple Calls

For step-by-step document building:

```
Create a new Word document at /tmp/my-resume.docx with my name "Jane Smith" as the author.

Add my name as the title: "JANE SMITH" in Helvetica, 36pt, bold.

Add a heading "PROFESSIONAL SUMMARY" in Helvetica, 14pt, bold, with a bottom border.

Add a paragraph describing my experience: "Software engineer with 10+ years experience..."

Add a heading "EXPERIENCE" with a bottom border.

Add bullet points for my achievements.

Save the document.
```

**Result:** Document created in 3-5s (6-8 MCP calls)

**Performance Tip:** Use batch mode whenever possible for 10x faster execution!

## Architecture

### Key Design Decisions

1. **Batch Operations**: The `create_document_from_content` method allows creating entire documents in a single MCP call, reducing overhead from 20-30 calls to just 1. This is the primary performance optimization.

2. **Auto-Session Creation**: Methods automatically create document sessions if they don't exist. This reduces friction and allows Claude to start adding content immediately without explicit initialization.

3. **In-Memory Storage**: Documents are kept in memory as arrays of paragraphs until explicitly saved. This eliminates repeated file I/O and makes the server extremely fast.

4. **Document Rebuilding**: The docx library requires all content to be known at document creation time. We store content elements and rebuild the document when saving.

5. **Type Safety**: Full TypeScript type definitions ensure correctness and great developer experience.

6. **Performance First**: Every operation is optimized for speed:
   - No unnecessary file operations
   - Minimal object allocations
   - Efficient paragraph array management

## Project Structure

```
mcp-server-docx/
├── src/
│   ├── __tests__/
│   │   └── document-manager.test.ts  # Vitest test suite (21 tests)
│   ├── index.ts              # MCP server implementation
│   ├── document-manager.ts   # Document management logic
│   └── types.ts              # TypeScript type definitions
├── dist/                     # Compiled JavaScript (generated)
├── vitest.config.ts          # Vitest configuration
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## Future Enhancements

- **Tables**: Add support for creating tables
- **Images**: Insert images into documents
- **Styles**: Custom style definitions
- **Headers/Footers**: Page headers and footers
- **Page Breaks**: Insert page breaks
- **Search & Replace**: Find and replace text in documents

## Performance Comparison

| Metric                    | Python MCP | Node.js MCP (Incremental) | Node.js MCP (Batch) | Best Improvement   |
| ------------------------- | ---------- | ------------------------- | ------------------- | ------------------ |
| Startup time              | ~200ms     | ~50ms                     | ~50ms               | **4x faster**      |
| Per-call latency          | 1-2s       | 100-300ms                 | N/A                 | **5-10x faster**   |
| Full resume (20-30 calls) | ~35s       | 3-5s                      | ~300ms              | **100x faster**    |
| Number of MCP calls       | 20-30      | 20-30                     | 1                   | **20-30x fewer**   |
| Memory usage              | Higher     | Lower                     | Lower               | **More efficient** |

**Key Insight:** The batch operation (`create_document_from_content`) provides the biggest performance win by reducing 20-30 MCP calls to just 1, resulting in **100x faster** document generation!

## License

ISC

## Author

James Mehorter
