export interface DocumentSession {
  filename: string;
  doc: any; // docx Document instance
  createdAt: Date;
}

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
