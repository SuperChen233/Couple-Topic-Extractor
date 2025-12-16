import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 保持相对路径，确保在 WebView 中能找到资源
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});