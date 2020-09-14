const process = require('process');
const proxy = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    proxy({
      changeOrigin: true,
      target: process.env.BASE_URL
    })
  );
};
