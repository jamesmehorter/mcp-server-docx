export interface ParagraphFormat {
  fontName?: string;
  fontSize?: number; // in points
  bold?: boolean;
  italic?: boolean;
  color?: string; // hex RGB
}

export interface HeadingFormat extends ParagraphFormat {
  level?: number; // 1-9
  borderBottom?: boolean;
}

export interface BulletFormat extends ParagraphFormat {
  numId?: number; // numbering definition ID
}

/**
 * Style configuration for a specific markdown element
 */
export interface MarkdownElementStyle {
  fontName?: string;
  fontSize?: number; // in points
  bold?: boolean;
  italic?: boolean;
  color?: string; // hex RGB
  borderBottom?: boolean; // for headings
}

/**
 * Comprehensive style configuration for markdown-to-Word conversion
 * Each key corresponds to a markdown element type
 */
export interface MarkdownStyles {
  heading1?: MarkdownElementStyle;
  heading2?: MarkdownElementStyle;
  heading3?: MarkdownElementStyle;
  heading4?: MarkdownElementStyle;
  paragraph?: MarkdownElementStyle;
  bullets?: MarkdownElementStyle;
  ordered?: MarkdownElementStyle;
  blockquote?: MarkdownElementStyle;
}
