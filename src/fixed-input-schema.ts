import type {SchemaBundle} from '@kubohiroya/turbowarp-extension-data-editor/schema';
import document from '../schemas/block-editor-fixed-inputs.schema.json';

const source = {repository: 'turbowarp-structured-data', path: 'schemas/block-editor-fixed-inputs.schema.json',
  symbol: '#/$defs/forEachAtPath/properties/MAX'};

/** The on-disk owner Schema is canonical; this is its single-field projection. */
export const fixedInputSchemaBundle: SchemaBundle = {
  identity: {ownerId: 'turbowarp-structured-data', contractId: 'forEachAtPath.MAX', revision: 'fixed-inputs-v1', variantId: 'default'},
  dialect: '2020-12',
  root: {retrievalUri: 'https://kubohiroya.github.io/turbowarp-structured-data/schemas/forEachAtPath-MAX.schema.json',
    document: document.$defs.forEachAtPath.properties.MAX, artifact: {role: 'canonical-schema', source}},
  resources: [],
  provenance: {canonicalSources: [source, {repository: 'turbowarp-structured-data', path: 'src/core.ts', symbol: 'iterationEntries'}],
    generatedFiles: [{repository: 'turbowarp-structured-data', path: 'docs/schemas/block-editor-fixed-inputs.schema.json'}], referenceSchemas: [], generationSources: [{repository: 'turbowarp-structured-data', path: 'scripts/generate-fixed-input-docs.mjs'}]}
};
