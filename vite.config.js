import { defineConfig } from 'vite';
import fs from 'fs';

var header = fs.readFileSync('src/header.txt', 'utf-8').trim();

function headerPlugin() {
  return {
    name: 'insert-header',
    generateBundle(_, bundle) {
      for (var key in bundle) {
        var chunk = bundle[key];
        if (chunk.type === 'chunk') {
          chunk.code = header + '\n' + chunk.code;
        }
      }
    }
  };
}

export default defineConfig({
  plugins: [headerPlugin()],
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
      },
    },
    minify: false,
  },
});
