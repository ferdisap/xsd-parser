# 🧩 xsd-parser

A modular, extensible **XML Schema (XSD) parser** written in TypeScript — built with a **plugin architecture** for maximum flexibility.  
It converts `.xsd` files into structured JSON that can be used for autocomplete, validation, or visualization in XML editors.

---

## 🚀 Features

- 🧠 Parses XSD files into structured schema objects  
- ⚙️ Plugin-based architecture — easily extend parsing behavior  
- 💡 Supports:
  - `xs:complexType`
  - `xs:element` (including nested and referenced ones)
  - `xs:choice`
  - `ref` attributes
- 🔌 Custom plugin system (you can inject your own handlers)

---

## 📦 Installation

```bash
npm install xsd-parser
