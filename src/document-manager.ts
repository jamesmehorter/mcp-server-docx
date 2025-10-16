import { Document, Paragraph, TextRun, HeadingLevel, Packer, IRunOptions, BorderStyle } from 'docx';
import * as fs from 'fs/promises';

interface DocumentSession {
  title?: string;
  author?: string;
  children: Paragraph[];
}

export interface ContentItem {
  type: 'paragraph' | 'heading' | 'bullets';
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
      children: []
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
      sections: [{
        properties: {
          page: {
            margin: {
              top: 864, // twips (1/20 point)
              right: 864,
              bottom: 864,
              left: 864
            }
          }
        },
        children: session.children
      }]
    });
  }

  /**
   * Add a paragraph with formatting
   * Auto-creates session if it doesn't exist
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

    const runOptions: IRunOptions = {
      text,
      font: format?.fontName,
      size: format?.fontSize ? format.fontSize * 2 : undefined, // Convert points to half-points
      bold: format?.bold,
      italics: format?.italic, // Note: it's 'italics' not 'italic' in docx
      color: format?.color
    };

    const paragraph = new Paragraph({
      children: [new TextRun(runOptions)]
    });

    session.children.push(paragraph);
  }

  /**
   * Add a heading with formatting and optional border
   * Auto-creates session if it doesn't exist
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

    const runOptions: IRunOptions = {
      text,
      font: options?.fontName,
      size: options?.fontSize ? options.fontSize * 2 : undefined,
      bold: options?.bold ?? true // Default headings to bold
    };

    const paragraphOptions: any = {
      heading: headingLevel,
      children: [new TextRun(runOptions)]
    };

    // Add border if requested
    if (options?.borderBottom) {
      paragraphOptions.border = {
        bottom: {
          color: '000000',
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6
        }
      };
    }

    const heading = new Paragraph(paragraphOptions);

    session.children.push(heading);
  }

  /**
   * Add a bulleted list
   * Auto-creates session if it doesn't exist
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
      const runOptions: IRunOptions = {
        text: item,
        font: format?.fontName,
        size: format?.fontSize ? format.fontSize * 2 : undefined
      };

      return new Paragraph({
        children: [new TextRun(runOptions)],
        bullet: {
          level: 0
        }
      });
    });

    session.children.push(...bullets);
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
              color: item.format?.color
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
              borderBottom: item.format?.borderBottom
            });
          }
          break;

        case 'bullets':
          if (item.items && item.items.length > 0) {
            await this.addBulletList(filename, item.items, {
              fontName: item.format?.fontName,
              fontSize: item.format?.fontSize
            });
          }
          break;
      }
    }

    // Save document
    await this.saveDocument(filename);
  }
}
