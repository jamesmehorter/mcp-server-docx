import { ContentItem } from './document-manager.js';

/**
 * Parse markdown text and convert to ContentItem array
 * Supports:
 * - Headings: # H1, ## H2, ### H3, etc.
 * - Unordered lists: - item or * item
 * - Ordered lists: 1. item, 2. item, etc.
 * - Paragraphs: regular text
 * - Empty lines: create empty paragraphs for spacing
 * - Inline formatting: **bold**, *italic*
 */
export function parseMarkdown(markdown: string): ContentItem[] {
  const items: ContentItem[] = [];

  // Split into blocks by double newlines, but preserve single newlines within lists
  const blocks = splitIntoBlocks(markdown);

  for (const block of blocks) {
    const trimmed = block.trim();

    // Handle empty blocks - create empty paragraph for spacing
    if (!trimmed) {
      items.push({
        type: 'paragraph',
        text: '',
      });
      continue;
    }

    // Check for heading
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/m);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      items.push({
        type: 'heading',
        text,
        format: {
          level,
          borderBottom: level <= 2, // Add border for H1 and H2
        },
      });
      continue;
    }

    // Check for unordered list (lines starting with - or *)
    const unorderedListMatch = trimmed.match(/^[-*]\s+/m);
    if (unorderedListMatch) {
      const listItems = trimmed
        .split('\n')
        .filter(line => /^[-*]\s+/.test(line))
        .map(line => line.replace(/^[-*]\s+/, '').trim());

      if (listItems.length > 0) {
        items.push({
          type: 'bullets',
          items: listItems,
        });
      }
      continue;
    }

    // Check for ordered list (lines starting with 1., 2., etc.)
    const orderedListMatch = trimmed.match(/^\d+\.\s+/m);
    if (orderedListMatch) {
      const listItems = trimmed
        .split('\n')
        .filter(line => /^\d+\.\s+/.test(line))
        .map(line => line.replace(/^\d+\.\s+/, '').trim());

      if (listItems.length > 0) {
        items.push({
          type: 'ordered',
          items: listItems,
        });
      }
      continue;
    }

    // Default: treat as paragraph
    items.push({
      type: 'paragraph',
      text: trimmed,
    });
  }

  return items;
}

/**
 * Split markdown into blocks, preserving list structures and empty lines for spacing
 */
function splitIntoBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const lines = markdown.split('\n');
  let currentBlock = '';
  let inList = false;
  let emptyLineCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if this line starts a list or continues one
    const isListItem = /^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed);
    const isHeading = /^#{1,6}\s+/.test(trimmed);

    // If we hit an empty line
    if (!trimmed) {
      // If we were in a list, end it
      if (inList) {
        blocks.push(currentBlock);
        currentBlock = '';
        inList = false;
      }
      // If we have content, end the block
      else if (currentBlock.trim()) {
        blocks.push(currentBlock);
        currentBlock = '';
      }
      // Track consecutive empty lines
      emptyLineCount++;
      continue;
    }

    // If we have accumulated empty lines and hit content, add them as spacing
    if (emptyLineCount > 0) {
      // Add empty blocks for spacing (one less than count, since one empty line is just block separation)
      for (let j = 1; j < emptyLineCount; j++) {
        blocks.push('');
      }
      emptyLineCount = 0;
    }

    // If we hit a heading, end previous block and start new one
    if (isHeading) {
      if (currentBlock.trim()) {
        blocks.push(currentBlock);
      }
      currentBlock = line;
      blocks.push(currentBlock);
      currentBlock = '';
      inList = false;
      continue;
    }

    // If we hit a list item
    if (isListItem) {
      // If we were in a different block type, end it
      if (currentBlock && !inList) {
        blocks.push(currentBlock);
        currentBlock = '';
      }
      inList = true;
      currentBlock += (currentBlock ? '\n' : '') + line;
      continue;
    }

    // Regular line
    if (inList) {
      // End list if we hit non-list content
      blocks.push(currentBlock);
      currentBlock = line;
      inList = false;
    } else {
      currentBlock += (currentBlock ? '\n' : '') + line;
    }
  }

  // Don't forget the last block
  if (currentBlock.trim()) {
    blocks.push(currentBlock);
  }

  return blocks;
}
