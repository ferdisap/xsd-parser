import { XsdPlugin } from "../core/types";

/**
 * 🔌 Plugin: Include Hidden Types
 *
 * Plugin ini digunakan untuk memasukkan seluruh `complexType` dan `simpleType`
 * dari `typeDefs` ke dalam `schema`, tetapi dengan menandainya sebagai `hidden`.
 *
 * Tujuannya adalah agar tipe-tipe yang didefinisikan secara global (namun tidak langsung
 * muncul sebagai elemen) tetap dapat diakses oleh sistem, misalnya untuk keperluan
 * validasi, autocompletion lanjutan, atau referensi tipe turunan.
 *
 * Dengan plugin ini, developer masih bisa menelusuri tipe-tipe tersembunyi
 * tanpa menampilkan mereka secara eksplisit sebagai elemen XML yang valid.
 *
 * @example
 * ```ts
 * registerPlugin(includeHiddenTypesPlugin());
 * ```
 *
 * @returns Objek plugin (`XsdPlugin`) yang menambahkan semua type definitions
 *          ke dalam schema sebagai entri tersembunyi (`hidden: true`).
 */
export function includeHiddenTypesPlugin(): XsdPlugin {
  return {
    name: "includeHiddenTypesPlugin",

    /**
     * Lifecycle hook yang dijalankan setelah proses parsing XSD selesai.
     * Menyalin semua entri `typeDefs` ke `schema` dan memberi tanda `hidden: true`
     * agar tetap dikenali tetapi tidak muncul sebagai elemen utama.
     *
     * @param context - Objek konteks hasil parsing yang berisi schema, typeDefs, root, dll.
     */
    afterParse(context) {
      for (const [name, def] of Object.entries(context.typeDefs)) {
        context.schema[name] = { ...def, hidden: true };
      }
    },
  };
}
