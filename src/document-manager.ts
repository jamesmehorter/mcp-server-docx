import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
  IRunOptions,
  IParagraphOptions,
  BorderStyle,
  AlignmentType,
  LevelFormat,
} from 'docx';
import * as fs from 'fs/promises';

interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

/**
 * Parse markdown-style formatting (**bold**, *italic*) and convert to text segments
 */
function parseMarkdownFormatting(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let currentPos = 0;

  // Regex to match **bold** or *italic* (non-greedy)
  // Matches: **text** or *text* but not *** or ****
  const regex = /(\*\*([^*]+?)\*\*)|(\*([^*]+?)\*)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add plain text before this match
    if (match.index > currentPos) {
      segments.push({
        text: text.substring(currentPos, match.index),
      });
    }

    // Add formatted text
    if (match[1]) {
      // **bold**
      segments.push({
        text: match[2],
        bold: true,
      });
    } else if (match[3]) {
      // *italic*
      segments.push({
        text: match[4],
        italic: true,
      });
    }

    currentPos = match.index + match[0].length;
  }

  // Add remaining plain text
  if (currentPos < text.length) {
    segments.push({
      text: text.substring(currentPos),
    });
  }

  // If no markdown found, return the whole text as one segment
  return segments.length > 0 ? segments : [{ text }];
}

interface DocumentSession {
  title?: string;
  author?: string;
  children: Paragraph[];
}

export interface ContentItem {
  type: 'paragraph' | 'heading' | 'bullets' | 'ordered';
  text?: string;
  items?: string[];
  format?: {
    fontName?: string;
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
    color?: string;
    level?: number;
    borderBottom?: boolean;
  };
}

export class DocumentManager {
  private sessions: Map<string, DocumentSession> = new Map();

  /**
   * Create a new document and keep it in memory
   */
  async createDocument(filename: string, title?: string, author?: string): Promise<void> {
    this.sessions.set(filename, {
      title,
      author,
      children: [],
    });
  }

  /**
   * Get document session (throws if not found)
   */
  private getSession(filename: string): DocumentSession {
    const session = this.sessions.get(filename);
    if (!session) {
      throw new Error(`No document session found for: ${filename}`);
    }
    return session;
  }

  /**
   * Get or create document session (auto-creates if not found)
   */
  private getOrCreateSession(filename: string, title?: string, author?: string): DocumentSession {
    let session = this.sessions.get(filename);
    if (!session) {
      session = { title, author, children: [] };
      this.sessions.set(filename, session);
    }
    return session;
  }

