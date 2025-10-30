**xsd-parser master**

# 🧩 xsd-parser

A modular, extensible **XML Schema (XSD) parser** written in TypeScript — built with a **plugin architecture** for maximum flexibility.  
It converts `.xsd` files into structured JSON that can be used for autocomplete, validation, or visualization in XML editors.

[![npm version](https://img.shields.io/npm/v/xsd-parser.svg?style=flat-square)](https://www.npmjs.com/package/xsd-parser)
[![npm downloads](https://img.shields.io/npm/dm/xsd-parser.svg?style=flat-square)](https://www.npmjs.com/package/xsd-parser)
[![license](https://img.shields.io/npm/l/xsd-parser.svg?style=flat-square)](https://github.com/ferdisap/xsd-parser/blob/main/LICENSE)
[![build](https://img.shields.io/github/actions/workflow/status/ferdisap/xsd-parser/build.yml?style=flat-square)](https://github.com/ferdisap/xsd-parser/actions)
[![TypeScript](https://img.shields.io/badge/written%20in-TypeScript-blue?style=flat-square)](https://www.typescriptlang.org/)

## 🚀 Features

- 🧠 Parses XSD files into structured schema objects  
- ⚙️ Plugin-based architecture — easily extend parsing behavior  
- 💡 Supports:
  - `xs:complexType`
  - `xs:element` (including nested and referenced ones)
  - `xs:choice`
  - `xs:sequence`
  - `xs:all`
  - `ref` attributes
- 🔌 Custom plugin system (you can inject your own handlers)

## 📦 Installation

```bash
npm install xsd-parser
```

## 🧰 Usage Example

### Basic Usage and Plugin Usage

```ts
import { parseXsdSchema, registerPlugin, getRootPlugin } from "xsd-parser";
import fs from "fs";

const xsdText = `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="Book" type="BookType"/>

  <xs:complexType name="BookType">
    <xs:sequence>
      <xs:element name="Title" type="xs:string"/>
      <xs:element name="Author" type="xs:string"/>
    </xs:sequence>
    <xs:attribute name="id" type="xs:string" use="required"/>
  </xs:complexType>
</xs:schema>`

// jika memerlukan root
registerPlugin(getRootPlugin((root) => {
  console.log("📘 Root element detected:", root);
}));
// jika membutuhkan hidden types
registerPlugin(includeHiddenTypesPlugin());

// parsing xsd text
async function main() {
  const xsdText = fs.readFileSync(xsdText, "utf-8");
  const schema = await parseXsdSchema(xsdText);
  console.log(schema);
}
main();
```

```
// expected output
{
  "Book": {
    "typeName": "BookType",
    "children": ["Title", "Author"],
    "attributes": {
      "id": { "name": "id", "type": "xs:string", "use": "required" }
    }
  }
}
```

### ✨ Catatan:
- Contoh sudah mencakup **basic usage** dan **plugin usage**.  
- Semua snippet valid untuk dijalankan langsung (`ts-node` atau `node` setelah build).  

---