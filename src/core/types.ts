/**
 * Represent a single XML attribute definition parsed from an XSD.
 */
export interface AttributeDef {
  /** 
   * The name of the attribute (e.g. "id", "color").
   */
  name: string;

  /** 
   * The data type of the attribute (e.g. "xs:string", "ColorType"). 
   * May refer to a global simpleType.
   */
  type?: string;

  /** 
   * Default value if none is provided in the XML.
   */
  default?: string;

  /** 
   * Fixed value that cannot be overridden.
   * If present, the attribute must always have this value.
   */
  fixed?: string;

  /** 
   * agar Monaco kamu bisa tampilkan tooltip “inherited from global attribute”, Jadi meskipun <xs:attribute ref="color"/>, parser tetap tahu type-nya berasal dari definisi global "ColorType".
   * Usage rule of the attribute:
   * - "required": must appear in the element.
   * - "optional": may appear.
   * - "prohibited": must not appear.
   */
  use?: string;

  /** 
   * Possible value options, usually extracted from an <xs:restriction> enumeration.
   * Example: ["red", "green", "blue"]
   */
  options?: string[];

  /** 
   * Source of the attribute definition.
   * Useful when the attribute is defined via a reference (e.g. <xs:attribute ref="color"/>),
   * so the parser can note that it's "inherited from global attribute 'color'".
   */
  origin?: string;
}

/**
 * Represent a single XML element definition, including its allowed
 * children, attributes, and type information.
 */
export interface ElementDef {
  /** 
   * The type name associated with this element (e.g. "BookType", "xs:string").
   */
  typeName?: string;

  /** 
   * List of allowed child element (not grandchild element) names that can appear inside this element.
   */
  children: string[];

  /** 
   * Key-value map of allowed attributes for this element.
   * Each key is the attribute name, and the value is its definition.
   */
  attributes: Record<string, AttributeDef>;

  /** 
   * Whether this element should be hidden from suggestion results.
   * Used for internal or abstract XSD elements that shouldn't appear in editor completions.
   */
  hidden?: boolean;
}

/**
 * Internal parsing context used during XSD schema parsing.
 * Stores global definitions and state so that plugins and parsing functions
 * can share references and resolve cross-references.
 */
export interface ParseContext {
  /** 
   * Namespace prefix currently in use (e.g. "xs" or "xsd").
   */
  ns: string;

  /** 
   * The DOM Document object of the loaded XSD file.
   */
  xmlDoc: Document;

  /** 
   * The resulting map of parsed elements.
   * Each key is an element name, and value is its ElementDef.
   */
  schema: Record<string, ElementDef>;

  /** 
   * Type definitions, typically derived from <xs:complexType> or <xs:simpleType>.
   */
  typeDefs: Record<string, ElementDef>;

  /** 
   * The root element name of the schema, usually defined via <xs:element name="root">.
   */
  root: string;

  /** 
   * Map of globally defined <xs:element> elements where they must have attribute name.
   */
  globalElements: Record<string, Element>;

  /** 
   * Map of globally defined <xs:group> elements where they must have attribute name. 
   */
  globalGroups: Record<string, Element>;

  /** 
   * Map of globally defined <xs:complexType> elements where they must have attribute name.
   */
  globalCts: Record<string, Element>;

  /** 
   * Map of globally defined <xs:attribute> elements where they must have attribute name.
   */
  globalAttributes: Record<string, Element>;

  /** 
   * Map of globally defined <xs:attributeGroup> elements where they must have attribute name.
   */
  globalAttributeGroups: Record<string, Element>;

  /** 
   * Map of globally defined <xs:simpleType> elements where they must have attribute name.
   */
  globalSimpleTypes: Record<string, Element>;
}

/**
 * Interface for a pluggable parser extension.
 * Plugins can hook into the parsing process to modify or enhance the schema structure.
 */
export interface XsdPlugin {
  /** 
   * Unique name of the plugin.
   */
  name: string;

  /** 
   * Optional hook executed before parsing starts.
   * Useful for preparing the context or modifying XML before parsing.
   */
  beforeParse?(ctx: ParseContext): void;

  /** 
   * Optional hook executed after parsing is completed.
   * Useful for post-processing schema, resolving references, or augmenting metadata.
   */
  afterParse?(ctx: ParseContext): void;
}
