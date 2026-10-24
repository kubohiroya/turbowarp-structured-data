import {defineConfig} from 'vite';

/** Inline only pure shared helpers so metadata has no runtime dependency on the editor package. */
export default defineConfig({
  build: {
    emptyOutDir: false,
    outDir: 'lib-editor/src',
    target: 'es2022',
    minify: false,
    lib: {
      entry: 'src/editor-metadata.ts',
      formats: ['es'],
      fileName: () => 'editor-metadata.js'
    },
    rollupOptions: {external: ['yaml']}
  },
  plugins: [{
    name: 'lightweight-editor-metadata',
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') continue;
        const editorEngine = Object.keys(output.modules).find(id =>
          /\/node_modules\/(?:.*\/)?(?:ajv|ajv-formats|fast-uri|react|react-dom|@rjsf\/[^/]+)(?:\/|$)/u.test(id) ||
          /\/turbowarp-extension-data-editor\/dist\/(?:schema-engine|schema-compose|schema-view|source-editor|fixed-input-editor)\.js$/u.test(id));
        if (editorEngine) this.error(`Editor metadata includes an editor engine: ${editorEngine}`);
        output.code = output.code.replace(/^[\t ]*\/\/#(?:end)?region[^\r\n]*(?:\r?\n|$)/gm, '');
      }
    }
  }]
});
