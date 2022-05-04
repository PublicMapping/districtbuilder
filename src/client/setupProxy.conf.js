const process = require("process");
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = {
  "/api": {
    changeOrigin: true,
    target: process.env.BASE_URL
  }
};
