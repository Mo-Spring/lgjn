
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// 一个简单的插件，在构建时将根目录的静态文件复制到 dist
const copyAssets = () => {
  return {
    name: 'copy-assets',
    closeBundle: () => {
      const filesToCopy = ['icon.svg', 'manifest.json', 'sw.js'];
      filesToCopy.forEach(file => {
        try {
          if (fs.existsSync(file)) {
            fs.copyFileSync(file, path.resolve('dist', file));
            console.log(`Copied ${file} to dist/`);
          }
        } catch (e) {
          console.warn(`Failed to copy ${file}:`, e);
        }
      });
    }
  }
};

export default defineConfig({
  plugins: [
    react(),
    copyAssets()
  ],
  base: './',
  server: {
    host: true, 
  }
});
