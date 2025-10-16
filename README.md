# Word Document MCP Server

A fast, TypeScript-based MCP server for creating professional Word documents from markdown or structured content.

**🚀 Markdown-First Workflow** - Just write natural markdown and get professional Word documents in ~300ms!

## Quick Setup

### 1. Build the project

```bash
cd /path/to/mcp-server-docx
npm install
npm run build
```

### 2. Configure Claude Desktop

Edit your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add this configuration:

```json
{
  "mcpServers": {
    "word-document-server": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server-docx/dist/index.js"]
    }
  }
}
```

**Note:** Replace `/absolute/path/to/mcp-server-docx` with your actual path.

### 3. Restart Claude Desktop

Quit and reopen Claude Desktop to load the MCP server.

### 4. Verify it works

Try this in Claude Desktop:

```
Create a Word document at /tmp/test.docx from this markdown:

# Hello World

This is my **first** Word document with *markdown*!

## Features
- Easy to use
- Fast generation
- Professional formatting
```

You should get a properly formatted Word document at `/tmp/test.docx`!

## Features

### 🎯 Pure Markdown Mode (Recommended)

**The simplest way to create Word documents** - just write natural markdown like you always do!

Just tell Claude what you want in plain markdown syntax:

```
Create a Word document at /tmp/my-resume.docx from this markdown:

# JANE SMITH
jane@example.com | (555) 123-4567

## PROFESSIONAL SUMMARY

I am a **senior software engineer** with *10+ years* of experience building scalable web applications.

> "Jane is an exceptional technical leader and mentor." — Former Manager

## SKILLS

- Expert in **TypeScript**, **React**, and **Node.js**
- Strong experience with **AWS** cloud architecture
- Passionate about **clean code** and **best practices**

---

## WORK EXPERIENCE

### Senior Engineer at Tech Corp (2020-Present)

Key achievements:

1. Designed and implemented **microservices architecture**
2. Reduced system latency by *40%*
3. Mentored team of 5 junior engineers

### Software Engineer at Startup Inc (2015-2020)

- Built MVP from scratch using **React** and **TypeScript**
- Implemented REST API with **Express** and **PostgreSQL**
```

**What you get:**
- ✅ Professional Word document in ~300ms
- ✅ Proper heading styles with borders (H1, H2)
- ✅ Bold and italic formatting
- ✅ Bulleted and numbered lists
- ✅ Block quotes formatted in italics
- ✅ Horizontal rules handled automatically
- ✅ Proper spacing between sections
- ✅ Times New Roman font (professional default)

**Supported Markdown:**
- `#` `##` `###` Headings (H1/H2 get bottom borders)
- `**bold**` and `*italic*` inline formatting
- `-` or `*` for bullet lists
- `1.` `2.` for numbered lists
- `> quote` for block quotes (rendered in italics)
- `---` horizontal rules (skipped, used for visual separation)
- Empty lines for spacing between sections

**Behind the scenes:** Uses `create_document_from_markdown` tool

---

### 🎨 Custom Styling for Markdown

**Want Helvetica instead of Times New Roman? Different font sizes?** - Easily customize the appearance!

You can override the default styles by passing a `styles` object:

```
Create a Word document at /tmp/my-resume.docx from this markdown:

# JANE SMITH
## Professional Summary
I am a senior engineer.

Use these custom styles:
- All headings should be Helvetica
- H1 should be 36pt bold without bottom border
- H2 should be 24pt bold with bottom border
- Paragraphs should be Arial 12pt
```

**Style options by element:**

- `heading1`, `heading2`, `heading3`, `heading4` - Control heading appearance
- `paragraph` - Regular paragraph text
- `bullets` - Bulleted list items
- `ordered` - Numbered list items
- `blockquote` - Block quote text (from `> quote`)

**Each element can have:**
- `fontName` - Font family (e.g., "Helvetica", "Arial", "Times New Roman")
- `fontSize` - Font size in points (e.g., 12, 14, 36)
- `bold` - Bold text (true/false)
- `italic` - Italic text (true/false)
- `color` - Text color as hex RGB (e.g., "FF0000")
- `borderBottom` - Bottom border for headings (true/false)

**Example styles object:**

```typescript
styles: {
  heading1: { fontName: 'Helvetica', fontSize: 36, bold: true, borderBottom: false },
  heading2: { fontName: 'Helvetica', fontSize: 24, bold: true, borderBottom: true },
  heading3: { fontName: 'Helvetica', fontSize: 18, bold: true },
  paragraph: { fontName: 'Arial', fontSize: 12 },
  bullets: { fontName: 'Arial', fontSize: 12 },
  ordered: { fontName: 'Arial', fontSize: 12 },
  blockquote: { fontName: 'Georgia', fontSize: 12, italic: true }
}
```

