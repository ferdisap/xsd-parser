import { ParseContext, XsdPlugin } from "./types";

export async function parseXsdSchema(
  xsdText: string,
  options: { plugins?: XsdPlugin[] } = {}
): Promise<Record<string, any>> {
  const { plugins = [] } = options;
  const ns = "http://www.w3.org/2001/XMLSchema";

  // providing DOM parser class
  let DOMParserImpl: typeof DOMParser;
  if (typeof window === 'undefined') {
    // Node.js environment
    const { DOMParser } = await import('@xmldom/xmldom');
    DOMParserImpl = DOMParser;
  } else {
    // Browser environment
    DOMParserImpl = window.DOMParser;
  }

  const parser = new DOMParserImpl();
  const xmlDoc = parser.parseFromString(xsdText, "text/xml");

  const context: ParseContext = {
    ns,
    xmlDoc,
    schema: {},
    typeDefs: {},
    globalElements: {},
  };

  for (const p of plugins) p.beforeParse?.(context);

  // === load global complexTypes ===
  const complexTypes = xmlDoc.getElementsByTagNameNS(ns, "complexType");
  for (const ct of Array.from(complexTypes)) {
    const name = ct.getAttribute("name");
    if (!name) continue;

    const seq = ct.getElementsByTagNameNS(ns, "sequence")[0];
    const children = seq
      ? Array.from(seq.children ?? [])
          .filter((n) => n.localName === "element" && n.namespaceURI === ns)
          .map((e) => e.getAttribute("name") || e.getAttribute("ref")!)
          .filter(Boolean)
      : [];

    const attributes = Array.from(ct.getElementsByTagNameNS(ns, "attribute"))
      .map((a) => a.getAttribute("name")!)
      .filter(Boolean);

    context.typeDefs[name] = { children, attributes };
  }

  for (const p of plugins) p.afterTypes?.(context);

  // === load global elements ===
  const elements = xmlDoc.getElementsByTagNameNS(ns, "element");
  for (const el of Array.from(elements)) {
    const name = el.getAttribute("name");
    if (name) context.globalElements[name] = el;
  }

  for (const el of Array.from(elements)) {
    const name = el.getAttribute("name");
    if (!name || name.endsWith("Type")) continue;

    const typeName = el.getAttribute("type") || undefined;
    let children: string[] = [];
    let attributes: string[] = [];

    const complexType = el.getElementsByTagNameNS(ns, "complexType")[0];
    if (complexType) {
      const seq = complexType.getElementsByTagNameNS(ns, "sequence")[0];
      if (seq) {
        children = Array.from(seq.children ?? [])
          .filter((n) => n.localName === "element" && n.namespaceURI === ns)
          .map((c) => c.getAttribute("name") || c.getAttribute("ref")!)
          .filter(Boolean);
      }

      attributes = Array.from(
        complexType.getElementsByTagNameNS(ns, "attribute")
      )
        .map((a) => a.getAttribute("name")!)
        .filter(Boolean);
    }

    context.schema[name] = { typeName, children, attributes };
  }

  for (const p of plugins) p.afterElements?.(context);
  for (const p of plugins) p.afterRefs?.(context);
  for (const p of plugins) p.done?.(context);

  return context.schema;
}
