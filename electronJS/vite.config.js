import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 禁用Vue模板编译，保留原始HTML
          isCustomElement: () => false
        }
      }
    })
  ],
  build: {
    lib: false,
    rollupOptions: {
      input: {
        taskList: resolve(__dirname, 'src/taskGrid/taskList.html')
      },
      output: {
        // 禁用模块格式，使用传统脚本
        format: 'iife',
        globals: {
          'vue': 'Vue',
          'element-plus': 'ElementPlus',
          'vxe-table': 'VXETable',
          'jquery': '$'
        }
      }
    }
  },
  server: {
    port: 3000
  }
})