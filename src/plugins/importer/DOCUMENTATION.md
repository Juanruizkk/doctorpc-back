# Plugin de Importación de Productos - Strapi 5

## 📋 Descripción

Plugin personalizado para Strapi 5 que permite la importación masiva de productos desde archivos Excel (.xlsx). El plugin lee el archivo, procesa las filas, mapea las categorías por slug y crea los productos en la base de datos.

## 🎯 Propósito

Facilitar la carga masiva de productos a través de una interfaz gráfica en el panel de administración de Strapi, evitando la creación manual uno por uno.

---

## 📁 Estructura del Plugin

```
src/plugins/importer/
├── admin/                          # Frontend del plugin
│   └── src/
│       ├── pages/
│       │   ├── App.tsx            # Routing del plugin
│       │   └── HomePage.tsx       # Página principal con UI de importación
│       ├── components/
│       │   ├── Initializer.tsx
│       │   └── PluginIcon.tsx
│       ├── translations/
│       │   └── en.json
│       ├── index.ts               # Registro del plugin en admin
│       └── pluginId.ts
│
├── server/                         # Backend del plugin
│   └── src/
│       ├── controllers/
│       │   ├── controller.ts      # Controlador de importación
│       │   └── index.ts
│       ├── services/
│       │   ├── service.ts         # Lógica de importación
│       │   └── index.ts
│       ├── routes/
│       │   ├── admin/
│       │   │   └── index.ts       # Rutas admin
│       │   ├── content-api/
│       │   │   └── index.ts       # Rutas content-api (vacías)
│       │   └── index.ts
│       ├── bootstrap.ts
│       ├── config/
│       ├── destroy.ts
│       ├── index.ts               # Exportación del servidor
│       └── register.ts
│
├── package.json                    # Dependencias del plugin
└── DOCUMENTATION.md               # Esta documentación
```

---

## 🔧 Archivos Principales

### 1. **service.ts** - Lógica de Importación

**Ubicación:** `server/src/services/service.ts`

**Responsabilidad:** Procesa el archivo Excel y crea los productos en la base de datos.

**Funciones principales:**

- `normalizeBoolean(v)`: Convierte diferentes formatos de booleanos (true, 1, "si", "yes") a boolean
- `importFile(file)`: Función principal que:
  - Lee el archivo Excel con la librería `xlsx`
  - Obtiene todas las categorías existentes
  - Mapea categorías por slug para relacionarlas con productos
  - Itera sobre cada fila del Excel
  - Valida datos requeridos (name, price)
  - Crea cada producto con sus relaciones
  - Retorna estadísticas de importación

**Código clave:**

```typescript
const workbook = XLSX.readFile(file.filepath || file.path);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);

// Mapeo de categorías
const categories = await strapi.documents('api::category.category').findMany({
  fields: ['name', 'slug'],
});
const bySlug = new Map(categories.map((c: any) => [c.slug, c]));

// Creación de producto
const created = await strapi.documents('api::product.product').create({
  data: {
    name,
    price,
    stock: stock ?? 0,
    brand: brand ?? '',
    active,
    categories: categoryDocs.map((c: any) => c.documentId),
  },
});
```

---

### 2. **controller.ts** - Controlador HTTP

**Ubicación:** `server/src/controllers/controller.ts`

**Responsabilidad:** Maneja las peticiones HTTP y coordina con el servicio.

**Función principal:**

- `importProducts(ctx)`:
  - Extrae el archivo del request
  - Valida que exista
  - Llama al servicio de importación
  - Retorna el resultado o error

**Código:**

```typescript
async importProducts(ctx: any) {
  const file = ctx.request.files?.file;

  if (!file) {
    return ctx.badRequest('Falta el archivo (field: file)');
  }

  try {
    const result = await strapi
      .plugin('importer')
      .service('service')
      .importFile(file);

    ctx.body = result;
  } catch (error: any) {
    ctx.throw(500, `Error al importar productos: ${error.message}`);
  }
}
```

---

### 3. **routes/admin/index.ts** - Rutas Admin

**Ubicación:** `server/src/routes/admin/index.ts`

