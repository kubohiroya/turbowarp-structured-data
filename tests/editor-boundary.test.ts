import {execFileSync} from 'node:child_process';
import {cpSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import vm from 'node:vm';
import {expect, it} from 'vitest';
import packageMetadata from '../package.json';

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

it('imports packaged metadata with only yaml installed and without GUI globals', () => {
  const isolated = mkdtempSync(join(tmpdir(), 'structured-metadata-'));
  try {
    const installed = join(isolated, 'node_modules', packageMetadata.name);
    mkdirSync(installed, {recursive: true});
    cpSync(new URL('../package.json', import.meta.url), join(installed, 'package.json'));
    cpSync(new URL('../lib-editor', import.meta.url), join(installed, 'lib-editor'), {recursive: true});
    cpSync(realpathSync(new URL('../node_modules/yaml', import.meta.url)), join(isolated, 'node_modules/yaml'), {recursive: true});
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
