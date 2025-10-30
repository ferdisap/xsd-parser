import { getPlugins } from "./pluginRegistry";
import { ParseContext, XsdPlugin, AttributeDef } from "./types";

/**
 * 🔧 Utility: Return all child elements (exclude text/comments).
 *
 * @param node - Parent XML element.
 * @returns Array of only `Element` children.
 */
function children(node: Element): Array<Element> {
  return Array.from(node.childNodes).filter((c) => c.nodeType === 1) as Array<Element>;
}

/**
 * 🧩 Recursively collect all child elements within a complexType or group.
 *
 * Handles nested structures like `<xs:sequence>`, `<xs:choice>`, `<xs:all>`, and `<xs:group ref="...">`.
 *
 * @param node - The XML element to scan.
 * @param ns - The XML Schema namespace (usually `http://www.w3.org/2001/XMLSchema`).
 * @param globalGroups - Map of globally defined `<xs:group>` elements for resolving references.
 * @returns List of element names (local or referenced).
 */
function collectElements(node: Element, ns: string, globalGroups: Record<string, Element>): string[] {
  const result: string[] = [];

  for (const child of children(node)) {
    if (child.namespaceURI !== ns) continue;

    if (child.localName === "element") {
      const name = child.getAttribute("name");
      const ref = child.getAttribute("ref");
      if (name || ref) result.push(name || ref!);
    } else if (["sequence", "choice", "all"].includes(child.localName)) {
      result.push(...collectElements(child, ns, globalGroups));
    } else if (child.localName === "group") {
      const ref = child.getAttribute("ref");
      if (ref && globalGroups[ref]) {
        result.push(...collectElements(globalGroups[ref], ns, globalGroups));
      } else {
        result.push(...collectElements(child, ns, globalGroups));
      }
    }
  }
  return result;
}

/**
 * 🧩 Extract enumeration values from a `<xs:simpleType>` restriction.
 *
 * Example:
 * ```xml
 * <xs:simpleType>
 *   <xs:restriction base="xs:string">
 *     <xs:enumeration value="red"/>
 *     <xs:enumeration value="green"/>
 *   </xs:restriction>
 * </xs:simpleType>
 * ```
 * → returns `["red", "green"]`
 *
 * @param simpleTypeEl - The `<xs:simpleType>` element.
 * @param ns - XML Schema namespace.
 * @returns List of allowed string options.
 */
function parseSimpleType(simpleTypeEl: Element, ns: string): string[] {
  const restriction = simpleTypeEl.getElementsByTagNameNS(ns, "restriction")[0];
  if (!restriction) return [];
  return Array.from(restriction.getElementsByTagNameNS(ns, "enumeration"))
    .map((e) => e.getAttribute("value")!)
    .filter(Boolean);
}

/**
 * 🧩 Parse a single `<xs:attribute>` definition into `AttributeDef`.
 *
 * Supports:
 * - Inline attributes (`<xs:attribute name="foo" type="xs:string"/>`)
 * - Referenced attributes (`<xs:attribute ref="color"/>`)
 * - Inline `<xs:simpleType>` with enumeration
 * - Global simpleType references
 *
 * @param attrEl - The attribute XML element.
 * @param ctx - The parsing context containing global definitions.
 * @returns Parsed `AttributeDef` or `null` if name is missing.
 */
function parseAttribute(attrEl: Element, ctx: ParseContext): AttributeDef | null {
  const ns = ctx.ns;
  const ref = attrEl.getAttribute("ref");
  const name = attrEl.getAttribute("name") || ref;
  if (!name) return null;

  const def: AttributeDef = {
    name,
    type: attrEl.getAttribute("type") || undefined,
    default: attrEl.getAttribute("default") || undefined,
    fixed: attrEl.getAttribute("fixed") || undefined,
    use: attrEl.getAttribute("use") || undefined,
    origin: ref ? `ref:${ref}` : "local",
  };

  // 🟢 Resolve global attribute reference
  if (ref && ctx.globalAttributes && ctx.globalAttributes[ref]) {
    const refEl = ctx.globalAttributes[ref];
    const refDef = parseAttribute(refEl, ctx);
    if (refDef) {
      for (const [k, v] of Object.entries(refDef)) {
        // Only copy if local value is undefined
        if ((def as any)[k] === undefined) (def as any)[k] = v;
      }

      if (!def.type && refDef.type) def.type = refDef.type;
      if (refDef.options && refDef.options.length) def.options = refDef.options;
    }
  }

  // Inline <xs:simpleType> → enumeration values
  const simpleType = attrEl.getElementsByTagNameNS(ns, "simpleType")[0];
  if (simpleType) {
    def.options = parseSimpleType(simpleType, ns);
  }

  // If attribute references a global simpleType
  if (def.type && ctx.globalSimpleTypes && ctx.globalSimpleTypes[def.type]) {
    const typeEl = ctx.globalSimpleTypes[def.type];
    const enums = parseSimpleType(typeEl, ns);
    if (enums.length) def.options = enums;
  }

  return def;
}

/**
 * 🧹 Remove undefined/null values from an object.
 *
 * @param value - Any object with string keys.
 * @returns Cleaned copy without undefined values.
 */
function cleanObject<T extends Record<string, any>>(value: T): T {
  return Object.entries(value)
    .filter(([_, val]) => val !== undefined)
    .reduce<Record<string, any>>((obj, [key, val]) => {
      obj[key] = val;
      return obj;
    }, {}) as T;
}