**Responsabilidad:** Define las rutas del plugin accesibles desde el admin.

**Ruta configurada:**

```typescript
export default {
  type: 'admin',
  routes: [
    {
      method: 'POST',
      path: '/import-products',
      handler: 'controller.importProducts',
      config: {
        policies: [],
        auth: false,
      },
    },
  ],
};
```

**Endpoint resultante:** `POST /importer/import-products`

---

### 4. **HomePage.tsx** - Interfaz de Usuario

**Ubicación:** `admin/src/pages/HomePage.tsx`

**Responsabilidad:** Interfaz gráfica para subir archivos y ver resultados.

**Componentes:**

- **Input de archivo**: Selector de archivos .xlsx
- **Botón de importación**: Trigger del proceso
- **Estados de carga**: Loading spinner durante la importación
- **Alertas de resultado**:
  - Success: productos importados correctamente
  - Warning: importación parcial con errores
  - Danger: error completo
- **Detalles de errores**: Lista de errores con número de fila

**Hook principal:**

```typescript
const { post } = useFetchClient();

const onImport = async () => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await post('/importer/import-products', formData);
  setResult(response.data);
};
```

---

### 5. **admin/src/index.ts** - Registro del Plugin

**Ubicación:** `admin/src/index.ts`

**Responsabilidad:** Registra el plugin en el panel de administración.

**Configuración:**

```typescript
app.addMenuLink({
  to: `plugins/${PLUGIN_ID}`,
  icon: PluginIcon,
  intlLabel: {
    id: `${PLUGIN_ID}.plugin.name`,
    defaultMessage: PLUGIN_ID,
  },
  Component: async () => {
    const { App } = await import('./pages/App');
    return App;
  },
});
```

Esto crea el enlace "Importar" en el menú lateral del admin.

---

## 📦 Instalación y Configuración

### 1. Instalar Dependencias

```bash
cd src/plugins/importer
npm install
```

**Dependencias principales:**

- `xlsx@^0.18.5`: Librería para leer archivos Excel
- `@strapi/design-system`: Componentes UI de Strapi
- `@strapi/icons`: Iconos de Strapi

### 2. Construir el Plugin

```bash
npm run build
```

Este comando:
- Compila TypeScript a JavaScript
- Genera archivos .d.ts para tipos
- Crea bundles para CJS y ESM
- Optimiza el código para producción

### 3. Registrar el Plugin en Strapi

El plugin ya está en `src/plugins/importer`, Strapi lo detecta automáticamente.

### 4. Iniciar Strapi

```bash
cd ../../../  # Volver a la raíz del proyecto
npm run develop
```

---

## 🚀 Uso del Plugin

### 1. Acceder al Plugin

1. Inicia sesión en el panel de administración de Strapi
2. En el menú lateral, busca el enlace "importer" o "Importar"
3. Haz click para acceder a la interfaz

### 2. Preparar el Archivo Excel

Crea un archivo `.xlsx` con las siguientes columnas:

| Columna | Tipo | Obligatorio | Descripción | Ejemplo |
|---------|------|-------------|-------------|---------|
| `name` | String | ✅ | Nombre del producto | "RTX 4090" |
| `price` | Number | ✅ | Precio del producto | 450000 |
| `stock` | Number | ❌ | Cantidad en stock | 10 |
| `brand` | String | ❌ | Marca del producto | "NVIDIA" |
| `active` | Boolean | ❌ | Si está activo | true, 1, "si", "yes" |
| `categories` | String | ❌ | Slugs separados por `;` ó `,` | "gpu;nvidia" |

**Ejemplo de Excel:**

| name | price | stock | brand | active | categories |
|------|-------|-------|-------|--------|------------|
| RTX 4090 | 450000 | 5 | NVIDIA | true | gpu;nvidia |
| Ryzen 9 7950X | 180000 | 10 | AMD | 1 | cpu;amd |
| Logitech G Pro | 25000 | 20 | Logitech | si | perifericos;mouse |

### 3. Importar Productos

