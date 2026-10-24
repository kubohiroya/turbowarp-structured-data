import {createBlockEditorService} from '@kubohiroya/turbowarp-extension-data-editor/rjsf';
import type {BlockEditorHost, BlockSnapshot, JsonObject, LiteralArgumentChange} from '@kubohiroya/turbowarp-extension-data-editor';
import {describe, expect, it} from 'vitest';
import {sourceEditorDefinitions} from '../src/editor-schema.js';
import {canonicalBundle, registerSourceEditors, sourceBinding} from '../src/source-editor.js';
const context = {consumerId: 'regression', nowMs: 1, settings: null};
describe('source form contracts', () => {
 it('matches existing owner acceptance without replacing raw values', () => {
const json = sourceEditorDefinitions[0]!.bindings[0]!;
 const yaml = sourceEditorDefinitions[1]!.bindings[0]!;
 const value = sourceEditorDefinitions[2]!.bindings[0]!;
 for (const binding of [json,value]) for (const source of ['null','false','[1,1,null]','{"unknown":true}']) expect(binding.validateSource(source, context).result.kind).toBe('valid');
 const source = '# preserved\na: [1, 1, null]\nb: false\n';
 expect(yaml.decode(source).source).toBe(source);
 expect(yaml.validateSource(source, context).result.kind).toBe('valid');
 for (const source of ['a: &x 1\nb: *x\n', 'a: 1\na: 2\n', 'a: .inf\n', 'a: !custom 1\n']) expect(yaml.validateSource(source, context).result.kind).toBe('invalid');
 expect(json.validateSource(JSON.stringify('x'.repeat(256*1024)), context).result.kind).toBe('invalid');
 expect(sourceEditorDefinitions.flatMap(d => d.opcodes.map(opcode => opcode.slice(d.extensionId.length + 1)))).toEqual(['parseJson','parseYaml','setJsonAtPath']);
 });
 it('preserves document depth limits without imposing them on setJsonAtPath values', () => {
  const json = sourceEditorDefinitions[0]!.bindings[0]!;
  const yaml = sourceEditorDefinitions[1]!.bindings[0]!;
  const value = sourceEditorDefinitions[2]!.bindings[0]!;
  const source = (depth: number) => '['.repeat(depth)+'0'+']'.repeat(depth);
  for (const binding of [json,yaml]) {
   expect(binding.validateSource(source(64), context).result.kind).toBe('valid');
   expect(binding.validateSource(source(65), context).result.kind).toBe('invalid');
  }
  expect(value.validateSource(source(65), context).result.kind).toBe('valid');
 });
 it('checks the 50000 node document budget including the root', () => {
  const json = sourceEditorDefinitions[0]!.bindings[0]!;
  const yaml = sourceEditorDefinitions[1]!.bindings[0]!;
  for (const binding of [json,yaml]) {
   expect(binding.validateSource(JSON.stringify(Array(49999).fill(0)), context).result.kind).toBe('valid');
   expect(binding.validateSource(JSON.stringify(Array(50000).fill(0)), context).result.kind).toBe('invalid');
  }
 });
 it('preserves invalid source for repair and validates the exact source', () => {
  for (const definition of sourceEditorDefinitions) for (const binding of definition.bindings) {
   const source = '{';
   expect(binding.validateSource(source, context).source).toBe(source);
   expect(binding.validateSource(source, context).result.kind).toBe('invalid');
   expect(() => binding.decode(source)).toThrow();
  }
 });
 it('registers only on the optional capability and unregisters once on disposal', () => {
  expect(() => registerSourceEditors({}, sourceEditorDefinitions)()).not.toThrow();
  let staleRegistrations = 0;
  registerSourceEditors({gui: {blockEditors: {apiVersion: 2, registerSourceEditor() {staleRegistrations++; return () => {};}}}}, sourceEditorDefinitions)();
  expect(staleRegistrations).toBe(0);
  let registrations = 0, removals = 0;
  const listeners = new Map<string, () => void>();
  const scratch = {gui: {blockEditors: {apiVersion: 1, registerSourceEditor() {registrations++; return () => {removals++;};}}},
   vm: {runtime: {on(event: string, callback: () => void) {listeners.set(event, callback);}, off(event: string) {listeners.delete(event);}}}};
  const dispose = registerSourceEditors(scratch, sourceEditorDefinitions);
  expect(registrations).toBe(sourceEditorDefinitions.length);
  listeners.get('RUNTIME_DISPOSED')!();
  dispose();
  expect(removals).toBe(registrations);
  expect(listeners.size).toBe(0);
 });
});