/**
 * 🧩 Collect all attributes defined directly or via `<xs:attributeGroup>` inside a node.
 *
 * Recursively resolves group references and merges attributes.
 *
 * @param node - ComplexType or Element node to inspect.
 * @param ctx - Current parsing context.
 * @returns Record of attributes keyed by attribute name.
 */
function collectAttributes(node: Element, ctx: ParseContext): Record<string, AttributeDef> {
  const ns = ctx.ns;
  const attrs: Record<string, AttributeDef> = {};

  for (const child of children(node)) {
    if (child.namespaceURI !== ns) continue;

    if (child.localName === "attribute") {
      const parsed = parseAttribute(child, ctx);
      if (parsed) attrs[parsed.name] = parsed;
    } else if (child.localName === "attributeGroup") {
      const ref = child.getAttribute("ref");
      if (ref && ctx.globalAttributeGroups[ref]) {
        const groupEl = ctx.globalAttributeGroups[ref];
        Object.assign(attrs, collectAttributes(groupEl, ctx));
      } else {
        Object.assign(attrs, collectAttributes(child, ctx));
      }
    }
  }

  return attrs;
}

/**
 * 🧠 Parse an XSD schema text into an in-memory structure usable for autocompletion.
 *
 * This function:
 * - Parses the XSD XML document.
 * - Registers global definitions (`element`, `complexType`, `attribute`, etc.).
 * - Collects children and attributes for each type.
 * - Applies before/after plugin hooks.
 *
 * @param xsdText - The raw text content of an XSD file.
 * @returns Promise resolving to a map of element names → `ElementDef`.
 *
 * @example
 * ```ts
 * const schema = await parseXsdSchema(xsdText);
 * console.log(schema["book"].attributes);
 * ```
 */
export async function parseXsdSchema(xsdText: string): Promise<ParseContext["schema"]> {
  const plugins: XsdPlugin[] = getPlugins();
  const ns = "http://www.w3.org/2001/XMLSchema";

  // 🧾 Create XML DOM parser (browser or Node)
  let DOMParserImpl: typeof DOMParser;
  if (typeof window === "undefined") {
    const { DOMParser } = await import("@xmldom/xmldom");
    DOMParserImpl = DOMParser;
  } else {
    DOMParserImpl = window.DOMParser;
  }

  const parser = new DOMParserImpl();
  const xmlDoc = parser.parseFromString(xsdText, "text/xml");

  // 🧩 Initialize parsing context
  const context: ParseContext = {
    ns,
    xmlDoc,
    schema: {},
    typeDefs: {},
    root: "",
    globalElements: {},
    globalGroups: {},
    globalCts: {},
    globalAttributes: {},
    globalAttributeGroups: {},
    globalSimpleTypes: {},
  };

  // 🔌 Plugin pre-hook
  for (const p of plugins) p.beforeParse?.(context);

  // 🔹 Global registries
  for (const el of Array.from(xmlDoc.getElementsByTagNameNS(ns, "element"))) {
    const name = el.getAttribute("name");
    if (name) context.globalElements[name] = el;
  }

  for (const el of Array.from(xmlDoc.getElementsByTagNameNS(ns, "group"))) {
    const name = el.getAttribute("name");
    if (name) context.globalGroups[name] = el;
  }

  for (const el of Array.from(xmlDoc.getElementsByTagNameNS(ns, "complexType"))) {
    const name = el.getAttribute("name");
    if (name) context.globalCts[name] = el;
  }

  for (const el of Array.from(xmlDoc.getElementsByTagNameNS(ns, "attribute"))) {
    const name = el.getAttribute("name");
    if (name) context.globalAttributes[name] = el;
  }

  for (const el of Array.from(xmlDoc.getElementsByTagNameNS(ns, "attributeGroup"))) {
    const name = el.getAttribute("name");
    if (name) context.globalAttributeGroups[name] = el;
  }

  for (const el of Array.from(xmlDoc.getElementsByTagNameNS(ns, "simpleType"))) {
    const name = el.getAttribute("name");
    if (name) context.globalSimpleTypes[name] = el;
  }

  // 🔹 Load complexType definitions
  for (const [name, ct] of Object.entries(context.globalCts)) {
    const group = ct.firstElementChild;
    const children = group ? collectElements(group, ns, context.globalGroups) : [];
    const attributes = collectAttributes(ct, context);
    context.typeDefs[name] = { children, attributes };
  }

  // 🔹 Identify root element
  context.root = Object.keys(context.globalElements)[0] ?? "";

  // 🔹 Parse each top-level element
  for (const el of Object.values(context.globalElements)) {
    const name = el.getAttribute("name");
    if (!name || name.endsWith("Type")) continue;

    let children: string[] = [];
    let attributes: Record<string, AttributeDef> = {};

    const complexType = el.getElementsByTagNameNS(ns, "complexType")[0];
    if (complexType) {
      const group = complexType.firstElementChild;
      children = group ? collectElements(group, ns, context.globalGroups) : [];
      attributes = collectAttributes(complexType, context);
    }

    const typeName = el.getAttribute("type");
    if (typeName && context.typeDefs[typeName]) {
      const typeDef = context.typeDefs[typeName];
      children = [...new Set([...children, ...typeDef.children])];
      attributes = { ...typeDef.attributes, ...attributes };
    }

    context.schema[name] = cleanObject({ typeName: typeName || undefined, children, attributes });
  }

  // 🔌 Plugin post-hook
  for (const p of plugins) p.afterParse?.(context);

  return context.schema;
}