1. Click en el botón "Seleccionar archivo"
2. Elige tu archivo `.xlsx`
3. Click en "Importar Productos"
4. Espera a que termine el proceso
5. Revisa el resultado:
   - **Success**: Todos los productos se importaron
   - **Warning**: Algunos productos tienen errores
   - **Danger**: Error completo en la importación

### 4. Revisar Errores

Si hay errores, el plugin muestra:

```json
{
  "importedCount": 8,
  "errorCount": 2,
  "imported": [...],
  "errors": [
    {
      "row": 5,
      "message": "name vacío"
    },
    {
      "row": 7,
      "message": "price inválido"
    }
  ]
}
```

- `row`: Número de fila en el Excel (empezando en 2, asumiendo headers en fila 1)
- `message`: Descripción del error

---

## 🔍 Detalles Técnicos

### Mapeo de Categorías

El plugin mapea categorías por **slug**, no por nombre:

```typescript
const bySlug = new Map(categories.map(c => [c.slug, c]));

// Buscar categorías del producto
const categorySlugs = "gpu;nvidia".split(/[;,|]/);
const categoryDocs = categorySlugs
  .map(slug => bySlug.get(slug))
  .filter(Boolean);
```

**Importante:** Las categorías deben existir previamente en Strapi con sus slugs configurados.

### Normalización de Booleanos

Acepta múltiples formatos para el campo `active`:

```typescript
function normalizeBoolean(v: any): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string')
    return ['true', '1', 'si', 'sí', 'yes'].includes(v.toLowerCase().trim());
  return false;
}
```

### API de Strapi 5 - Document Service

El plugin usa la nueva Document Service API de Strapi 5:

```typescript
// Buscar documentos
await strapi.documents('api::category.category').findMany({...})

// Crear documento
await strapi.documents('api::product.product').create({
  data: {...}
})
```

**Relaciones:** Se establecen usando `documentId` en lugar de `id`:

```typescript
categories: categoryDocs.map(c => c.documentId)
```

---

## 🐛 Troubleshooting

### Error: "Handler not found 'controller.index'"

**Causa:** Ruta de content-api buscando un handler que no existe.

**Solución:** Asegúrate que `routes/content-api/index.ts` tenga:

```typescript
export default {
  type: 'content-api',
  routes: [],
};
```

### Error: "Cannot read properties of null (reading 'useContext')"

**Causa:** Import incorrecto de hooks en el admin.

**Solución:** Usar el import correcto:

```typescript
import { useFetchClient } from '@strapi/admin/strapi-admin';
```

### Error de Vite: "File does not exist in optimize deps directory"

**Causa:** Caché de Vite desactualizada.

**Solución:**

```bash
# Limpiar caché
rm -rf node_modules/.strapi
rm -rf .strapi

# Reconstruir plugin
cd src/plugins/importer
npm run build

# Reiniciar Strapi
cd ../../..
npm run develop
```

### Productos no se crean con categorías

**Causa:** Slugs de categorías incorrectos o categorías no existen.

**Solución:**

1. Verifica que las categorías existan en Content Manager
2. Confirma que los slugs en el Excel coincidan exactamente
3. Los slugs son case-sensitive

### Error: "price inválido"

**Causa:** Celda de precio vacía o con texto.

**Solución:**

- Asegúrate que todas las celdas de precio tengan números
- No uses símbolos de moneda ($, €, etc.)
- Usa punto (.) para decimales, no coma (,)

---

## 📊 Respuesta del Endpoint

### Success Response (200 OK)

```json
{
  "importedCount": 10,
  "errorCount": 0,
  "imported": [
    {
      "row": 2,
      "id": "cm59k3j4l00003b6gfh8k9p2q",
      "name": "RTX 4090"
    },
    {
      "row": 3,
      "id": "cm59k3j4m00013b6g7h9k0p3r",
      "name": "Ryzen 9 7950X"
    }
  ],
  "errors": []
}
```

### Partial Success (200 OK con errores)

```json
{
  "importedCount": 8,
  "errorCount": 2,
  "imported": [...],
  "errors": [
    {
      "row": 5,
      "message": "name vacío"
    },
    {
      "row": 9,
      "message": "price inválido"
    }
  ]
}
```

