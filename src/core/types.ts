export interface ElementDef {
  typeName?: string;
  children: string[];
  attributes: string[];
  hidden?: boolean;
}

export interface ParseContext {
  ns: string;
  xmlDoc: Document;
  schema: Record<string, ElementDef>;
  typeDefs: Record<string, ElementDef>;
  globalElements: Record<string, Element>;
}

export interface XsdPlugin {
  name: string;
  beforeParse?(ctx: ParseContext): void;
  afterTypes?(ctx: ParseContext): void;
  afterElements?(ctx: ParseContext): void;
  afterRefs?(ctx: ParseContext): void;
  done?(ctx: ParseContext): void;
}
