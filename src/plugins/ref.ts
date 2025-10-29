import { XsdPlugin } from "../core/types";

export function refPlugin(): XsdPlugin {
  return {
    name: "refPlugin",
    afterRefs(ctx) {
      const { ns, schema, globalElements } = ctx;

      for (const [name, def] of Object.entries(schema)) {
        const resolvedChildren: string[] = [];
        for (const child of def.children || []) {
          if (schema[child]) {
            resolvedChildren.push(child);
          } else if (globalElements[child]) {
            const refEl = globalElements[child];
            const complexType = refEl.getElementsByTagNameNS(ns, "complexType")[0];
            const refChildren: string[] = [];

            if (complexType) {
              const seq = complexType.getElementsByTagNameNS(ns, "sequence")[0];
              if (seq) {
                const nested = Array.from(seq.children ?? [])
                  .filter((n) => n.localName === "element" && n.namespaceURI === ns)
                  .map((e) => e.getAttribute("name") || e.getAttribute("ref")!)
                  .filter(Boolean);
                refChildren.push(...nested);
              }
            }

            schema[child] = { typeName: refEl.getAttribute("type") || undefined, children: refChildren, attributes: [] };
            resolvedChildren.push(child);
          } else {
            resolvedChildren.push(child);
          }
        }
        def.children = resolvedChildren;
      }
    },
  };
}
