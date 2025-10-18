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
  ExternalHyperlink,
} from 'docx';
import * as fs from 'fs/promises';
import { MarkdownStyles } from './types.js';

/**
 * Default styles for markdown elements
 * These provide professional, Word-like defaults for markdown-to-Word conversion
 */
export const DEFAULT_MARKDOWN_STYLES: MarkdownStyles = {
  heading1: {
    fontName: 'Times New Roman',
    fontSize: 24,
    bold: true,
    borderBottom: true,
  },
  heading2: {
    fontName: 'Times New Roman',
    fontSize: 18,
    bold: true,
    borderBottom: true,
  },
  heading3: {
    fontName: 'Times New Roman',
    fontSize: 14,
    bold: true,
    borderBottom: false,
  },
  heading4: {
    fontName: 'Times New Roman',
    fontSize: 12,
    bold: true,
    borderBottom: false,
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
    fontName: 'Times New Roman',
    fontSize: 12,
    italic: true,
  },
};

interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  link?: string; // URL for hyperlinks
}

/**
 * Parse markdown-style formatting (**bold**, *italic*, [text](url)) and convert to text segments
 */
function parseMarkdownFormatting(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let currentPos = 0;

  // Regex to match [text](url), **bold**, or *italic* (non-greedy)
  // Order matters: match links first, then bold, then italic
  const regex = /(\[([^\]]+?)\]\(([^)]+?)\))|(\*\*([^*]+?)\*\*)|(\*([^*]+?)\*)/g;
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
      // [text](url) - link
      segments.push({
        text: match[2], // link text
        link: match[3], // url
      });
    } else if (match[4]) {
      // **bold**
      segments.push({
        text: match[5],
        bold: true,
      });
    } else if (match[6]) {
      // *italic*
      segments.push({
        text: match[7],
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
  type?: 'paragraph' | 'heading' | 'bullets' | 'ordered'; // Defaults to 'paragraph'
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
   * Supports markdown-style formatting: **bold**, *italic*, [text](url)
   * Empty text creates an empty paragraph for spacing
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
      borderBottom?: boolean;
    }
  ): Promise<void> {
    const session = this.getOrCreateSession(filename);

    // Handle horizontal rule (---, ***, ___) - convert to border line
    if (/^[-*_]{3,}$/.test(text.trim())) {
      const paragraphOptions: IParagraphOptions = {
        children: [new TextRun({ text: '' })],
        spacing: {
          after: 200, // Add spacing after horizontal rule
        },
        border: {
          bottom: {
            color: '000000',
            space: 1,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
      };
      const paragraph = new Paragraph(paragraphOptions);
      session.children.push(paragraph);
      return;
    }

    // Handle empty text - create empty paragraph for spacing
    if (!text || text.trim() === '') {
      const paragraphOptions: IParagraphOptions = {
        children: [new TextRun({ text: '' })], // Add empty TextRun for proper rendering
        spacing: {
          after: 200, // Add spacing after empty paragraph (10pt)
        },
        // Add border if requested (useful for divider lines)
        ...(format?.borderBottom && {
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
      const paragraph = new Paragraph(paragraphOptions);
      session.children.push(paragraph);
      return;
    }

    // Parse markdown formatting in text
    const segments = parseMarkdownFormatting(text);

    // Create TextRun or ExternalHyperlink for each segment
    const children = segments.map(segment => {
      const runOptions: IRunOptions = {
        text: segment.text,
        font: format?.fontName || 'Times New Roman', // Default to Times New Roman if not specified
        size: format?.fontSize ? format.fontSize * 2 : undefined, // Convert points to half-points
        bold: format?.bold || segment.bold, // Apply markdown bold or format bold
        italics: format?.italic || segment.italic, // Apply markdown italic or format italic
        color: format?.color,
      };

      // If segment has a link, wrap in ExternalHyperlink
      if (segment.link) {
        return new ExternalHyperlink({
          children: [new TextRun(runOptions)],
          link: segment.link,
        });
      }

      return new TextRun(runOptions);
    });

    const paragraph = new Paragraph({
      children,
    });

    session.children.push(paragraph);
  }

  /**
   * Add a heading with formatting and optional border
   * Auto-creates session if it doesn't exist
   * Supports markdown-style formatting: **bold**, *italic*, [text](url)
   */
  async addHeading(
    filename: string,
    text: string,
    options?: {
      level?: number;
      fontName?: string;
      fontSize?: number;
      bold?: boolean;
      color?: string;
      borderBottom?: boolean;
    }
  ): Promise<void> {
    const session = this.getOrCreateSession(filename);

    const level = options?.level || 1;
    const headingLevel = HeadingLevel[`HEADING_${level}` as keyof typeof HeadingLevel];

    // Parse markdown formatting in text
    const segments = parseMarkdownFormatting(text);

    // Create TextRun or ExternalHyperlink for each segment
    const children = segments.map(segment => {
      const runOptions: IRunOptions = {
        text: segment.text,
        font: options?.fontName || 'Times New Roman',
        size: options?.fontSize ? options.fontSize * 2 : undefined,
        bold: (options?.bold ?? true) || segment.bold, // Default headings to bold
        italics: segment.italic,
        color: options?.color,
      };

      // If segment has a link, wrap in ExternalHyperlink
      if (segment.link) {
        return new ExternalHyperlink({
          children: [new TextRun(runOptions)],
          link: segment.link,
        });
      }

      return new TextRun(runOptions);
    });

    const paragraphOptions: IParagraphOptions = {
      // Only use heading style if no custom color is specified
      // Word's built-in heading styles override inline colors, so we skip the heading
      // property when custom formatting is needed
      ...(options?.color ? {} : { heading: headingLevel }),
      children,
      // Add spacing to make it look like a heading even without the style
      ...(options?.color && {
        spacing: {
          before: 240, // 12pt before
          after: 120, // 6pt after
        },
      }),
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
   * Supports markdown-style formatting: **bold**, *italic*, [text](url)
   */
  async addBulletList(
    filename: string,
    items: string[],
    format?: {
      fontName?: string;
      fontSize?: number;
      color?: string;
    }
  ): Promise<void> {
    const session = this.getOrCreateSession(filename);

    const bullets = items.map(item => {
      // Parse markdown formatting in each bullet item
      const segments = parseMarkdownFormatting(item);

      // Create TextRun or ExternalHyperlink for each segment
      const children = segments.map(segment => {
        const runOptions: IRunOptions = {
          text: segment.text,
          font: format?.fontName || 'Times New Roman',
          size: format?.fontSize ? format.fontSize * 2 : undefined,
          bold: segment.bold,
          italics: segment.italic,
          color: format?.color,
        };

        // If segment has a link, wrap in ExternalHyperlink
        if (segment.link) {
          return new ExternalHyperlink({
            children: [new TextRun(runOptions)],
            link: segment.link,
          });
        }

        return new TextRun(runOptions);
      });

      return new Paragraph({
        children,
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
   * Supports markdown-style formatting: **bold**, *italic*, [text](url)
   */
  async addOrderedList(
    filename: string,
    items: string[],
    format?: {
      fontName?: string;
      fontSize?: number;
      color?: string;
    }
  ): Promise<void> {
    const session = this.getOrCreateSession(filename);

    const orderedItems = items.map(item => {
      // Parse markdown formatting in each item
      const segments = parseMarkdownFormatting(item);

      // Create TextRun or ExternalHyperlink for each segment
      const children = segments.map(segment => {
        const runOptions: IRunOptions = {
          text: segment.text,
          font: format?.fontName || 'Times New Roman',
          size: format?.fontSize ? format.fontSize * 2 : undefined,
          bold: segment.bold,
          italics: segment.italic,
          color: format?.color,
        };

        // If segment has a link, wrap in ExternalHyperlink
        if (segment.link) {
          return new ExternalHyperlink({
            children: [new TextRun(runOptions)],
            link: segment.link,
          });
        }

        return new TextRun(runOptions);
      });

      return new Paragraph({
        children,
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
      // Default to 'paragraph' if type not specified
      const itemType = item.type || 'paragraph';

      switch (itemType) {
        case 'paragraph':
          if (item.text !== undefined) {
            await this.addParagraph(filename, item.text, {
              fontName: item.format?.fontName,
              fontSize: item.format?.fontSize,
              bold: item.format?.bold,
              italic: item.format?.italic,
              color: item.format?.color,
              borderBottom: item.format?.borderBottom,
            });
          }
          break;

        case 'heading':
          if (item.text !== undefined && item.text !== '') {
            await this.addHeading(filename, item.text, {
              level: item.format?.level,
              fontName: item.format?.fontName,
              fontSize: item.format?.fontSize,
              bold: item.format?.bold,
              color: item.format?.color,
              borderBottom: item.format?.borderBottom,
            });
          }
          break;

        case 'bullets':
          if (item.items && item.items.length > 0) {
            await this.addBulletList(filename, item.items, {
              fontName: item.format?.fontName,
              fontSize: item.format?.fontSize,
              color: item.format?.color,
            });
          }
          break;

        case 'ordered':
          if (item.items && item.items.length > 0) {
            await this.addOrderedList(filename, item.items, {
              fontName: item.format?.fontName,
              fontSize: item.format?.fontSize,
              color: item.format?.color,
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
  /**
   * Create a Word document from markdown with optional custom styles
   */
  async createDocumentFromMarkdown(
    filename: string,
    markdown: string,
    title?: string,
    author?: string,
    styles?: Partial<MarkdownStyles>
  ): Promise<void> {
    // Lazy import to avoid circular dependency issues
    const { parseMarkdown } = await import('./markdown-parser.js');

    // Parse markdown into content items
    const content = parseMarkdown(markdown);

    // Merge user styles with defaults
    const mergedStyles: MarkdownStyles = {
      ...DEFAULT_MARKDOWN_STYLES,
      ...styles,
    };

    // Apply styles to content items
    const styledContent = this.applyStylesToContent(content, mergedStyles);

    // Use existing batch operation
    await this.createDocumentFromContent(filename, styledContent, title, author);
  }

  /**
   * Apply style configuration to parsed markdown content
   */
  private applyStylesToContent(content: ContentItem[], styles: MarkdownStyles): ContentItem[] {
    return content.map(item => {
      const type = item.type || 'paragraph';
      let elementStyle;

      // Determine which style to apply based on content type
      switch (type) {
        case 'heading': {
          // Map heading level to style
          const level = item.format?.level || 1;
          if (level === 1) elementStyle = styles.heading1;
          else if (level === 2) elementStyle = styles.heading2;
          else if (level === 3) elementStyle = styles.heading3;
          else if (level === 4) elementStyle = styles.heading4;
          break;
        }
        case 'paragraph':
          // Check if this is a blockquote (italic paragraph from markdown)
          if (item.format?.italic) {
            elementStyle = styles.blockquote;
          } else {
            elementStyle = styles.paragraph;
          }
          break;
        case 'bullets':
          elementStyle = styles.bullets;
          break;
        case 'ordered':
          elementStyle = styles.ordered;
          break;
      }

      // Merge element style with any existing format, preserving user overrides
      if (elementStyle) {
        return {
          ...item,
          format: {
            ...elementStyle,
            ...item.format, // User format takes precedence
          },
        };
      }

      return item;
    });
  }
}
