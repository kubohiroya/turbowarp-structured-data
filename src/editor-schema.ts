import type {SourceEditorOptions} from '@kubohiroya/turbowarp-extension-data-editor/schema';
import {extensionConfig} from './config.js';
import {sourceBinding} from './source-editor.js';
import {jsonValueSchemaBundle} from '@kubohiroya/turbowarp-extension-data-editor/schema';
import {parseJsonDocument, parseYamlDocument} from './codecs.js';
import {parseJson} from './core.js';
const definitions = [
 {editorId: 'json-document-source', opcodes: ['parseJson'], bindings: [sourceBinding('TEXT', jsonValueSchemaBundle, parseJsonDocument)]},
 {editorId: 'yaml-document-source', opcodes: ['parseYaml'], bindings: [sourceBinding('TEXT', jsonValueSchemaBundle, parseYamlDocument, parseYamlDocument, 'yaml')]},
 {editorId: 'json-path-value-source', opcodes: ['setJsonAtPath'], bindings: [sourceBinding('VALUE', jsonValueSchemaBundle, parseJson)]}
];

export const sourceEditorDefinitions: readonly SourceEditorOptions[] = definitions.map(({editorId, opcodes, bindings}) => ({
  apiVersion: 1, extensionId: extensionConfig.id, editorId, opcodes: opcodes.map(opcode => `${extensionConfig.id}_${opcode}`), bindings,
  validationContext: () => ({consumerId: extensionConfig.id, nowMs: Date.now(), settings: null})
}));
