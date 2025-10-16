import { describe, test, expect } from 'vitest';
import { parseMarkdown } from '../markdown-parser.js';

describe('Markdown Parser', () => {
  test('parses headings correctly', () => {
    const markdown = `
# H1 Heading
## H2 Heading
### H3 Heading
#### H4 Heading
`;
    const result = parseMarkdown(markdown);

    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({
      type: 'heading',
      text: 'H1 Heading',
      format: { level: 1, borderBottom: true },
    });
    expect(result[1]).toEqual({
      type: 'heading',
      text: 'H2 Heading',
      format: { level: 2, borderBottom: true },
    });
    expect(result[2]).toEqual({
      type: 'heading',
      text: 'H3 Heading',
      format: { level: 3, borderBottom: false },
    });
    expect(result[3]).toEqual({
      type: 'heading',
      text: 'H4 Heading',
      format: { level: 4, borderBottom: false },
    });
  });

  test('parses paragraphs correctly', () => {
    const markdown = 'This is a simple paragraph.';
    const result = parseMarkdown(markdown);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'paragraph',
      text: 'This is a simple paragraph.',
    });
  });

  test('parses unordered lists with - marker', () => {
    const markdown = `
- First item
- Second item
- Third item
`;
    const result = parseMarkdown(markdown);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'bullets',
      items: ['First item', 'Second item', 'Third item'],
    });
  });

  test('parses unordered lists with * marker', () => {
    const markdown = `
* First item
* Second item
* Third item
`;
    const result = parseMarkdown(markdown);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'bullets',
      items: ['First item', 'Second item', 'Third item'],
    });
  });

  test('parses ordered lists', () => {
    const markdown = `
1. First step
2. Second step
3. Third step
`;
    const result = parseMarkdown(markdown);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'ordered',
      items: ['First step', 'Second step', 'Third step'],
    });
  });

  test('parses mixed content', () => {
    const markdown = `
# Title

This is a paragraph.

## Section

- Bullet 1
- Bullet 2

1. Step 1
2. Step 2
`;
    const result = parseMarkdown(markdown);

    expect(result).toHaveLength(5);
    expect(result[0].type).toBe('heading');
    expect(result[1].type).toBe('paragraph');
    expect(result[2].type).toBe('heading');
    expect(result[3].type).toBe('bullets');
    expect(result[4].type).toBe('ordered');
  });

  test('preserves inline markdown formatting in list items', () => {
    const markdown = `
- Item with **bold** text
- Item with *italic* text
- Item with **bold** and *italic* text
`;
    const result = parseMarkdown(markdown);

    expect(result).toHaveLength(1);
    expect(result[0].items).toEqual([
      'Item with **bold** text',
      'Item with *italic* text',
      'Item with **bold** and *italic* text',
    ]);
  });

  test('handles empty lines between blocks', () => {
    const markdown = `
# Heading


Paragraph with multiple empty lines above.


- List item


`;
    const result = parseMarkdown(markdown);

    // Should include empty paragraphs for spacing
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result[0].type).toBe('heading');
    // Empty paragraph for spacing
    expect(result[1].type).toBe('paragraph');
    expect(result[1].text).toBe('');
    // Regular paragraph
    expect(result[2].type).toBe('paragraph');
    expect(result[2].text).toBe('Paragraph with multiple empty lines above.');
  });

  test('handles complex resume example', () => {
    const markdown = `
# John Doe

## Summary

I am a **senior engineer** with *10 years* experience.

## Skills

- TypeScript
- React
- Node.js

## Experience

### Senior Engineer

Key achievements:

1. Built microservices
2. Reduced latency by 40%
3. Mentored 5 engineers
`;
    const result = parseMarkdown(markdown);

    expect(result.length).toBeGreaterThan(0);
    expect(result.some(item => item.type === 'heading')).toBe(true);
    expect(result.some(item => item.type === 'paragraph')).toBe(true);
    expect(result.some(item => item.type === 'bullets')).toBe(true);
    expect(result.some(item => item.type === 'ordered')).toBe(true);
  });

  test('handles single line content without newlines', () => {
    const markdown = '# Just a heading';
    const result = parseMarkdown(markdown);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'heading',
      text: 'Just a heading',
      format: { level: 1, borderBottom: true },
    });
  });

  test('trims whitespace from list items', () => {
    const markdown = `
-   Item with extra spaces
*  Another item
`;
    const result = parseMarkdown(markdown);

    expect(result).toHaveLength(1);
    expect(result[0].items).toEqual(['Item with extra spaces', 'Another item']);
  });

  test('creates empty paragraphs for spacing', () => {
    const markdown = `
# Heading 1

Paragraph 1


Paragraph 2 with two empty lines above


Paragraph 3 with three empty lines above
`;
    const result = parseMarkdown(markdown);

    // Should have: heading, paragraph 1, empty, paragraph 2, empty, paragraph 3
    expect(result.length).toBeGreaterThanOrEqual(5);

    // Find the empty paragraphs
    const emptyParagraphs = result.filter(item => item.type === 'paragraph' && item.text === '');
    expect(emptyParagraphs.length).toBeGreaterThan(0);

    // Verify structure
    expect(result[0].type).toBe('heading');
    expect(result[1].type).toBe('paragraph');
    expect(result[1].text).toBe('Paragraph 1');
  });

  test('single empty line between blocks creates no extra spacing', () => {
    const markdown = `
# Heading

Paragraph
`;
    const result = parseMarkdown(markdown);

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('heading');
    expect(result[1].type).toBe('paragraph');
  });

  test('multiple empty lines create spacing paragraphs', () => {
    const markdown = `Paragraph 1


Paragraph 2`;
    const result = parseMarkdown(markdown);

    // Should be: paragraph 1, empty paragraph, paragraph 2
    expect(result).toHaveLength(3);
    expect(result[0].type).toBe('paragraph');
    expect(result[0].text).toBe('Paragraph 1');
    expect(result[1].type).toBe('paragraph');
    expect(result[1].text).toBe('');
    expect(result[2].type).toBe('paragraph');
    expect(result[2].text).toBe('Paragraph 2');
  });
});
