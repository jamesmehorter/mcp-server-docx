# High-Performance Word Document MCP Server

A fast, TypeScript-based MCP server for Word document generation that outperforms Python implementations by 10x.

**🚀 Now with Markdown-First Workflow** - Just write natural markdown and get professional Word documents!

## Quick Example

```markdown
Create a Word document at /tmp/resume.docx from this markdown:

## Professional Summary

I am a **senior engineer** with _10+ years_ of experience.

## Skills

- TypeScript & React
- Node.js & Python
- AWS & Docker

## Experience

### Senior Engineer at Tech Corp

Key achievements:

1. Built microservices architecture
2. Reduced latency by 40%
3. Mentored team of 5 engineers
```

**Result:** Professional Word document with proper formatting in ~300ms!

## Performance

- **Target:** <300ms per MCP call (vs 1-2s in Python)
- **Full resume generation:** <5 seconds total (vs 35s in Python)
- **Memory efficient:** Documents kept in memory between calls to avoid repeated disk I/O

## Features

- **🎯 Markdown-First:** Write natural markdown → Get formatted Word documents
- **📝 Full Markdown Support:** Headings (`# ## ###`), lists (`-` or `1.`), inline formatting (`**bold**`, `*italic*`)
- **⚡ Batch Operation:** Create complete documents in a single MCP call (1 call vs 20-30)
- **🤖 Auto-Session Creation:** No need to explicitly create documents - sessions auto-create when adding content
- **🎨 Smart Defaults:** Automatically applies Times New Roman font when not specified
- Create Word documents with custom metadata (title, author)
- Add formatted paragraphs (font, size, bold, italic, color)
- Add headings with optional borders (levels 1-9)
- Add bulleted and numbered lists
- In-memory document management for fast operations
- Save documents only when needed
- Comprehensive test suite with 32 passing tests

## Installation

```bash
npm install
npm run build
```

## Testing

Comprehensive test suite with 32 tests powered by **Vitest** (fast, modern, ESM-native):

```bash
npm test              # Run tests once
npm run test:watch    # Watch mode (fast HMR)
npm run test:coverage # Coverage report
npm run test:ui       # Visual UI mode
```

The test suite validates:

- Markdown parsing (headings, lists, inline formatting)
- Auto-session creation
- Paragraph, heading, and list formatting (bullets and numbered)
- Batch document creation
- Error handling
- Complex multi-section documents

**Performance:** All 32 tests complete in ~400ms (2x faster than Jest)

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

- `create_document_from_markdown` 🚀 **MOST RECOMMENDED - Write natural markdown!**
- `create_document_from_content` ⚡ **RECOMMENDED - Single structured call**
- `create_document`
- `add_paragraph`
- `add_heading`
- `add_bullet_list`
- `save_document`

## Available Tools

### create_document_from_markdown 🚀 MOST RECOMMENDED

**The most intuitive way to create documents - just write natural markdown!**

Create a complete Word document from markdown text in a single MCP call. This is the simplest and most intuitive interface - no need to specify types, formats, or structure. Just write markdown like you normally would.

**Parameters:**

- `filename` (required): Path to save the document
- `markdown` (required): Markdown text content
- `title` (optional): Document title
- `author` (optional): Document author

**Supported Markdown:**

- **Headings:** `#` H1, `##` H2, `###` H3, etc. (H1 and H2 get bottom borders)
- **Paragraphs:** Regular text (becomes formatted paragraphs)
- **Unordered lists:** Lines starting with `-` or `*`
- **Ordered lists:** Lines starting with `1.`, `2.`, etc.
- **Inline formatting:** `**bold**` and `*italic*` in any text
- **Default font:** Times New Roman (applied automatically)

**Example:**

```typescript
create_document_from_markdown({
  filename: '/tmp/resume.docx',
  title: 'John Doe Resume',
  author: 'John Doe',
  markdown: `
# JOHN DOE
john@example.com | (555) 123-4567

## Professional Summary

I am a **senior fullstack engineer** with *10+ years* of experience building scalable web applications.

## Skills

- Expert in **TypeScript**, **React**, and **Node.js**
- Strong experience with **AWS** cloud architecture
- Passionate about **clean code** and **best practices**

## Work Experience

### Senior Engineer at Tech Corp (2020-Present)

Key achievements:

1. Designed and implemented **microservices architecture**
2. Reduced system latency by *40%*
3. Mentored team of 5 junior engineers

### Software Engineer at Startup Inc (2015-2020)

- Built MVP from scratch using **React** and **TypeScript**
- Implemented REST API with **Express** and **PostgreSQL**
- Deployed to **AWS** with CI/CD pipeline

## Education

**Bachelor of Science** in Computer Science
*University of Technology*, 2015
`,
});
```

**Result:** Professional Word document created and saved in ~300ms!

---

### create_document_from_content ⚡ RECOMMENDED (Structured Approach)

**For when you need fine-grained control over formatting**

