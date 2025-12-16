import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from "vite-plugin-singlefile";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  // 相对路径基础配置
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 避免代码压缩导致的某些本地文件协议下的变量名冲突（可选，为了稳健性）
    minify: false, 
  },
});