**Default styles** (used when you don't provide custom styles):
- Headings: Times New Roman, bold, H1=24pt, H2=18pt, H3/H4=14/12pt
- H1/H2: Bottom borders, H3/H4: No borders
- Paragraphs/Lists: Times New Roman, 12pt
- Blockquotes: Times New Roman, 12pt, italic

**Pro tip:** You only need to specify the elements/properties you want to change! Unspecified elements use the defaults.

---

### ⚡ Batch Mode with Structured Content

**For when you need fine-grained control** - specify exact fonts, sizes, and colors

Use this when markdown isn't flexible enough and you need precise control over formatting:

```
Create a resume at /tmp/my-resume.docx using create_document_from_content.

Make the name "JANE SMITH" in Helvetica 36pt bold.
Add a "PROFESSIONAL SUMMARY" H2 heading with a bottom border in Helvetica 14pt.
Add a paragraph about my experience in Times New Roman 12pt.
Add a "SKILLS" H2 heading with a bottom border.
Add bullet points for my skills in Times New Roman 12pt.
```

**Example structure:**

```typescript
content: [
  {
    text: 'JANE SMITH',  // defaults to paragraph type
    format: { fontName: 'Helvetica', fontSize: 36, bold: true }
  },
  { text: '' },  // empty paragraph for spacing
  {
    type: 'heading',
    text: 'PROFESSIONAL SUMMARY',
    format: { level: 2, borderBottom: true }
  },
  {
    text: 'Software engineer with 10+ years experience...',
    format: { fontName: 'Times New Roman', fontSize: 12 }
  },
  {
    type: 'bullets',
    items: ['TypeScript & React', 'Node.js & Python', 'AWS & Docker'],
    format: { fontName: 'Times New Roman', fontSize: 12 }
  }
]
```

**Content item options:**
- `type`: `'paragraph'` (default), `'heading'`, `'bullets'`, `'ordered'`
- `text`: For paragraphs and headings (use `''` for spacing)
- `items`: Array of strings for lists
- `format`: `fontName`, `fontSize`, `bold`, `italic`, `color`, `level` (headings), `borderBottom` (headings)

**Behind the scenes:** Uses `create_document_from_content` tool

---

### 📝 Using Markdown Formatting in Structured Content

**You can use markdown-style formatting even in structured mode!**

Both the pure markdown approach and structured content support inline `**bold**` and `*italic*` formatting:

```typescript
// Markdown formatting works in any text field:
{
  text: 'Led **4-engineer team** building *next-gen platform*',
  format: { fontSize: 12 }
}

// Also works in list items:
{
  type: 'bullets',
  items: [
    'Expert in **TypeScript** and **React**',
    'Passionate about *clean code* and *best practices*'
  ]
}
```

This gets automatically converted to proper Word formatting with bold and italic runs.

---

## Contributing & Local Development

### Installation

```bash
git clone <repository-url>
cd mcp-server-docx
npm install
npm run build
```

### Testing

Comprehensive test suite with 36 tests powered by **Vitest**:

```bash
npm test              # Run tests once
npm run test:watch    # Watch mode with fast HMR
npm run test:coverage # Coverage report
npm run test:ui       # Visual UI mode
```

**Test coverage:**
- Markdown parsing (headings, lists, block quotes, horizontal rules, inline formatting)
- Auto-session creation
- Paragraph, heading, and list formatting
- Batch document creation
- Error handling
- Complex multi-section documents
- Spacing between elements

**Performance:** All 36 tests complete in ~350ms

### Code Quality

```bash
npm run lint         # Run ESLint (fails on warnings)
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format code with Prettier
npm run format:check # Check formatting (CI)
npm run typecheck    # TypeScript type checking
npm run ci           # Run all checks (lint + format + test + typecheck)
```

**Standards:**
- TypeScript with strict mode
- ESLint (no warnings allowed)
- Prettier (single quotes, 2-space indent, 100 char width)
- GitHub Actions CI on all PRs

### Project Structure

```
mcp-server-docx/
├── src/
│   ├── __tests__/
│   │   ├── document-manager.test.ts  # Document management tests
│   │   └── markdown-parser.test.ts   # Markdown parsing tests
│   ├── index.ts              # MCP server implementation
│   ├── document-manager.ts   # Core document logic
│   ├── markdown-parser.ts    # Markdown to content converter
│   └── types.ts              # TypeScript type definitions
├── dist/                     # Compiled JavaScript
├── vitest.config.ts          # Test configuration
├── package.json
├── tsconfig.json
└── README.md
```

---

## Performance & Architecture

**Key Performance Metrics:**
- Single document creation: ~300ms
- Full resume (batch mode): ~300ms vs 3-5s (incremental) vs ~35s (Python)
- **100x faster** than Python implementation
- **20-30x fewer** MCP calls (1 batch call vs 20-30 incremental)

**Design Principles:**

1. **Batch Operations** - Create entire documents in a single MCP call
2. **In-Memory Storage** - Documents stored in memory until save (eliminates file I/O overhead)
3. **Auto-Session Creation** - No explicit initialization needed, start adding content immediately
4. **Smart Markdown Parsing** - Single-pass parsing with inline `**bold**`/`*italic*` support
5. **Default Styling** - Times New Roman applied automatically for professional appearance
6. **Type Safety** - Full TypeScript definitions for correctness

## Future Enhancements

- Tables and images
- Custom style definitions
- Headers, footers, and page breaks
- Search & replace functionality

## License

ISC

## Author

James Mehorter