### Error Response (500 Internal Server Error)

```json
{
  "error": {
    "status": 500,
    "name": "InternalServerError",
    "message": "Error al importar productos: Cannot read file",
    "details": {}
  }
}
```

---

## 🔐 Seguridad

### Autenticación

Actualmente el endpoint tiene `auth: false`. Para producción, cambia a:

```typescript
config: {
  policies: [],
  auth: true,  // Requiere autenticación admin
}
```

### Validaciones

El servicio valida:

- ✅ Existencia del archivo
- ✅ Campo `name` no vacío
- ✅ Campo `price` es número válido
- ✅ Categorías existen en la base de datos

### Limitaciones

**Tamaño de archivo:** Depende de la configuración de Strapi (`strapi::body` middleware).

**Número de productos:** No hay límite hardcodeado, pero considera:
- Memoria del servidor
- Timeout de la petición
- Rendimiento de la base de datos

Para archivos muy grandes (>1000 productos), considera:
- Procesamiento en background con jobs
- Importación por lotes (chunks)
- Queue system (Bull, Bee-Queue)

---

## 🎨 Personalización

### Cambiar el Icono del Menú

Edita `admin/src/components/PluginIcon.tsx`:

```typescript
import { Upload } from '@strapi/icons';

export const PluginIcon = () => <Upload />;
```

### Cambiar el Nombre en el Menú

Edita `package.json`:

```json
{
  "strapi": {
    "kind": "plugin",
    "name": "importer",
    "displayName": "Importador de Productos",  // ← Cambia aquí
    "description": "Importar productos desde Excel"
  }
}
```

### Agregar Campos Adicionales

1. Actualiza el servicio en `service.ts`:

```typescript
const description = r.description ? String(r.description).trim() : null;

const created = await strapi.documents('api::product.product').create({
  data: {
    name,
    price,
    description,  // ← Nuevo campo
    // ...
  },
});
```

2. Actualiza la documentación en `HomePage.tsx`:

```tsx
<Typography variant="omega">
  Columnas: <strong>name, price, description, stock, brand, active, categories</strong>
</Typography>
```

### Personalizar UI

El plugin usa `@strapi/design-system`. Componentes disponibles:

```typescript
import {
  Box,
  Typography,
  Button,
  Alert,
  TextInput,
  Flex,
  Grid,
  Card,
  Badge,
  // ... y más
} from '@strapi/design-system';
```

---

## 📚 Referencias

- [Strapi Plugin SDK](https://docs.strapi.io/dev-docs/plugins/development/create-a-plugin)
- [Strapi Design System](https://design-system.strapi.io/)
- [Document Service API](https://docs.strapi.io/dev-docs/api/document-service)
- [xlsx Library](https://docs.sheetjs.com/)
- [Strapi Admin API](https://docs.strapi.io/dev-docs/admin-panel-customization)

---

## 👤 Autor

**Juan Ruiz**
- Email: juanignacioruizr@gmail.com

---

## 📝 Licencia

MIT

---

## 🔄 Changelog

### v0.0.0 - 2025-01-01

**Características iniciales:**
- ✅ Importación de productos desde Excel
- ✅ Mapeo de categorías por slug
- ✅ Validación de datos requeridos
- ✅ Interfaz gráfica en admin panel
- ✅ Reportes de éxito y errores
- ✅ Soporte para múltiples formatos de booleanos
- ✅ Relaciones con categorías usando documentId

---

## 🚧 Roadmap

**Futuras mejoras:**

- [ ] Importación en background con queue
- [ ] Progress bar durante importación
- [ ] Preview de datos antes de importar
- [ ] Exportación de productos a Excel
- [ ] Actualización de productos existentes (por SKU o nombre)
- [ ] Soporte para imágenes (URLs o upload)
- [ ] Validaciones personalizables
- [ ] Logs de importación
- [ ] Deshacer última importación
- [ ] Plantilla de Excel descargable
- [ ] Soporte para CSV
- [ ] Importación incremental (solo nuevos)

---

**¡Gracias por usar el plugin de importación de productos!** 🎉
