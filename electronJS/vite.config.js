const { defineConfig } = require('vite')
const vue = require('@vitejs/plugin-vue')
const { resolve } = require('path')

module.exports = defineConfig({
  plugins: [vue()],
  root: resolve(__dirname, 'src/vue'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true
  },
  server: {
    port: 3000
  }
})