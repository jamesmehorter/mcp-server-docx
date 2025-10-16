#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { DocumentManager, ContentItem } from './document-manager.js';

const docManager = new DocumentManager();

const server = new Server(
  {
    name: 'word-document-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'create_document',
        description: 'Create a new Word document',
        inputSchema: {
          type: 'object',
          properties: {
            filename: { type: 'string', description: 'Path to save the document' },
            title: { type: 'string', description: 'Document title' },
            author: { type: 'string', description: 'Document author' },
          },
          required: ['filename'],
        },
      },
      {
        name: 'add_paragraph',
        description: 'Add a paragraph with optional formatting',
        inputSchema: {
          type: 'object',
          properties: {
            filename: { type: 'string' },
            text: { type: 'string' },
            font_name: {
              type: 'string',
              description: 'Font family (e.g., Helvetica, Times New Roman)',
            },
            font_size: { type: 'number', description: 'Font size in points' },
            bold: { type: 'boolean' },
            italic: { type: 'boolean' },
            color: { type: 'string', description: 'Hex RGB color (e.g., 000000)' },
          },
          required: ['filename', 'text'],
        },
      },
      {
        name: 'add_heading',
        description: 'Add a heading with optional formatting',
        inputSchema: {
          type: 'object',
          properties: {
            filename: { type: 'string' },
            text: { type: 'string' },
            level: { type: 'number', description: 'Heading level 1-9' },
            font_name: { type: 'string' },
            font_size: { type: 'number' },
            bold: { type: 'boolean' },
            border_bottom: { type: 'boolean', description: 'Add bottom border' },
          },
          required: ['filename', 'text'],
        },
      },
      {
        name: 'add_bullet_list',
        description: 'Add a bulleted list',
        inputSchema: {
          type: 'object',
          properties: {
            filename: { type: 'string' },
            items: { type: 'array', items: { type: 'string' } },
            font_name: { type: 'string' },
            font_size: { type: 'number' },
          },
          required: ['filename', 'items'],
        },
      },
      {
        name: 'save_document',
        description: 'Save the document to disk',
        inputSchema: {
          type: 'object',
          properties: {
            filename: { type: 'string' },
          },
          required: ['filename'],
        },
      },
      {
        name: 'create_document_from_content',
        description:
          'Create a complete Word document in a single call (FAST - use this instead of multiple calls)',
        inputSchema: {
          type: 'object',
          properties: {
            filename: { type: 'string', description: 'Path to save the document' },
            title: { type: 'string', description: 'Document title' },
            author: { type: 'string', description: 'Document author' },
            content: {
              type: 'array',
              description: 'Array of content items (paragraphs, headings, bullets)',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['paragraph', 'heading', 'bullets', 'ordered'],
                    description: 'Type of content item',
                  },
                  text: { type: 'string', description: 'Text content (for paragraph and heading)' },
                  items: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Bullet point items (for bullets type)',
                  },
                  format: {
                    type: 'object',
                    properties: {
                      fontName: { type: 'string', description: 'Font family' },
                      fontSize: { type: 'number', description: 'Font size in points' },
                      bold: { type: 'boolean' },
                      italic: { type: 'boolean' },
                      color: { type: 'string', description: 'Hex RGB color' },
                      level: {
                        type: 'number',
                        description: 'Heading level 1-9 (for heading type)',
                      },
                      borderBottom: {
                        type: 'boolean',
                        description: 'Add bottom border (for heading type)',
                      },
                    },
                  },
                },
                required: ['type'],
              },
            },
          },
          required: ['filename', 'content'],
        },
      },
      {
        name: 'create_document_from_markdown',
        description:
          '🚀 RECOMMENDED: Create a Word document from markdown text (MOST INTUITIVE - just write natural markdown!)',
        inputSchema: {
          type: 'object',
          properties: {
            filename: { type: 'string', description: 'Path to save the document' },
            markdown: {
              type: 'string',
              description:
                'Markdown text supporting headings (# ## ###), paragraphs, lists (- or 1.), and inline formatting (**bold**, *italic*)',
            },
            title: { type: 'string', description: 'Document title' },
            author: { type: 'string', description: 'Document author' },
          },
          required: ['filename', 'markdown'],
        },
      },
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name, arguments: args } = request.params;

  if (!args) {
    return {
      content: [{ type: 'text', text: 'Error: Missing arguments' }],
      isError: true,
    };
  }

  try {
    switch (name) {
      case 'create_document':
        await docManager.createDocument(
          args.filename as string,
          args.title as string | undefined,
          args.author as string | undefined
        );
        return {
          content: [{ type: 'text', text: `Document created: ${args.filename}` }],
        };

      case 'add_paragraph':
        await docManager.addParagraph(args.filename as string, args.text as string, {
          fontName: args.font_name as string | undefined,
          fontSize: args.font_size as number | undefined,
          bold: args.bold as boolean | undefined,
          italic: args.italic as boolean | undefined,
          color: args.color as string | undefined,
        });
        return {
          content: [{ type: 'text', text: 'Paragraph added' }],
        };

      case 'add_heading':
        await docManager.addHeading(args.filename as string, args.text as string, {
          level: args.level as number | undefined,
          fontName: args.font_name as string | undefined,
          fontSize: args.font_size as number | undefined,
          bold: args.bold as boolean | undefined,
          borderBottom: args.border_bottom as boolean | undefined,
        });
        return {
          content: [{ type: 'text', text: 'Heading added' }],
        };

      case 'add_bullet_list':
        await docManager.addBulletList(args.filename as string, args.items as string[], {
          fontName: args.font_name as string | undefined,
          fontSize: args.font_size as number | undefined,
        });
        return {
          content: [{ type: 'text', text: `Added ${(args.items as string[]).length} bullets` }],
        };

      case 'save_document':
        await docManager.saveDocument(args.filename as string);
        return {
          content: [{ type: 'text', text: `Document saved: ${args.filename}` }],
        };

      case 'create_document_from_content':
        await docManager.createDocumentFromContent(
          args.filename as string,
          args.content as ContentItem[],
          args.title as string | undefined,
          args.author as string | undefined
        );
        return {
          content: [{ type: 'text', text: `Document created and saved: ${args.filename}` }],
        };

      case 'create_document_from_markdown':
        await docManager.createDocumentFromMarkdown(
          args.filename as string,
          args.markdown as string,
          args.title as string | undefined,
          args.author as string | undefined
        );
        return {
          content: [
            {
              type: 'text',
              text: `✓ Document created from markdown and saved: ${args.filename}`,
            },
          ],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Word MCP Server running on stdio');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
