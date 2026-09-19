import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {StructuredDataExtension} from '../src/extension.js';
import {StructuredDataError} from '../src/core.js';
import {extensionConfig, isStructuredDataMvpEnabled} from '../src/config.js';

beforeEach(() => {
  vi.stubGlobal('Scratch', {
    BlockType: {COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'boolean', LOOP: 'loop'},
    ArgumentType: {STRING: 'string', NUMBER: 'number'},
    Cast: {toString: String, toNumber: Number},
    translate: (message: string | {default: string}) =>
      typeof message === 'string' ? message : message.default,
    vm: {runtime: {on: vi.fn()}}
  });
});

afterEach(() => vi.unstubAllGlobals());

function utility(target = {}, thread = {}) {
  return {target, thread, stackFrame: {} as Record<string, unknown>, startBranch: vi.fn()};
}

describe('StructuredDataExtension', () => {
  it('requires unsandboxed execution and keeps the feature flag off by default', () => {
    expect(extensionConfig.unsandboxed).toBe(true);
    expect(isStructuredDataMvpEnabled({})).toBe(false);
    expect(isStructuredDataMvpEnabled({STRUCTURED_DATA_MVP: true})).toBe(true);
  });

  it('registers the integrated namespace, codec, path, and loop blocks', () => {
    expect((new StructuredDataExtension(false).getInfo() as {blocks: unknown[]}).blocks).toEqual([]);
    const info = new StructuredDataExtension(true).getInfo() as {
      name: string;
      blocks: Array<{opcode: string}>;
    };
    expect(info.name).toBe('Structured Data');
    expect(info.blocks.map((block) => block.opcode)).toEqual([
      'parseJson', 'parseYaml', 'toJson', 'toYaml', 'hasStructuredData',
      'deleteStructuredData', 'getJsonAtPath', 'hasPath', 'setJsonAtPath',
      'deleteAtPath', 'keysAtPath', 'lengthAtPath', 'forEachAtPath',
      'currentKey', 'currentIndex', 'currentValueJson'
    ]);
  });

  it('parses JSON and YAML into a target-local named namespace', () => {
    const extension = new StructuredDataExtension(true);
    const targetA = {};
    const targetB = {};
    const utilA = utility(targetA);
    const utilB = utility(targetB);

    extension.parseJson({TEXT: '{"b":2,"a":1}', NAME: 'data'}, utilA);
    expect(extension.toJson({NAME: 'data'}, utilA)).toBe('{"a":1,"b":2}');
    expect(extension.toYaml({NAME: 'data'}, utilA)).toBe('a: 1\nb: 2');
    expect(extension.hasStructuredData({NAME: 'data'}, utilA)).toBe(true);
    expect(extension.hasStructuredData({NAME: 'data'}, utilB)).toBe(false);

    extension.parseYaml({TEXT: 'name: sensor\nreadings:\n  - 21\n  - 22', NAME: 'yaml'}, utilA);
    expect(extension.toJson({NAME: 'yaml'}, utilA)).toBe(
      '{"name":"sensor","readings":[21,22]}'
    );
  });

  it('updates named data immutably and deletes paths and bindings', () => {
    const extension = new StructuredDataExtension(true);
    const util = utility();
    extension.parseJson({TEXT: '{"items":[1,2],"name":"old"}', NAME: 'data'}, util);
    extension.setJsonAtPath({NAME: 'data', PATH: '$.name', VALUE: '"new"'}, util);
    extension.deleteAtPath({NAME: 'data', PATH: '$.items[0]'}, util);
    expect(extension.toJson({NAME: 'data'}, util)).toBe('{"items":[2],"name":"new"}');
    expect(extension.getJsonAtPath({NAME: 'data', PATH: '$.name'}, util)).toBe('"new"');
    extension.deleteStructuredData({NAME: 'data'}, util);
    expect(extension.hasStructuredData({NAME: 'data'}, util)).toBe(false);
  });

  it('clears every namespace when the project stops', () => {
    const extension = new StructuredDataExtension(true);
    const util = utility();
    extension.parseJson({TEXT: '{}', NAME: 'data'}, util);
    const on = Scratch.vm?.runtime?.on as ReturnType<typeof vi.fn>;
    const stopListeners = on.mock.calls
      .filter(([event]) => event === 'PROJECT_STOP_ALL')
      .map(([, listener]) => listener as () => void);
    expect(stopListeners.length).toBeGreaterThan(0);
    for (const listener of stopListeners) listener();
    expect(extension.hasStructuredData({NAME: 'data'}, util)).toBe(false);
  });

  it('iterates deterministically and isolates context by thread', () => {
    const extension = new StructuredDataExtension(true);
    const target = {};
    const threadA = {};
    const util = utility(target, threadA);
    extension.parseJson({TEXT: '{"z":2,"a":1}', NAME: 'data'}, util);

    extension.forEachAtPath({NAME: 'data', PATH: '$', MAX: 2}, util);
    expect(extension.currentKey({}, util)).toBe('a');
    expect(extension.currentValueJson({}, util)).toBe('1');
    expect(() => extension.currentKey({}, {...util, thread: {}})).toThrowError(
      expect.objectContaining({code: 'ITERATION_CONTEXT_REQUIRED'})
    );
    extension.forEachAtPath({NAME: 'data', PATH: '$', MAX: 2}, util);
    expect(extension.currentKey({}, util)).toBe('z');
    extension.forEachAtPath({NAME: 'data', PATH: '$', MAX: 2}, util);
    expect(() => extension.currentKey({}, util)).toThrow(StructuredDataError);
  });

  it('reports invalid names, missing data, unsafe YAML, and iteration overflow', () => {
    const extension = new StructuredDataExtension(true);
    const util = utility();
    expect(() => extension.parseJson({TEXT: '{}', NAME: ' '}, util)).toThrowError(
      expect.objectContaining({code: 'INVALID_NAME'})
    );
    expect(() => extension.toJson({NAME: 'missing'}, util)).toThrowError(
      expect.objectContaining({code: 'DATA_NOT_FOUND'})
    );
    expect(() => extension.parseYaml({TEXT: 'base: &x [1]\ncopy: *x', NAME: 'bad'}, util)).toThrowError(
      expect.objectContaining({code: 'INVALID_YAML'})
    );
    extension.parseJson({TEXT: '[1,2]', NAME: 'data'}, util);
    expect(() => extension.forEachAtPath({NAME: 'data', PATH: '$', MAX: 1}, util)).toThrowError(
      expect.objectContaining({code: 'ITERATION_LIMIT_EXCEEDED'})
    );
  });
});