describe('prepared source service integration', () => {
 it('delegates Schema constraints to the GUI while keeping the owner callback engine-free', async () => {
  const bundle = canonicalBundle('turbowarp-structured-data', 'required-name',
   {type: 'object', required: ['name'], properties: {name: {type: 'string'}}},
   {path: 'src/core.ts', symbol: 'parseJson'});
  const binding = sourceBinding('TEXT', bundle, JSON.parse);
  expect(binding.validateSource('{}', context).result.kind).toBe('valid');
  const service = createBlockEditorService();
  const remove = registerSourceEditors({gui: {blockEditors: service.api}}, [{
   apiVersion: 1, extensionId: 'test', editorId: 'required-name', opcodes: ['test_parse'],
   bindings: [binding], validationContext: () => context
  }]);
  let commits = 0;
  const snapshot: BlockSnapshot = {targetId: 'sprite', blockId: 'block', opcode: 'test_parse', revision: '1',
   arguments: {TEXT: {kind: 'literal', value: '{"name":"original"}'}}};
  const session = service.registry.open(snapshot, {readBlock: () => snapshot, commit: () => {commits++;}})!;
  session.setDraft({sources: {TEXT: {mode: 'source', source: '{}', sourceEdited: true}}});
  expect((await session.save()).status).toBe('invalid');
  expect(commits).toBe(0);
  session.setDraft({sources: {TEXT: {mode: 'source', source: '{"name":"updated"}', sourceEdited: true}}});
  expect(await session.save()).toEqual({status: 'saved', changed: true});
  expect(commits).toBe(1);
  session.dispose();remove();
 });

 it('rejects malformed owner contexts without invoking their accessors', () => {
  let reads = 0;
  const invalid = Object.defineProperty({...context}, 'consumerId', {get() {reads++;throw Error('private-context');}});
  for (const value of [invalid, null, undefined, {...context, nowMs: NaN}]) {
   const result = sourceEditorDefinitions[0]!.bindings[0]!.validateSource('{}', value as never);
   expect(result.result.kind).toBe('execution-error');
   expect(JSON.stringify(result.result)).not.toContain('private-context');
  }
  expect(reads).toBe(0);
 });

 function fixture() {
  const definition = sourceEditorDefinitions[0]!;
  const input: Record<string, string> = {TEXT: '{ "keep":[1,1], "value":1 }'};
  const service = createBlockEditorService();
  const remove = registerSourceEditors({gui: {blockEditors: service.api}}, [definition]);
  const reference = {targetId: 'sprite', blockId: 'block'};
  const snapshot: BlockSnapshot = {...reference, opcode: definition.opcodes[0]!, revision: '1',
   arguments: Object.fromEntries(Object.entries(input).map(([argument, value]) => [argument, {kind: 'literal' as const, value}]))};
  const commits: (readonly LiteralArgumentChange[])[] = [];
  const host: BlockEditorHost = {readBlock: () => snapshot, commit: request => {commits.push(request.changes);}};
  return {session: service.registry.open(reference, host)!, commits, input, definition, remove};
 }
 it('registers every target opcode with the actual prepared service', () => {
  const service = createBlockEditorService();
  const remove = registerSourceEditors({gui: {blockEditors: service.api}}, sourceEditorDefinitions);
  for (const definition of sourceEditorDefinitions) for (const opcode of definition.opcodes) {
   expect(service.registry.resolve(opcode)?.editableArguments).toEqual(definition.bindings.map(binding => binding.argument));
  }
  remove();
  for (const definition of sourceEditorDefinitions) for (const opcode of definition.opcodes) expect(service.registry.resolve(opcode)).toBeUndefined();
  const removeAgain = registerSourceEditors({gui: {blockEditors: service.api}}, sourceEditorDefinitions);
  for (const definition of sourceEditorDefinitions) for (const opcode of definition.opcodes) expect(service.registry.resolve(opcode)).toBeDefined();
  removeAgain();
 });
 it('keeps exact no-op bytes without an undo transaction', async () => {
  const {session, commits, remove} = fixture();
  expect(await session.save()).toEqual({status: 'saved', changed: false});
  expect(commits).toEqual([]);
  remove();
 });
 it('edits one value without normalizing untouched source and commits once', async () => {
  const {session, commits, input, definition, remove} = fixture();
  const draft = session.getDraft();
  const entries = draft.sources as JsonObject;
  const argument = definition.bindings[0]!.argument;
  const entry = entries[argument] as JsonObject;
  (entry.data as JsonObject).value = 2;
  session.setDraft(draft);
  expect(await session.save()).toEqual({status: 'saved', changed: true});
  expect(commits.length).toBe(1);
  expect(commits[0]!.length).toBe(1);
  const source = commits[0]![0]!.value as string;
  expect(source).toContain('"keep":[1,1]');
  if (definition.bindings.length === 2) {
   expect(source).toContain('"method":" get "');
   expect(commits[0]!.some(change => change.argument === 'AUTH')).toBe(false);
   expect(input.AUTH).toContain('"providers":["github"]');
  }
  remove();
 });
 it('rejects invalid raw source before committing any bound input', async () => {
  const {session, commits, definition, remove} = fixture();
  const draft = session.getDraft();
  const entries = draft.sources as JsonObject;
  entries[definition.bindings[0]!.argument] = {mode: 'source', source: '{'};
  session.setDraft(draft);
  expect((await session.save()).status).toBe('invalid');
  expect(commits).toEqual([]);
  remove();
 });
});
