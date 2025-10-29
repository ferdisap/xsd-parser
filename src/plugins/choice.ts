import { XsdPlugin } from "../core/types";

export function choicePlugin(): XsdPlugin {
  return {
    name: "choicePlugin",
    afterElements(ctx) {
      const { ns, schema } = ctx;

      for (const [name, def] of Object.entries(schema)) {
        const elementNode = ctx.globalElements[name];
        if (!elementNode) continue;

        const choiceNodes = elementNode.getElementsByTagNameNS(ns, "choice");
        for (const choice of Array.from(choiceNodes)) {
          const choiceChildren = Array.from(choice.children ?? [])
            .filter((n) => n.localName === "element" && n.namespaceURI === ns)
            .map((e) => e.getAttribute("name") || e.getAttribute("ref")!)
            .filter(Boolean);

          // gabungkan dengan anak yang sudah ada
          def.children = [...new Set([...def.children, ...choiceChildren])];
        }
      }
    },
  };
}