Create a complete Word document from a structured content array in a single MCP call. This gives you more control over font names, sizes, and colors compared to the markdown approach.

**Parameters:**

- `filename` (required): Path to save the document
- `content` (required): Array of content items
- `title` (optional): Document title
- `author` (optional): Document author

**Content Item Structure:**

```typescript
{
  type: 'paragraph' | 'heading' | 'bullets' | 'ordered',
  text?: string,              // For paragraph and heading
  items?: string[],           // For bullets and ordered lists
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

### Markdown Mode 🚀 MOST RECOMMENDED - Natural Markdown

Tell Claude to use the markdown tool with natural markdown syntax:

```
Create a Word document at /tmp/my-resume.docx from this markdown:

# JANE SMITH
jane@example.com | (555) 123-4567

## PROFESSIONAL SUMMARY

I am a **software engineer** with *5+ years* of experience building web applications.

## SKILLS

- JavaScript/TypeScript
- React & Node.js
- AWS & Docker

## EXPERIENCE

### Senior Engineer at Acme Corp

Key achievements:

1. Built microservices platform
2. Reduced deployment time by 50%
3. Mentored junior engineers
```

**Result:** Professional document created in ~300ms (1 MCP call, zero configuration!)

**Why this is best:**

- ✅ No need to specify types ("paragraph", "heading", "bullets")
- ✅ No need to configure formatting (font, size, bold)
- ✅ Just write natural markdown like you already do
- ✅ Gets proper Word formatting automatically

---

### Structured Mode ⚡ RECOMMENDED - Fine-Grained Control

For when you need specific fonts, sizes, or colors:

```
Create a resume for me at /tmp/my-resume.docx using the create_document_from_content tool.

Include:
- My name "JANE SMITH" in large bold Helvetica (36pt)
- A "PROFESSIONAL SUMMARY" heading with a bottom border
- A paragraph about my experience as a software engineer
- An "EXPERIENCE" heading with a bottom border
- Bullet points for my key achievements
```

**Result:** Document created in ~300ms (1 MCP call, full format control)

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

## Markdown Formatting Support

All text content (paragraphs, headings, and bullet lists) supports markdown-style formatting that gets automatically converted to proper Word formatting:

- `**bold text**` → **bold text** in Word
- `*italic text*` → _italic text_ in Word

**Example:**

```typescript
add_paragraph({
  filename: '/tmp/resume.docx',
  text: 'Led **4-engineer team** building *next-gen platform*',
  font_size: 14,
});
```

This creates a paragraph where "4-engineer team" is bold and "next-gen platform" is italic.

**How it works:**

1. The server parses text for `**text**` and `*text*` patterns
2. Splits text into segments with appropriate formatting flags
3. Creates multiple TextRun objects in Word with proper bold/italic styling
4. Combines with any explicit formatting parameters you provide

**Benefits:**

- Claude can use natural markdown syntax in text content
- No need to create separate paragraphs for differently-formatted text
- Works seamlessly with explicit `bold` and `italic` format parameters

## Default Font Styling

When no `fontName` is specified, the server automatically applies **Times New Roman** as the default font. This ensures professional-looking documents even when font family isn't explicitly provided.

**Example:**

```typescript
// This text will use Times New Roman by default
add_paragraph({
  filename: '/tmp/resume.docx',
  text: 'Software engineer with 10+ years experience',
  font_size: 14,
});
```

You can always override the default by specifying a `fontName`:

```typescript
add_paragraph({
  filename: '/tmp/resume.docx',
  text: 'Software engineer with 10+ years experience',
  font_name: 'Arial',
  font_size: 14,
});
```

## Architecture

### Key Design Decisions

1. **Batch Operations**: The `create_document_from_content` method allows creating entire documents in a single MCP call, reducing overhead from 20-30 calls to just 1. This is the primary performance optimization.

2. **Auto-Session Creation**: Methods automatically create document sessions if they don't exist. This reduces friction and allows Claude to start adding content immediately without explicit initialization.

3. **In-Memory Storage**: Documents are kept in memory as arrays of paragraphs until explicitly saved. This eliminates repeated file I/O and makes the server extremely fast.

4. **Document Rebuilding**: The docx library requires all content to be known at document creation time. We store content elements and rebuild the document when saving.

5. **Markdown Parsing**: Built-in support for markdown-style formatting (`**bold**`, `*italic*`) allows Claude to use natural syntax without requiring structured formatting parameters. Text is parsed and split into multiple TextRun objects with proper Word formatting.

6. **Smart Defaults**: Automatically applies Times New Roman font when not specified, ensuring professional-looking documents even when explicit font parameters aren't provided.

7. **Type Safety**: Full TypeScript type definitions ensure correctness and great developer experience.

8. **Performance First**: Every operation is optimized for speed:
   - No unnecessary file operations
   - Minimal object allocations
   - Efficient paragraph array management
   - Single-pass markdown parsing

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
