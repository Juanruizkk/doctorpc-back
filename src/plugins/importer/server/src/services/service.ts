import type { Core } from '@strapi/strapi'
const XLSX = require('xlsx')

function normalizeBoolean(v: any): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') return ['true', '1', 'si', 'sí', 'yes'].includes(v.toLowerCase().trim())
  return false
}

function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  async importFile(file: any) {
    const workbook = XLSX.readFile(file.filepath || file.path)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet)

    // Cargar categorías existentes
    const categories = await strapi.documents('api::category.category').findMany({
      fields: ['name', 'slug', 'documentId'],
    })
    const bySlug = new Map(categories.map((c: any) => [c.slug, c]))

    const imported: any[] = []
    const errors: any[] = []
    const updated: any[] = []

    for (let i = 0; i < rows.length; i++) {
      const r: any = rows[i]

      try {
        const name = String(r.name ?? '').trim()
        const price = Number(r.price)
        const stock = r.stock == null ? null : Number(r.stock)
        const brand = r.brand ? String(r.brand).trim() : null
        const active = normalizeBoolean(r.active ?? true)

        if (!name) throw new Error('name vacio')
        if (Number.isNaN(price)) throw new Error('price invalido')

        const slug = generateSlug(name)

        const categorySlugs = String(r.categories ?? '')
          .split(/[;,|]/)
          .map((s: string) => s.trim())
          .filter(Boolean)

        const categoryDocs = categorySlugs
          .map((slug: string) => bySlug.get(slug))
          .filter(Boolean)

        // Datos del producto (sin categorías; esa relación se setea desde category)
        // Nota: usamos any porque los tipos generados de Strapi no incluyen
        // esta relación inversa en el input; evitamos errores de compilación.
        const productData: any = {
          name,
          slug,
          price,
          stock: stock ?? 0,
          brand: brand ?? '',
          active,
        }

        // Buscar si existe el producto
        const existingProducts = await strapi.documents('api::product.product').findMany({
          filters: { slug: { $eq: slug } },
          limit: 1,
        })

        let result
        let action = 'created'

        if (existingProducts && existingProducts.length > 0) {
          const existingProduct = existingProducts[0]
          result = await strapi.documents('api::product.product').update({
            documentId: existingProduct.documentId,
            data: productData as any,
          })
          action = 'updated'
          updated.push({ row: i + 2, id: result.documentId, name, slug })
        } else {
          result = await strapi.documents('api::product.product').create({
            data: productData as any,
          })
          action = 'created'
        }

        // Publicar el producto
        await strapi.documents('api::product.product').publish({
          documentId: result.documentId,
        })

        // Asociar categorías desde su lado (manyToOne en category)
        await Promise.all(
          categoryDocs.map((c: any) =>
            strapi.documents('api::category.category').update({
              documentId: c.documentId,
              data: { product: { connect: { id: result.documentId } } } as any,
            })
          )
        )

        imported.push({ row: i + 2, id: result.documentId, name, slug, action })
      } catch (e: any) {
        errors.push({ row: i + 2, message: e.message })
      }
    }

    const createdCount = imported.filter((i: any) => i.action === 'created').length
    const updatedCount = imported.filter((i: any) => i.action === 'updated').length

    return {
      importedCount: imported.length,
      createdCount,
      updatedCount,
      errorCount: errors.length,
      imported,
      errors,
    }
  },
})

export default service