  /**
   * Build document from session
   */
  private buildDocument(session: DocumentSession): Document {
    return new Document({
      creator: session.author || 'Word MCP Server',
      title: session.title || 'Document',
      description: 'Generated via Node.js Word MCP Server',
      numbering: {
        config: [
          {
            reference: 'default-numbering',
            levels: [
              {
                level: 0,
                format: LevelFormat.DECIMAL,
                text: '%1.',
                alignment: AlignmentType.LEFT,
                style: {
                  paragraph: {
                    indent: { left: 720, hanging: 260 },
                  },
                },
              },
            ],
          },
        ],
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 864, // twips (1/20 point)
                right: 864,
                bottom: 864,
                left: 864,
              },
            },
          },
          children: session.children,
        },
      ],
    });
  }

  /**
   * Add a paragraph with formatting
   * Auto-creates session if it doesn't exist
   * Supports markdown-style formatting: **bold**, *italic*
   */
  async addParagraph(
    filename: string,
    text: string,
    format?: {
      fontName?: string;
      fontSize?: number;
      bold?: boolean;
      italic?: boolean;
      color?: string;
    }
  ): Promise<void> {
    const session = this.getOrCreateSession(filename);

    // Parse markdown formatting in text
    const segments = parseMarkdownFormatting(text);

    // Create TextRun for each segment
    const textRuns = segments.map(segment => {
      const runOptions: IRunOptions = {
        text: segment.text,
        font: format?.fontName || 'Times New Roman', // Default to Times New Roman if not specified
        size: format?.fontSize ? format.fontSize * 2 : undefined, // Convert points to half-points
        bold: format?.bold || segment.bold, // Apply markdown bold or format bold
        italics: format?.italic || segment.italic, // Apply markdown italic or format italic
        color: format?.color,
      };
      return new TextRun(runOptions);
    });

    const paragraph = new Paragraph({
      children: textRuns,
    });

    session.children.push(paragraph);
  }

  /**
   * Add a heading with formatting and optional border
   * Auto-creates session if it doesn't exist
   * Supports markdown-style formatting: **bold**, *italic*
   */
  async addHeading(
    filename: string,
    text: string,
    options?: {
      level?: number;
      fontName?: string;
      fontSize?: number;
      bold?: boolean;
      borderBottom?: boolean;
    }
  ): Promise<void> {
    const session = this.getOrCreateSession(filename);

    const level = options?.level || 1;
    const headingLevel = HeadingLevel[`HEADING_${level}` as keyof typeof HeadingLevel];

    // Parse markdown formatting in text
    const segments = parseMarkdownFormatting(text);

    // Create TextRun for each segment
    const textRuns = segments.map(segment => {
      const runOptions: IRunOptions = {
        text: segment.text,
        font: options?.fontName || 'Times New Roman',
        size: options?.fontSize ? options.fontSize * 2 : undefined,
        bold: (options?.bold ?? true) || segment.bold, // Default headings to bold
        italics: segment.italic,
      };
      return new TextRun(runOptions);
    });

    const paragraphOptions: IParagraphOptions = {
      heading: headingLevel,
      children: textRuns,
      // Add border if requested
      ...(options?.borderBottom && {
        border: {
          bottom: {
            color: '000000',
            space: 1,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
      }),
    };

    const heading = new Paragraph(paragraphOptions);

    session.children.push(heading);
  }

  /**
   * Add a bulleted list
   * Auto-creates session if it doesn't exist
   * Supports markdown-style formatting: **bold**, *italic*
   */
  async addBulletList(
    filename: string,
    items: string[],
    format?: {
      fontName?: string;
      fontSize?: number;
    }
  ): Promise<void> {
    const session = this.getOrCreateSession(filename);

    const bullets = items.map(item => {
      // Parse markdown formatting in each bullet item
      const segments = parseMarkdownFormatting(item);

      // Create TextRun for each segment
      const textRuns = segments.map(segment => {
        const runOptions: IRunOptions = {
          text: segment.text,
          font: format?.fontName || 'Times New Roman',
          size: format?.fontSize ? format.fontSize * 2 : undefined,
          bold: segment.bold,
          italics: segment.italic,
        };
        return new TextRun(runOptions);
      });

      return new Paragraph({
        children: textRuns,
        bullet: {
          level: 0,
        },
      });
    });

    session.children.push(...bullets);
  }

  /**
   * Add an ordered (numbered) list
   * Auto-creates session if it doesn't exist
   * Supports markdown-style formatting: **bold**, *italic*
   */
  async addOrderedList(
    filename: string,
    items: string[],
    format?: {
      fontName?: string;
      fontSize?: number;
    }
  ): Promise<void> {
    const session = this.getOrCreateSession(filename);

    const orderedItems = items.map(item => {
      // Parse markdown formatting in each item
      const segments = parseMarkdownFormatting(item);

      // Create TextRun for each segment
      const textRuns = segments.map(segment => {
        const runOptions: IRunOptions = {
          text: segment.text,
          font: format?.fontName || 'Times New Roman',
          size: format?.fontSize ? format.fontSize * 2 : undefined,
          bold: segment.bold,
          italics: segment.italic,
        };
        return new TextRun(runOptions);
      });

      return new Paragraph({
        children: textRuns,
        numbering: {
          reference: 'default-numbering',
          level: 0,
        },
      });
    });

    session.children.push(...orderedItems);
  }

  /**
   * Save document to disk
   */
  async saveDocument(filename: string): Promise<void> {
    const session = this.getSession(filename);
    const doc = this.buildDocument(session);

    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(filename, buffer);
  }

  /**
   * Save and close document session
   */
  async closeDocument(filename: string): Promise<void> {
    await this.saveDocument(filename);
    this.sessions.delete(filename);
  }

  /**
   * Close session without saving
   */
  discardDocument(filename: string): void {
    this.sessions.delete(filename);
  }

  /**
   * Create a complete document from content array in a single operation
   * This is much faster than multiple individual calls (1 call vs 20-30)
   */
  async createDocumentFromContent(
    filename: string,
    content: ContentItem[],
    title?: string,
    author?: string
  ): Promise<void> {
    // Create session
    await this.createDocument(filename, title, author);

    // Process all content items
    for (const item of content) {
      switch (item.type) {
        case 'paragraph':
          if (item.text) {
            await this.addParagraph(filename, item.text, {
              fontName: item.format?.fontName,
              fontSize: item.format?.fontSize,
              bold: item.format?.bold,
              italic: item.format?.italic,
              color: item.format?.color,
            });
          }
          break;

        case 'heading':
          if (item.text) {
            await this.addHeading(filename, item.text, {
              level: item.format?.level,
              fontName: item.format?.fontName,
              fontSize: item.format?.fontSize,
              bold: item.format?.bold,
              borderBottom: item.format?.borderBottom,
            });
          }
          break;

        case 'bullets':
          if (item.items && item.items.length > 0) {
            await this.addBulletList(filename, item.items, {
              fontName: item.format?.fontName,
              fontSize: item.format?.fontSize,
            });
          }
          break;

        case 'ordered':
          if (item.items && item.items.length > 0) {
            await this.addOrderedList(filename, item.items, {
              fontName: item.format?.fontName,
              fontSize: item.format?.fontSize,
            });
          }
          break;
      }
    }

    // Save document
    await this.saveDocument(filename);
  }

  /**
   * Create a complete document from markdown text in a single operation
   * This is the most intuitive way to create documents - just write natural markdown!
   *
   * Supports:
   * - Headings: # H1, ## H2, ### H3, etc.
   * - Paragraphs: regular text
   * - Unordered lists: - item or * item
   * - Ordered lists: 1. item, 2. item, etc.
   * - Inline formatting: **bold**, *italic*
   *
   * Example:
   * ```
   * ## Summary
   *
   * I am a **senior engineer** with *extensive experience*.
   *
   * - First achievement
   * - Second achievement
   *
   * 1. First step
   * 2. Second step
   * ```
   */
  async createDocumentFromMarkdown(
    filename: string,
    markdown: string,
    title?: string,
    author?: string
  ): Promise<void> {
    // Lazy import to avoid circular dependency issues
    const { parseMarkdown } = await import('./markdown-parser.js');

    // Parse markdown into content items
    const content = parseMarkdown(markdown);

    // Use existing batch operation
    await this.createDocumentFromContent(filename, content, title, author);
  }
}
