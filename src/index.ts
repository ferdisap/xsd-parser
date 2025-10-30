/**
 * 🧩 XSD Parser Plugin Core
 *
 * Library modular untuk mem-parsing file XML Schema (XSD) dan
 * menyediakan arsitektur plugin yang fleksibel.
 *
 * Fitur utama:
 * - Parse struktur XSD menjadi representasi JSON (schema)
 * - Dukungan untuk global element, attribute, group, dan simpleType
 * - Arsitektur plugin (beforeParse, afterParse)
 * - Plugin tambahan seperti:
 *   - `getRootPlugin()` untuk mengambil elemen root
 *   - `includeHiddenTypesPlugin()` untuk menyertakan type tersembunyi
 *
 * @packageDocumentation
 * @module xsd-parser
 */

export { parseXsdSchema } from "./core/parser";
export * from "./core/types";

// 🧩 Plugin system
export { registerPlugin, getPlugins } from "./core/pluginRegistry";

// 🔌 Built-in plugins
export { getRootPlugin } from "./plugins/getRootPlugin";
export { includeHiddenTypesPlugin } from "./plugins/includeHiddenTypesPlugin";
