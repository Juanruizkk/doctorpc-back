import type { Core } from '@strapi/strapi';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
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
  },
});

export default controller;
