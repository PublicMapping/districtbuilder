const process = require('process');
const proxy = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/users',
    proxy({
      changeOrigin: true,
      target: process.env.DB_BASE_URL
    })
  );
};
