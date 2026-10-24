import {defineConfig} from 'vite';
import {extensionManifestPlugin} from '@kubohiroya/turbowarp-extension-manifest';
import {turboWarpExtension} from '@kubohiroya/vite-plugin-turbowarp-extension';
import definitions from './src/block-definitions.json' with {type: 'json'};
import extensionTypes from './src/extension-types.json' with {type: 'json'};
import {extensionConfig} from './src/config.js';

export default defineConfig({
  plugins: [
    turboWarpExtension({
      id: extensionConfig.id,
      name: extensionConfig.name,
      description: extensionConfig.description,
      author: extensionConfig.author,
      license: extensionConfig.license,
      fileName: `${extensionConfig.slug}.js`
    }),
    extensionManifestPlugin({
      id: extensionConfig.id,
      // The extension-level types are read only here, so they stay out of the extension bundle.
      definitions: {...definitions, ...extensionTypes},
      formatVersion: 2
    }),
    {
      name: 'stable-generated-region-comments',
      generateBundle(_options, bundle) {
        for (const output of Object.values(bundle)) {
          if (output.type !== 'chunk') continue;
          const editorEngine = Object.keys(output.modules).find(id =>
            /\/node_modules\/(?:.*\/)?(?:ajv|ajv-formats|fast-uri|react|react-dom|@rjsf\/[^/]+)(?:\/|$)/u.test(id) ||
            /\/turbowarp-extension-data-editor\/dist\/(?:schema-engine|schema-compose|schema-view|source-editor|fixed-input-editor)\.js$/u.test(id));
          if (editorEngine) this.error(`Structured Data runtime includes an editor engine: ${editorEngine}`);
        }
      },
      renderChunk(code) {
        // Generated module paths depend on the package store and checkout location.
        // Preserve license comments and executable code while omitting region markers.
        return {code: code.replace(/^[\t ]*\/\/#(?:end)?region[^\r\n]*(?:\r?\n|$)/gm, ''), map: null};
      }
    }
  ]
});
