import {execFileSync} from 'node:child_process';
import {cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, join} from 'node:path';
import {tmpdir} from 'node:os';
import vm from 'node:vm';
import {expect, it} from 'vitest';
import packageMetadata from '../package.json';

/** The blocks this file drives on the bundled extension instance. */
interface BundledBlocks {
  getInfo(args: unknown, util: unknown): {blocks: unknown[]};
  defineSchema(args: unknown, util: unknown): void;
  parseYamlWithSchema(args: unknown, util: unknown): void;
  setJsonAtPath(args: unknown, util: unknown): void;
  toJson(args: unknown, util: unknown): string;
  schemaOf(args: unknown, util: unknown): string;
}

it.each([false, true])('loads standalone playback without an editor engine, MVP=%s', enabled => {
  const source = readFileSync(new URL('../dist/structured-data.js', import.meta.url), 'utf8');
  expect(source).not.toMatch(/compileSchemaBundle|require_ajv|Ajv2020|ajv implementation error/u);
  let registrations = 0;
  const Scratch = {
    extensions: {unsandboxed: true, register() {registrations++;}},
    vm: {runtime: {on() {}, off() {}}}
  };
  vm.runInNewContext(source, {Scratch, TextEncoder, STRUCTURED_DATA_MVP: enabled}, {timeout: 5000});
  expect(registrations).toBe(1);
});

it('validates schema-bound values from the standalone bundle, without an editor engine', () => {
  const source = readFileSync(new URL('../dist/structured-data.js', import.meta.url), 'utf8');
  let extension: BundledBlocks | undefined;
  const Scratch = {
    extensions: {
      unsandboxed: true,
      register(instance: BundledBlocks) {
        extension = instance;
      }
    },
    BlockType: {COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'boolean', LOOP: 'loop'},
    ArgumentType: {STRING: 'string', NUMBER: 'number'},
    Cast: {toString: String, toNumber: Number},
    translate: (message: string | {default: string}) =>
      typeof message === 'string' ? message : message.default,
    vm: {runtime: {on() {}, off() {}}}
  };
  vm.runInNewContext(
    source,
    {Scratch, TextEncoder, TextDecoder, STRUCTURED_DATA_MVP: true, STRUCTURED_SCHEMA: true},
    {timeout: 5000}
  );
  if (!extension) throw new Error('The bundle must register an extension.');
  const blocks = extension;
  const util = {target: {}, thread: {}, stackFrame: {}, startBranch() {}};

  expect(blocks.getInfo({}, util).blocks).toHaveLength(28);
  blocks.defineSchema(
    {
      SCHEMA_ID: 'person',
      VERSION: '1.0.0',
      TEXT: '{"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}'
    },
    util
  );
  blocks.parseYamlWithSchema(
    {TEXT: 'name: Ada', NAME: 'data', SCHEMA_ID: 'person', VERSION: '1.0.0'},
    util
  );
  expect(blocks.toJson({NAME: 'data'}, util)).toBe('{"name":"Ada"}');
  expect(blocks.schemaOf({NAME: 'data'}, util)).toBe('{"id":"person","version":"1.0.0"}');
  expect(() =>
    blocks.setJsonAtPath({NAME: 'data', PATH: '$.name', VALUE: '42'}, util)
  ).toThrowError(expect.objectContaining({code: 'SCHEMA_VALIDATION_FAILED'}));
  expect(blocks.toJson({NAME: 'data'}, util)).toBe('{"name":"Ada"}');
});

it('imports packaged metadata with only yaml installed and without GUI globals', () => {
  const isolated = mkdtempSync(join(tmpdir(), 'structured-metadata-'));
  try {
    const installed = join(isolated, 'node_modules', packageMetadata.name);
    mkdirSync(installed, {recursive: true});
    cpSync(new URL('../package.json', import.meta.url), join(installed, 'package.json'));
    cpSync(new URL('../lib-editor', import.meta.url), join(installed, 'lib-editor'), {recursive: true});
    const codecRequire = createRequire(import.meta.resolve('@kubohiroya/turbowarp-yaml-json/codec'));
    cpSync(dirname(codecRequire.resolve('yaml/package.json')), join(isolated, 'node_modules/yaml'), {recursive: true});
    const script = `
      for (const name of ['window', 'document', 'Scratch']) Object.defineProperty(globalThis, name, {
        get() { throw Error('Unexpected GUI access: ' + name); }
      });
      const metadata = await import('${packageMetadata.name}/editor-metadata');
      if (metadata.sourceEditorDefinitions.length !== 3 || metadata.fixedInputEditorDefinitions.length !== 1) throw Error('Missing metadata');
      const binding = metadata.sourceEditorDefinitions[0].bindings[0];
      if (binding.validateSource('{"a":1}', {consumerId: 'isolated', nowMs: 0, settings: null}).result.kind !== 'valid') throw Error('Owner validation failed');
      metadata.registerSourceEditors({}, metadata.sourceEditorDefinitions)();
      metadata.registerFixedInputEditors({}, metadata.fixedInputEditorDefinitions)();
      console.log('isolated metadata passed');
    `;
    expect(execFileSync(process.execPath, ['--input-type=module', '--eval', script], {cwd: isolated, encoding: 'utf8'})).toContain('isolated metadata passed');
  } finally {
    rmSync(isolated, {recursive: true, force: true});
  }
});

it('keeps the editor package as a development dependency', () => {
  expect(packageMetadata.dependencies).not.toHaveProperty('@kubohiroya/turbowarp-extension-data-editor');
  expect(packageMetadata.devDependencies).toHaveProperty('@kubohiroya/turbowarp-extension-data-editor');
});
