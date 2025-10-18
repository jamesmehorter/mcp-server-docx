import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { toString } from 'mdast-util-to-string';
import type { Root, Content, PhrasingContent } from 'mdast';
import { ContentItem } from './document-manager.js';

/**
 * Parse markdown text and convert to ContentItem array using remark
 *
 * Supports:
 * - Headings: # H1, ## H2, ### H3, etc.
 * - Paragraphs: regular text
 * - Unordered lists: - item or * item
 * - Ordered lists: 1. item, 2. item, etc.
 * - Block quotes: > quote text
 * - Horizontal rules: ---, ***, ___
 * - Inline formatting: **bold**, *italic*, [text](url)
 * - Empty lines: create empty paragraphs for spacing
 */
export function parseMarkdown(markdown: string): ContentItem[] {
  const processor = unified().use(remarkParse);
  const ast = processor.parse(markdown) as Root;

  const items: ContentItem[] = [];
  let previousWasBlock = false;

  for (const node of ast.children) {
    const item = convertNode(node);

    if (item) {
      items.push(item);
      previousWasBlock = isBlockElement(node);
    } else if (previousWasBlock) {
      // Add empty paragraph for spacing after block elements
      items.push({ type: 'paragraph', text: '' });
      previousWasBlock = false;
    }
  }

  return items;
}

/**
 * Check if a node is a block-level element
 */
function isBlockElement(node: Content): boolean {
  return ['heading', 'list', 'blockquote', 'thematicBreak'].includes(node.type);
}

/**
 * Convert an mdast node to a ContentItem
 */
function convertNode(node: Content): ContentItem | null {
  switch (node.type) {
    case 'heading':
      return {
        type: 'heading',
        text: convertInlineContent(node.children),
        format: {
          level: node.depth,
          borderBottom: node.depth <= 2, // Add border for H1 and H2
        },
      };

    case 'paragraph':
      return {
        type: 'paragraph',
        text: convertInlineContent(node.children),
      };

    case 'list': {
      const items = node.children
        .map(listItem => {
          // Extract text from all children of the list item
          const text = listItem.children
            .map(child => {
              if (child.type === 'paragraph') {
                return convertInlineContent(child.children);
              }
              return toString(child);
            })
            .join(' ');
          return text;
        })
        .filter(text => text.length > 0);

      if (items.length === 0) return null;

      return {
        type: node.ordered ? 'ordered' : 'bullets',
        items,
      };
    }

    case 'blockquote': {
      // Get all paragraph content from blockquote
      const quoteText = node.children
        .map(child => {
          if (child.type === 'paragraph') {
            return convertInlineContent(child.children);
          }
          return toString(child);
        })
        .filter(text => text.length > 0)
        .join(' ');

      if (!quoteText) return null;

      return {
        type: 'paragraph',
        text: quoteText,
        format: {
          italic: true, // Style quotes in italic
        },
      };
    }

    case 'thematicBreak':
      // Horizontal rule (---, ***, ___)
      return {
        type: 'paragraph',
        text: '---',
      };

    default:
      // Skip unsupported node types (code, html, etc.)
      return null;
  }
}

/**
 * Convert inline mdast nodes (text, strong, emphasis, link) to markdown-formatted text
 * This preserves **bold**, *italic*, and [text](url) formatting as strings
 */
function convertInlineContent(children: PhrasingContent[]): string {
  return children
    .map(child => {
      switch (child.type) {
        case 'text':
          return child.value;

        case 'strong':
          // Convert to **bold** markdown
          return `**${convertInlineContent(child.children)}**`;

        case 'emphasis':
          // Convert to *italic* markdown
          return `*${convertInlineContent(child.children)}*`;

        case 'link':
          // Convert to [text](url) markdown
          const linkText = convertInlineContent(child.children);
          return `[${linkText}](${child.url})`;

        case 'inlineCode':
          // Keep code as-is (could wrap in backticks if needed)
          return child.value;

        case 'break':
          return ' ';

        default:
          // Fallback: convert to string
          return toString(child);
      }
    })
    .join('');
}
