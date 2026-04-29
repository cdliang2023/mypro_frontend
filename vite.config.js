import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  transpileDependencies: true,
  lintOnSave: false,
  devServer:{
    proxy: {
      'api': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true,
        secure: false,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  }


})
