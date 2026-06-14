import { defineConfig } from 'vite';
import fs from 'fs';

var header = fs.readFileSync('src/header.txt', 'utf-8').trim();

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/main.js',
      formats: ['iife'],
      name: '__ds_enhancer',
      fileName: function () { return 'deepseek-enhancer.user.js'; },
    },
    rollupOptions: {
      external: ['GM_addStyle', 'GM_getValue', 'GM_setValue', 'GM_deleteValue'],
      output: {
        globals: {
          GM_addStyle: 'GM_addStyle',
          GM_getValue: 'GM_getValue',
          GM_setValue: 'GM_setValue',
          GM_deleteValue: 'GM_deleteValue',
        },
        banner: header + '\n',
      },
    },
    minify: false,
  },
});
