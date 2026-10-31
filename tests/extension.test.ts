import {createSourceDocumentRegistry} from '@kubohiroya/turbowarp-document-data/composition';
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

  it('reads the default-off document source flag only when constructing the extension', () => {
    const documents = createSourceDocumentRegistry();
    const off = new StructuredDataExtension(Scratch, true);
    vi.stubGlobal('STRUCTURED_DOCUMENT_SOURCE', true);
    expect(() => off.createSourceProjection(documents)).toThrow();
    const on = new StructuredDataExtension(Scratch, true);
    vi.stubGlobal('STRUCTURED_DOCUMENT_SOURCE', false);
    expect(() => on.createSourceProjection(documents)).not.toThrow();
  });

  it('projects source explicitly into runtime bindings and clears values, not source, on stop', () => {
    const extension = new StructuredDataExtension(Scratch, true, false, false, true);
    const util = utility();
    let source = '# preserved\na: 1\n';
    const documents = createSourceDocumentRegistry();
    documents.register({id: 'documents', list: () => [{documentId: 'story', filename: 'story.yml', format: 'yaml'}], open: () => ({
      inspect: () => ({available: true}), capture: () => ({source}),
      prepare: async () => {throw new Error('must not write');}, commit: async () => {throw new Error('must not write');}, dispose() {}
    })});
    const projection = extension.createSourceProjection(documents);
    const reference = {providerId: 'documents', documentId: 'story'};
    projection.project(util.target, 'projected', reference);
    expect(extension.toJson({NAME: 'projected'}, util)).toBe('{"a":1}');
    source = 'a: [';
    expect(() => projection.project(util.target, 'projected', reference)).toThrow();
    expect(extension.toJson({NAME: 'projected'}, util)).toBe('{"a":1}');
    const on = Scratch.vm?.runtime?.on as ReturnType<typeof vi.fn>;
    for (const [event, listener] of on.mock.calls) if (event === 'PROJECT_STOP_ALL') (listener as () => void)();
    expect(extension.hasStructuredData({NAME: 'projected'}, util)).toBe(false);
    expect(projection.get(util.target, 'projected')).toBeUndefined();
    expect(source).toBe('a: [');
    for (const [event, listener] of on.mock.calls) if (event === 'RUNTIME_DISPOSED') (listener as () => void)();
    source = '# reloaded\na: 2\n';
    for (const [event, listener] of on.mock.calls) if (event === 'PROJECT_LOADED') (listener as () => void)();
    projection.project(util.target, 'projected', reference);
    expect(extension.toJson({NAME: 'projected'}, util)).toBe('{"a":2}');
  });

  it('registers the integrated namespace, codec, path, and loop blocks', () => {
    expect((new StructuredDataExtension(Scratch, false).getInfo() as {blocks: unknown[]}).blocks).toEqual([]);
    const info = new StructuredDataExtension(Scratch, true).getInfo() as {
      name: string;
      blocks: Array<{opcode: string}>;
    };
    expect(info.name).toBe('Structured Data');
    expect(info.blocks.map((block) => block.opcode)).toEqual([
      'parseJson', 'parseYaml', 'toJson', 'toYaml', 'hasStructuredData',
      'deleteStructuredData', 'getJsonAtPath', 'getTextAtPath', 'hasPath', 'setJsonAtPath',
      'deleteAtPath', 'keysAtPath', 'lengthAtPath', 'forEachAtPath',
      'currentKey', 'currentIndex', 'currentValueJson', 'currentJsonAtPath', 'currentTextAtPath'
    ]);
  });

  it('parses JSON and YAML into a target-local named namespace', () => {
    const extension = new StructuredDataExtension(Scratch, true);
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
    const extension = new StructuredDataExtension(Scratch, true);
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
    const extension = new StructuredDataExtension(Scratch, true);
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
    const extension = new StructuredDataExtension(Scratch, true);
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

  it('reads text at a path without JSON quotes and refuses values without a text form', () => {
    const extension = new StructuredDataExtension(Scratch, true);
    const util = utility();
    extension.parseJson({
      TEXT: '{"name":"Apple","quoted":"say \\"hi\\"","empty":"","count":1.50,"ok":true,' +
        '"none":null,"list":[1],"nested":{"a":1}}',
      NAME: 'data'
    }, util);
    const text = (path: string) => extension.getTextAtPath({NAME: 'data', PATH: path}, util);

    expect(extension.getJsonAtPath({NAME: 'data', PATH: '$.name'}, util)).toBe('"Apple"');
    expect(text('$.name')).toBe('Apple');
    expect(text('$.quoted')).toBe('say "hi"');
    expect(text('$.empty')).toBe('');
    expect(text('$.count')).toBe('1.5');
    expect(text('$.ok')).toBe('true');
    expect(text('$.list[0]')).toBe('1');
    for (const path of ['$.none', '$.list', '$.nested', '$']) {
      expect(() => text(path), path).toThrowError(expect.objectContaining({code: 'TYPE_MISMATCH'}));
    }
    for (const [path, code] of [
      ['$..name', 'INVALID_PATH'],
      ['$.missing', 'PATH_NOT_FOUND'],
      ['$.name.first', 'TYPE_MISMATCH'],
      ['$.list[1]', 'INDEX_OUT_OF_RANGE']
    ] as const) {
      expect(() => text(path), path).toThrowError(expect.objectContaining({code}));
    }
    expect(() => extension.getTextAtPath({NAME: 'missing', PATH: '$'}, util)).toThrowError(
      expect.objectContaining({code: 'DATA_NOT_FOUND'})
    );
    expect(() => extension.getTextAtPath({NAME: ' ', PATH: '$'}, util)).toThrowError(
      expect.objectContaining({code: 'INVALID_NAME'})
    );
  });

  it('reads paths inside the current iteration value as JSON and as text', () => {
    const extension = new StructuredDataExtension(Scratch, true);
    const util = utility();
    extension.parseJson({
      TEXT: '[{"type":"heading","depth":1,"done":false,"meta":null,"tags":["a"]},' +
        '{"type":"paragraph","depth":2}]',
      NAME: 'blocks'
    }, util);
    const json = (path: string) => extension.currentJsonAtPath({PATH: path}, util);
    const text = (path: string) => extension.currentTextAtPath({PATH: path}, util);

    extension.forEachAtPath({NAME: 'blocks', PATH: '$', MAX: 10}, util);
    expect(json('$')).toBe(extension.currentValueJson({}, util));
    expect(json('$')).toBe('{"depth":1,"done":false,"meta":null,"tags":["a"],"type":"heading"}');
    expect(json('$.type')).toBe('"heading"');
    expect(json('$.meta')).toBe('null');
    expect(json('$.tags')).toBe('["a"]');
    expect(text('$.type')).toBe('heading');
    expect(text('$.depth')).toBe('1');
    expect(text('$.done')).toBe('false');
    expect(text('$.tags[0]')).toBe('a');
    for (const path of ['$', '$.meta', '$.tags']) {
      expect(() => text(path), path).toThrowError(expect.objectContaining({code: 'TYPE_MISMATCH'}));
    }
    for (const read of [json, text]) {
      for (const [path, code] of [
        ['type', 'INVALID_PATH'],
        ['$.missing', 'PATH_NOT_FOUND'],
        ['$.type.name', 'TYPE_MISMATCH'],
        ['$.tags[1]', 'INDEX_OUT_OF_RANGE']
      ] as const) {
        expect(() => read(path), path).toThrowError(expect.objectContaining({code}));
      }
    }

    extension.forEachAtPath({NAME: 'blocks', PATH: '$', MAX: 10}, util);
    expect(text('$.type')).toBe('paragraph');
    expect(json('$')).toBe('{"depth":2,"type":"paragraph"}');
    expect(() => json('$.tags')).toThrowError(expect.objectContaining({code: 'PATH_NOT_FOUND'}));
  });

  it('turns a key list into plain strings for text-keyed lookups', () => {
    const extension = new StructuredDataExtension(Scratch, true);
    const util = utility();
    extension.parseJson({TEXT: '["apple","banana"]', NAME: 'keys'}, util);
    const texts: string[] = [];
    const jsons: string[] = [];
    for (let step = 0; step < 3; step += 1) {
      extension.forEachAtPath({NAME: 'keys', PATH: '$', MAX: 10}, util);
      if (step === 2) break;
      texts.push(extension.currentTextAtPath({PATH: '$'}, util));
      jsons.push(extension.currentValueJson({}, util));
    }

    expect(texts).toEqual(['apple', 'banana']);
    expect(jsons).toEqual(['"apple"', '"banana"']);
  });

  it('reads the innermost entry in nested loops and requires an active iteration', () => {
    const extension = new StructuredDataExtension(Scratch, true);
    const target = {};
    const thread = {};
    const outer = utility(target, thread);
    const inner = utility(target, thread);
    extension.parseJson({
      TEXT: '{"groups":[{"name":"fruit","items":["apple","banana"]}]}',
      NAME: 'data'
    }, outer);
    const outsideIteration = expect.objectContaining({code: 'ITERATION_CONTEXT_REQUIRED'});

    // The loop context is checked first, so even an invalid path reports the missing iteration.
    for (const path of ['$', '$.name', '$..bad']) {
      expect(() => extension.currentJsonAtPath({PATH: path}, outer)).toThrowError(outsideIteration);
      expect(() => extension.currentTextAtPath({PATH: path}, outer)).toThrowError(outsideIteration);
    }

    extension.forEachAtPath({NAME: 'data', PATH: '$.groups', MAX: 10}, outer);
    expect(extension.currentTextAtPath({PATH: '$.name'}, outer)).toBe('fruit');
    extension.forEachAtPath({NAME: 'data', PATH: '$.groups[0].items', MAX: 10}, inner);
    expect(extension.currentTextAtPath({PATH: '$'}, inner)).toBe('apple');
    expect(extension.currentJsonAtPath({PATH: '$'}, inner)).toBe('"apple"');
    expect(() => extension.currentTextAtPath({PATH: '$.name'}, inner)).toThrowError(
      expect.objectContaining({code: 'TYPE_MISMATCH'})
    );
    expect(() => extension.currentTextAtPath({PATH: '$'}, {...inner, thread: {}})).toThrowError(
      outsideIteration
    );
    extension.forEachAtPath({NAME: 'data', PATH: '$.groups[0].items', MAX: 10}, inner);
    expect(extension.currentTextAtPath({PATH: '$'}, inner)).toBe('banana');
    extension.forEachAtPath({NAME: 'data', PATH: '$.groups[0].items', MAX: 10}, inner);
    expect(extension.currentTextAtPath({PATH: '$.name'}, outer)).toBe('fruit');

    extension.forEachAtPath({NAME: 'data', PATH: '$.groups', MAX: 10}, outer);
    expect(() => extension.currentJsonAtPath({PATH: '$'}, outer)).toThrowError(outsideIteration);
    expect(() => extension.currentTextAtPath({PATH: '$'}, outer)).toThrowError(outsideIteration);
  });

  it('reports invalid names, missing data, unsafe YAML, and iteration overflow', () => {
    const extension = new StructuredDataExtension(Scratch, true);
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
