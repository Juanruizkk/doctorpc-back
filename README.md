# Catálogo Gamer - Backend (Strapi CMS)

Backend headless CMS para el catálogo de productos de Doctor PC, desarrollado con Strapi 5.

## Tecnologías

- **Strapi 5.33** - Headless CMS
- **Node.js 20+** - Runtime de JavaScript
- **SQLite** - Base de datos (desarrollo)
- **TypeScript** - Tipado estático
- **Better SQLite3** - Driver de base de datos

## Características

- API REST completa para productos y categorías
- Panel de administración intuitivo
- Sistema de autenticación y permisos
- Plugin personalizado para importación masiva de productos desde Excel
- Media library para gestión de imágenes
- Soporte para rich text en descripciones
- API pública con paginación y filtros

## Content Types

### Product
- name (string) - Nombre del producto
- slug (string) - URL amigable
- description (rich text) - Descripción del producto
- brand (string) - Marca
- price (decimal) - Precio
- stock (integer) - Cantidad disponible
- active (boolean) - Estado de publicación
- images (media) - Galería de imágenes
- categories (relation) - Categorías del producto

### Category
- name (string) - Nombre de la categoría
- slug (string) - URL amigable
- products (relation) - Productos de esta categoría

## Plugins Personalizados

### Importer Plugin
Plugin personalizado para importación masiva de productos desde archivos Excel (.xlsx).

**Ubicación:** `src/plugins/importer`

**Características:**
- Importación desde Excel con columnas: name, price, stock, brand, active, categories
- Generación automática de slugs
- Validación de datos
- Mapeo de categorías por slug
- Detección y actualización de productos existentes (upsert)
- Publicación automática de productos
- Interfaz de administración para carga de archivos
- Reporte detallado de importación (creados, actualizados, errores)

**Formato del Excel:**
```
name        | price  | stock | brand    | active | categories
Mouse Gamer | 15000  | 10    | Logitech | true   | perifericos;gaming
```

## Prerequisitos

- Node.js 20.x o superior
- npm 6.x o superior

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Editar .env y configurar los valores de seguridad
# Generar valores aleatorios con:
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"
```

## Desarrollo

```bash
# Iniciar servidor de desarrollo con auto-reload
npm run develop

# El panel de administración estará en http://localhost:1337/admin
# La API estará en http://localhost:1337/api
```

Al iniciar por primera vez, se te pedirá crear un usuario administrador.

## Build y Producción

```bash
# Construir el panel de administración
npm run build

# Iniciar en modo producción
npm run start
```

## Estructura del Proyecto

```
backend-gamer-catalog/
├── src/
│   ├── api/                      # Content types
│   │   ├── category/             # API de categorías
│   │   └── product/              # API de productos
│   ├── plugins/                  # Plugins personalizados
│   │   └── importer/             # Plugin de importación
│   │       ├── admin/            # UI del plugin
│   │       └── server/           # Lógica del servidor
│   │           ├── controllers/  # Controladores HTTP
│   │           ├── routes/       # Rutas del API
│   │           └── services/     # Lógica de negocio
│   └── index.ts                  # Punto de entrada
├── config/                       # Configuración de Strapi
├── database/                     # Migraciones (si las hay)
├── public/                       # Archivos públicos
│   └── uploads/                  # Archivos subidos
└── .tmp/                         # Base de datos SQLite (desarrollo)
```

## Endpoints de la API

### Productos

```bash
# Listar todos los productos
GET /api/products?populate=*

# Filtrar por categoría
GET /api/products?filters[categories][slug][$eq]=gaming&populate=*

# Obtener producto por slug
GET /api/products?filters[slug][$eq]=mouse-gamer&populate=*

# Paginación
GET /api/products?pagination[page]=1&pagination[pageSize]=8&populate=*
```

### Categorías

```bash
# Listar todas las categorías
GET /api/categories

# Categoría específica
GET /api/categories/:id
```

### Importación (Admin API)

```bash
# Importar productos desde Excel
POST /importer/import-products
Content-Type: multipart/form-data
file: [archivo.xlsx]
```

## Configuración de Permisos

Para que el frontend pueda acceder a la API:

1. Ir al panel de administración
2. Settings > Users & Permissions Plugin > Roles > Public
3. Habilitar permisos para:
   - Product: `find`, `findOne`
   - Category: `find`, `findOne`
4. Guardar cambios

## Base de Datos

### Desarrollo
Por defecto usa SQLite almacenado en `.tmp/data.db`

### Producción
Se recomienda usar PostgreSQL o MySQL. Configurar en `.env`:

```env
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=strapi
DATABASE_SSL=false
```

## Scripts Disponibles

- `npm run develop` - Servidor de desarrollo con auto-reload
- `npm run start` - Servidor de producción
- `npm run build` - Construir panel de administración
- `npm run strapi` - CLI de Strapi
- `npm run console` - Consola interactiva de Strapi
- `npm run upgrade` - Actualizar Strapi a la última versión

## Seguridad

**IMPORTANTE:** Antes de desplegar a producción:

1. Cambiar todos los valores `tobemodified` en `.env`
2. Usar secretos seguros generados aleatoriamente
3. Configurar CORS apropiadamente
4. Usar HTTPS
5. Configurar base de datos PostgreSQL/MySQL
6. Habilitar rate limiting
7. Revisar permisos de roles y usuarios

## Recursos de Strapi

- [Documentación oficial](https://docs.strapi.io)
- [Strapi CLI](https://docs.strapi.io/dev-docs/cli)
- [Deployment](https://docs.strapi.io/dev-docs/deployment)

## Licencia

Privado - Todos los derechos reservados
