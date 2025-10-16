import { DocumentManager, ContentItem } from '../document-manager.js';
import * as fs from 'fs/promises';

describe('DocumentManager', () => {
  let docManager: DocumentManager;
  const testFile = '/tmp/test-doc-manager.docx';

  beforeEach(() => {
    docManager = new DocumentManager();
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.unlink(testFile);
    } catch (_error) {
      // Ignore if file doesn't exist
    }
  });

  describe('createDocument', () => {
    test('should create a document session', async () => {
      await docManager.createDocument(testFile, 'Test Title', 'Test Author');

      // Should not throw when adding content
      await expect(docManager.addParagraph(testFile, 'Test paragraph')).resolves.not.toThrow();
    });

    test('should create document without title and author', async () => {
      await docManager.createDocument(testFile);

      await expect(docManager.addParagraph(testFile, 'Test paragraph')).resolves.not.toThrow();
    });
  });

  describe('addParagraph', () => {
    test('should auto-create session if not exists', async () => {
      // Should not throw even without calling createDocument first
      await expect(docManager.addParagraph(testFile, 'Test paragraph')).resolves.not.toThrow();
    });

    test('should add paragraph with formatting', async () => {
      await docManager.addParagraph(testFile, 'Formatted text', {
        fontName: 'Helvetica',
        fontSize: 14,
        bold: true,
        italic: true,
        color: 'FF0000',
      });

      // Should be able to save without errors
      await expect(docManager.saveDocument(testFile)).resolves.not.toThrow();

      // Verify file was created
      const stats = await fs.stat(testFile);
      expect(stats.size).toBeGreaterThan(0);
    });

    test('should add multiple paragraphs', async () => {
      await docManager.addParagraph(testFile, 'First paragraph');
      await docManager.addParagraph(testFile, 'Second paragraph');
      await docManager.addParagraph(testFile, 'Third paragraph');

      await docManager.saveDocument(testFile);

      const stats = await fs.stat(testFile);
      expect(stats.size).toBeGreaterThan(0);
    });
  });

  describe('addHeading', () => {
    test('should auto-create session if not exists', async () => {
      await expect(docManager.addHeading(testFile, 'Test Heading')).resolves.not.toThrow();
    });

    test('should add heading with default level', async () => {
      await docManager.addHeading(testFile, 'Main Heading');
      await docManager.saveDocument(testFile);

      const stats = await fs.stat(testFile);
      expect(stats.size).toBeGreaterThan(0);
    });

    test('should add heading with custom level and formatting', async () => {
      await docManager.addHeading(testFile, 'Custom Heading', {
        level: 2,
        fontName: 'Helvetica',
        fontSize: 16,
        bold: true,
        borderBottom: true,
      });

      await docManager.saveDocument(testFile);

      const stats = await fs.stat(testFile);
      expect(stats.size).toBeGreaterThan(0);
    });

    test('should add multiple headings with different levels', async () => {
      await docManager.addHeading(testFile, 'Level 1', { level: 1 });
      await docManager.addHeading(testFile, 'Level 2', { level: 2 });
      await docManager.addHeading(testFile, 'Level 3', { level: 3 });

      await docManager.saveDocument(testFile);

      const stats = await fs.stat(testFile);
      expect(stats.size).toBeGreaterThan(0);
    });
  });

  describe('addBulletList', () => {
    test('should auto-create session if not exists', async () => {
      await expect(docManager.addBulletList(testFile, ['Item 1', 'Item 2'])).resolves.not.toThrow();
    });

    test('should add bullet list with items', async () => {
      await docManager.addBulletList(testFile, ['First item', 'Second item', 'Third item']);

      await docManager.saveDocument(testFile);

      const stats = await fs.stat(testFile);
      expect(stats.size).toBeGreaterThan(0);
    });

    test('should add bullet list with formatting', async () => {
      await docManager.addBulletList(testFile, ['Formatted item 1', 'Formatted item 2'], {
        fontName: 'Times New Roman',
        fontSize: 12,
      });

      await docManager.saveDocument(testFile);

      const stats = await fs.stat(testFile);
      expect(stats.size).toBeGreaterThan(0);
    });
  });

  describe('saveDocument', () => {
    test('should save document to disk', async () => {
      await docManager.createDocument(testFile, 'Test Document');
      await docManager.addParagraph(testFile, 'Test content');
      await docManager.saveDocument(testFile);

      // Verify file exists and has content
      const stats = await fs.stat(testFile);
      expect(stats.size).toBeGreaterThan(0);
    });

    test('should throw error if session does not exist', async () => {
      await expect(docManager.saveDocument('/tmp/nonexistent.docx')).rejects.toThrow(
        'No document session found'
      );
    });
  });

  describe('closeDocument', () => {
    test('should save and close document session', async () => {
      await docManager.createDocument(testFile);
      await docManager.addParagraph(testFile, 'Test content');
      await docManager.closeDocument(testFile);

      // Verify file exists
      const stats = await fs.stat(testFile);
      expect(stats.size).toBeGreaterThan(0);

      // Should throw error if trying to add content after closing
      await expect(docManager.saveDocument(testFile)).rejects.toThrow('No document session found');
    });
  });

  describe('discardDocument', () => {
    test('should discard document without saving', async () => {
      await docManager.createDocument(testFile);
      await docManager.addParagraph(testFile, 'Test content');
      docManager.discardDocument(testFile);

      // File should not exist
      await expect(fs.stat(testFile)).rejects.toThrow();

      // Session should be gone
      await expect(docManager.saveDocument(testFile)).rejects.toThrow('No document session found');
    });
  });

  describe('createDocumentFromContent', () => {
    test('should create document from content array in single call', async () => {
      const content: ContentItem[] = [
        {
          type: 'paragraph',
          text: 'JOHN DOE',
          format: { fontName: 'Helvetica', fontSize: 36, bold: true },
        },
        {
          type: 'heading',
          text: 'PROFESSIONAL SUMMARY',
          format: { level: 2, borderBottom: true },
        },
        {
          type: 'paragraph',
          text: 'Software engineer with 10+ years experience.',
        },
        {
          type: 'bullets',
          items: ['Led team of 4 engineers', 'Built scalable systems', 'Optimized performance'],
          format: { fontName: 'Times New Roman', fontSize: 14 },
        },
      ];

      await docManager.createDocumentFromContent(testFile, content, 'John Doe Resume', 'John Doe');

      // Verify file was created and saved
      const stats = await fs.stat(testFile);
      expect(stats.size).toBeGreaterThan(0);
    });

    test('should handle empty content array', async () => {
      await docManager.createDocumentFromContent(testFile, []);

      const stats = await fs.stat(testFile);
      expect(stats.size).toBeGreaterThan(0);
    });

    test('should handle mixed content types', async () => {
      const content: ContentItem[] = [
        { type: 'heading', text: 'Section 1', format: { level: 1 } },
        { type: 'paragraph', text: 'Paragraph 1' },
        { type: 'paragraph', text: 'Paragraph 2' },
        { type: 'bullets', items: ['Item 1', 'Item 2'] },
        { type: 'heading', text: 'Section 2', format: { level: 2 } },
        { type: 'paragraph', text: 'Paragraph 3' },
      ];

      await docManager.createDocumentFromContent(testFile, content);

      const stats = await fs.stat(testFile);
      expect(stats.size).toBeGreaterThan(0);
    });

    test('should skip items with missing required fields', async () => {
      const content: ContentItem[] = [
        { type: 'paragraph', text: 'Valid paragraph' },
        { type: 'paragraph' }, // Missing text - should skip
        { type: 'heading' }, // Missing text - should skip
        { type: 'bullets', items: [] }, // Empty items - should skip
        { type: 'bullets', items: ['Valid item'] },
      ];

      await expect(docManager.createDocumentFromContent(testFile, content)).resolves.not.toThrow();

      const stats = await fs.stat(testFile);
      expect(stats.size).toBeGreaterThan(0);
    });

    test('should default to paragraph type when type is not specified', async () => {
      const content = [
        { text: 'First paragraph' }, // No type - should default to paragraph
        { type: 'heading' as const, text: 'Heading', format: { level: 2 } },
        { text: 'Second paragraph' }, // No type - should default to paragraph
        { text: '' }, // Empty paragraph for spacing
        { type: 'bullets' as const, items: ['Bullet 1'] },
        { text: 'Final paragraph' }, // No type - should default to paragraph
      ];

      await docManager.createDocumentFromContent(testFile, content);

      const stats = await fs.stat(testFile);
      expect(stats.size).toBeGreaterThan(0);
    });
  });

  describe('Complex document creation', () => {
    test('should create a complete resume-style document', async () => {
      // Title
      await docManager.createDocument(testFile, 'Resume', 'Jane Smith');

      // Name
      await docManager.addParagraph(testFile, 'JANE SMITH', {
        fontName: 'Helvetica',
        fontSize: 36,
        bold: true,
      });

      // Contact info
      await docManager.addParagraph(testFile, 'jane@example.com | (555) 123-4567', {
        fontName: 'Helvetica',
        fontSize: 12,
      });

      // Summary heading
      await docManager.addHeading(testFile, 'PROFESSIONAL SUMMARY', {
        level: 2,
        fontName: 'Helvetica',
        fontSize: 14,
        borderBottom: true,
      });

      // Summary paragraph
      await docManager.addParagraph(
        testFile,
        'Experienced software engineer specializing in full-stack development with expertise in TypeScript, React, and Node.js.',
        { fontName: 'Times New Roman', fontSize: 14 }
      );

      // Experience heading
      await docManager.addHeading(testFile, 'EXPERIENCE', {
        level: 2,
        fontName: 'Helvetica',
        fontSize: 14,
        borderBottom: true,
      });

      // Job title
      await docManager.addParagraph(testFile, 'Senior Software Engineer - Tech Corp', {
        fontName: 'Times New Roman',
        fontSize: 14,
        bold: true,
      });

      // Achievements
      await docManager.addBulletList(
        testFile,
        [
          'Led development of microservices architecture',
          'Improved system performance by 40%',
          'Mentored junior developers',
        ],
        {
          fontName: 'Times New Roman',
          fontSize: 14,
        }
      );

      await docManager.saveDocument(testFile);

      const stats = await fs.stat(testFile);
      expect(stats.size).toBeGreaterThan(1000); // Should be substantial
    });
  });

  describe('createDocumentFromMarkdown with custom styles', () => {
    test('should apply default styles when no custom styles provided', async () => {
      const markdown = `# Heading 1
## Heading 2

This is a paragraph.

- Bullet item 1
- Bullet item 2`;

      await docManager.createDocumentFromMarkdown(testFile, markdown);
      await docManager.saveDocument(testFile);

      const stats = await fs.stat(testFile);
      expect(stats.size).toBeGreaterThan(0);
    });

    test('should apply custom styles to heading elements', async () => {
      const markdown = `# Main Title
## Subtitle

Paragraph text here.`;

      const customStyles = {
        heading1: {
          fontName: 'Helvetica',
          fontSize: 36,
          bold: true,
          borderBottom: false,
        },
        heading2: {
          fontName: 'Helvetica',
          fontSize: 24,
          bold: true,
          borderBottom: true,
        },
      };

      await docManager.createDocumentFromMarkdown(
        testFile,
        markdown,
        'Test Doc',
        'Test Author',
        customStyles
      );
      await docManager.saveDocument(testFile);

      const stats = await fs.stat(testFile);
      expect(stats.size).toBeGreaterThan(0);
    });

    test('should apply custom styles to paragraph and list elements', async () => {
      const markdown = `Regular paragraph.

- First item
- Second item

1. Numbered item
2. Another numbered item`;

      const customStyles = {
        paragraph: {
          fontName: 'Arial',
          fontSize: 14,
        },
        bullets: {
          fontName: 'Arial',
          fontSize: 12,
        },
        ordered: {
          fontName: 'Arial',
          fontSize: 12,
        },
      };

      await docManager.createDocumentFromMarkdown(
        testFile,
        markdown,
        undefined,
        undefined,
        customStyles
      );
      await docManager.saveDocument(testFile);

      const stats = await fs.stat(testFile);
      expect(stats.size).toBeGreaterThan(0);
    });

    test('should apply custom styles to blockquotes', async () => {
      const markdown = `> This is a blockquote
> It spans multiple lines

Regular paragraph after quote.`;

      const customStyles = {
        blockquote: {
          fontName: 'Georgia',
          fontSize: 13,
          italic: true,
          color: '555555',
        },
      };

      await docManager.createDocumentFromMarkdown(
        testFile,
        markdown,
        undefined,
        undefined,
        customStyles
      );
      await docManager.saveDocument(testFile);

      const stats = await fs.stat(testFile);
      expect(stats.size).toBeGreaterThan(0);
    });

    test('should merge custom styles with defaults', async () => {
      const markdown = `# Title
## Subtitle
### H3 Not Customized

Paragraph text.`;

      // Only customize heading1 and heading2, heading3 should use defaults
      const customStyles = {
        heading1: {
          fontName: 'Helvetica',
          fontSize: 48,
        },
        heading2: {
          fontName: 'Helvetica',
          fontSize: 32,
        },
      };

      await docManager.createDocumentFromMarkdown(
        testFile,
        markdown,
        undefined,
        undefined,
        customStyles
      );
      await docManager.saveDocument(testFile);

      const stats = await fs.stat(testFile);
      expect(stats.size).toBeGreaterThan(0);
    });

    test('should handle all markdown elements with unified styling', async () => {
      const markdown = `# Main Title

**Company Name** | Location

---

## Professional Summary

I am a **senior engineer** with *10+ years* experience.

> "Outstanding team player" - Manager

## Skills

- TypeScript
- React
- Node.js

## Experience

### Senior Engineer

Key achievements:

1. Built microservices
2. Reduced latency by 40%
3. Mentored 5 engineers`;

      const customStyles = {
        heading1: {
          fontName: 'Helvetica',
          fontSize: 36,
          bold: true,
        },
        heading2: {
          fontName: 'Helvetica',
          fontSize: 24,
          bold: true,
          borderBottom: true,
        },
        heading3: {
          fontName: 'Helvetica',
          fontSize: 18,
          bold: true,
        },
        paragraph: {
          fontName: 'Times New Roman',
          fontSize: 12,
        },
        bullets: {
          fontName: 'Times New Roman',
          fontSize: 12,
        },
        ordered: {
          fontName: 'Times New Roman',
          fontSize: 12,
        },
        blockquote: {
          fontName: 'Georgia',
          fontSize: 12,
          italic: true,
        },
      };

      await docManager.createDocumentFromMarkdown(
        testFile,
        markdown,
        'Custom Styled Resume',
        'John Doe',
        customStyles
      );
      await docManager.saveDocument(testFile);

      const stats = await fs.stat(testFile);
      expect(stats.size).toBeGreaterThan(1000); // Should be substantial document
    });
  });
});
