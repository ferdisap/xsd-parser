import { XsdPlugin } from "../core/types";

export function complexTypePlugin(): XsdPlugin {
  return {
    name: "complexTypePlugin",
    afterElements(ctx) {
      for (const [name, def] of Object.entries(ctx.schema)) {
        if (def.typeName && ctx.typeDefs[def.typeName]) {
          const type = ctx.typeDefs[def.typeName];
          def.children = [...new Set([...def.children, ...(type.children || [])])];
          def.attributes = [...new Set([...def.attributes, ...(type.attributes || [])])];
        }
      }
    },
  };
}
