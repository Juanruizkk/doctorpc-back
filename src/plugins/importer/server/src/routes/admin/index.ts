export default {
  type: 'admin',
  routes: [
    {
      method: 'POST',
      path: '/import-products',
      handler: 'controller.importProducts',
      config: {
        policies: [],
        auth: false, // Cambiar a true si quieres autenticación de admin
      },
    },
  ],
};
