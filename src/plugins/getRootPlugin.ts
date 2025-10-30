import { XsdPlugin } from "../core/types";

/**
 * 🔌 Plugin: Get Root Element Name
 *
 * Plugin ini berfungsi untuk mengambil nama elemen root dari hasil parsing
 * schema XSD. Biasanya digunakan oleh editor atau sistem autocomplete untuk
 * menentukan elemen utama (root) yang valid dalam sebuah dokumen XML.
 *
 * @example
 * ```ts
 * registerPlugin(getRootPlugin((root) => {
 *   console.log("Root element:", root);
 * }));
 * ```
 *
 * @param callback - Fungsi yang akan dipanggil setelah proses parsing selesai.
 *                   Fungsi ini menerima nama elemen root (`root`) dari schema XSD.
 * @returns Sebuah objek plugin (`XsdPlugin`) yang akan dieksekusi oleh sistem parser.
 */
export function getRootPlugin(callback: (root: string) => string): XsdPlugin {
  return {
    name: "getRootPlugin",

    /**
     * Hook yang dijalankan setelah seluruh proses parsing XSD selesai.
     * Memanggil callback pengguna dan memberikan nama elemen root.
     *
     * @param context - Konteks parsing XSD yang berisi data seperti:
     *                  root element, schema, type definitions, dsb.
     */
    afterParse(context) {
      callback(context.root);
    },
  };
}
