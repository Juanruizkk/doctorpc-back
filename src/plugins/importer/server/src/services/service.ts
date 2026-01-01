import type { Core } from '@strapi/strapi';
const XLSX = require('xlsx');

function normalizeBoolean(v: any): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return ['true', '1', 'si', 'sí', 'yes'].includes(v.toLowerCase().trim());
  return false;
}

function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Reemplazar espacios con -
    .replace(/[^\w\-]+/g, '')       // Remover caracteres especiales
    .replace(/\-\-+/g, '-')         // Reemplazar múltiples - con uno solo
    .replace(/^-+/, '')             // Remover - del inicio
    .replace(/-+$/, '');            // Remover - del final
}

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  async importFile(file: any) {
    // 1) Leer excel
    const workbook = XLSX.readFile(file.filepath || file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    // 2) Cargar categorías existentes (para mapear por slug)
    const categories = await strapi.documents('api::category.category').findMany({
      fields: ['name', 'slug'],
    });

    const bySlug = new Map(categories.map((c: any) => [c.slug, c]));

    const imported = [];
    const errors = [];
    const updated = [];

    for (let i = 0; i < rows.length; i++) {
      const r: any = rows[i];

      try {
        // Esperamos columnas: name, price, stock, brand, active, categories
        const name = String(r.name ?? '').trim();
        const price = Number(r.price);
        const stock = r.stock == null ? null : Number(r.stock);
        const brand = r.brand ? String(r.brand).trim() : null;
        const active = normalizeBoolean(r.active ?? true);

        if (!name) throw new Error('name vacío');
        if (Number.isNaN(price)) throw new Error('price inválido');

        // Generar slug
        const slug = generateSlug(name);

        const categorySlugs = String(r.categories ?? '')
          .split(/[;,|]/)
          .map((s: string) => s.trim())
          .filter(Boolean);

        const categoryDocs = categorySlugs
          .map((slug: string) => bySlug.get(slug))
          .filter(Boolean);

        // Datos del producto
        const productData = {
          name,
          slug,
          price,
          stock: stock ?? 0,
          brand: brand ?? '',
          active,
          categories: categoryDocs.map((c: any) => c.documentId),
        };

        // 3) Buscar si el producto ya existe por slug
        const existingProducts = await strapi.documents('api::product.product').findMany({
          filters: { slug: { $eq: slug } },
          limit: 1,
        });

        let result;
        let action = 'created';

        if (existingProducts && existingProducts.length > 0) {
          // Actualizar producto existente
          const existingProduct = existingProducts[0];
          result = await strapi.documents('api::product.product').update({
            documentId: existingProduct.documentId,
            data: productData,
          });
          action = 'updated';
          updated.push({ row: i + 2, id: result.documentId, name, slug });
        } else {
          // Crear nuevo producto
          result = await strapi.documents('api::product.product').create({
            data: productData,
          });
          action = 'created';
        }

        // 4) Publicar el producto
        await strapi.documents('api::product.product').publish({
          documentId: result.documentId,
        });

        imported.push({ row: i + 2, id: result.documentId, name, slug, action });
      } catch (e: any) {
        errors.push({ row: i + 2, message: e.message });
      }
    }

    const createdCount = imported.filter((i: any) => i.action === 'created').length;
    const updatedCount = imported.filter((i: any) => i.action === 'updated').length;

    return {
      importedCount: imported.length,
      createdCount,
      updatedCount,
      errorCount: errors.length,
      imported,
      errors
    };
  },
});

export default service;
