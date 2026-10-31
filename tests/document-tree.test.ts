import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {
  DocumentTreeError,
  documentTreeRegistrySymbol,
  getDocumentTreeRegistry,
  type DocumentTreeErrorCode,
  type DocumentTreeJSON,
  type NormalizedDocumentTreeCaptureOptions
} from '@kubohiroya/turbowarp-document-data/composition';
import {describe, expect, it, vi} from 'vitest';
import {StructuredDataExtension} from '../src/extension.js';
import {isStructuredDocumentTreeEnabled} from '../src/config.js';
import {DOCUMENT_TREE_LIMITS, mapDocumentTreeError} from '../src/document-tree.js';
import type {ScratchApi} from '../src/runtime-api.js';

type Tree = {[key: string]: DocumentTreeJSON};

const position = (line: number) => ({
  start: {line, column: 1, offset: 0},
  end: {line, column: 6, offset: 5}
});

/** A small mdast-like tree: a heading and a two-item list, every node with a position. */
const DOCUMENT: Tree = {
  type: 'root',
  position: position(1),
  children: [
    {type: 'heading', depth: 1, position: position(1), children: [{type: 'text', value: 'Fruit', position: position(1)}]},
    {
      type: 'list',
      position: position(3),
      children: [
        {type: 'listItem', position: position(3), children: [{type: 'text', value: 'Apple', position: position(3)}]},
        {type: 'listItem', position: position(4), children: [{type: 'text', value: 'Pear', position: position(4)}]}
      ]
    }
  ]
};

/** A host with its own VM object, so every test has its own shared registry; null means no VM. */
function host(vmScope: object | null = {runtime: {on: vi.fn()}}): ScratchApi {
  return {
    extensions: {unsandboxed: true, register() {}},
    BlockType: {COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'boolean', HAT: 'hat', LOOP: 'loop'},
    ArgumentType: {STRING: 'string', NUMBER: 'number', BOOLEAN: 'boolean'},
    Cast: {toString: String, toNumber: Number, toBoolean: Boolean},
    translate: ((message: string | {default: string}) =>
      typeof message === 'string' ? message : message.default) as ScratchApi['translate'],
    ...(vmScope === null ? {} : {vm: vmScope as NonNullable<ScratchApi['vm']>})
  };
}

function utility(target: object = {}, thread: object = {}) {
  return {target, thread, stackFrame: {} as Record<string, unknown>, startBranch: vi.fn()};
}

/** Copies like Document Data: positions only on request, counted against the given limits. */
function copyNode(node: DocumentTreeJSON, options: NormalizedDocumentTreeCaptureOptions): DocumentTreeJSON {
  let count = 0;
  const copy = (value: DocumentTreeJSON, depth: number): DocumentTreeJSON => {
    if (depth > options.limits.maxDepth || ++count > options.limits.maxNodes) {
      throw new DocumentTreeError('DOCUMENT_LIMIT_EXCEEDED', 'Too large.');
    }
    if (Array.isArray(value)) return value.map((item) => copy(item, depth + 1));
    if (typeof value !== 'object' || value === null) return value;
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => options.positions || key !== 'position')
        .map(([key, item]) => [key, copy(item, depth + 1)])
    );
  };
  return copy(node, 0);
}

/** A fake Document Data provider over per-target documents, resolving `$` and `$[i][j]`. */
function fakeProvider(documents: Map<object, Map<string, Tree>>) {
  const calls: Array<{name: string; options: NormalizedDocumentTreeCaptureOptions}> = [];
  return {
    calls,
    capture(target: object, name: string, options: NormalizedDocumentTreeCaptureOptions) {
      calls.push({name, options});
      const tree = documents.get(target)?.get(name.trim());
      if (!tree) throw new DocumentTreeError('DOCUMENT_NOT_FOUND', `Document does not exist: ${name}`);
      const location = options.location.trim();
      if (location !== '$' && !/^\$(?:\[\d+\])+$/u.test(location)) {
        throw new DocumentTreeError('INVALID_LOCATION', `Bad location: ${location}`);
      }
      let node: DocumentTreeJSON | undefined = tree;
      for (const [, index] of location.matchAll(/\[(\d+)\]/gu)) {
        const children: DocumentTreeJSON | undefined = (node as Tree).children;
        node = Array.isArray(children) ? children[Number(index)] : undefined;
        if (node === undefined) throw new DocumentTreeError('LOCATION_NOT_FOUND', `Missing: ${location}`);
      }
      return {kind: 'markdown' as const, revision: '1', root: copyNode(node, options) as Tree};
    }
  };
}

function setup(flags: {schema?: boolean} = {}) {
  const scratch = host();
  const extension = new StructuredDataExtension(scratch, true, false, flags.schema ?? false, false, true);
  const util = utility();
  const documents = new Map([[util.target, new Map([['page', DOCUMENT]])]]);
  const provider = fakeProvider(documents);
  const unregister = getDocumentTreeRegistry(scratch.vm as object).register(provider);
  const copy = (args: {DOCUMENT?: unknown; LOCATION?: unknown; POSITIONS?: unknown; NAME?: unknown} = {}, at = util) =>
    extension.copyDocumentTree(
      {DOCUMENT: 'page', LOCATION: '$', POSITIONS: 'without positions', NAME: 'tree', ...args},
      at
    );
  return {scratch, extension, util, documents, provider, unregister, copy};
}

const hasPosition = (value: unknown): boolean =>
  Array.isArray(value)
    ? value.some(hasPosition)
    : typeof value === 'object' && value !== null &&
      (Object.hasOwn(value, 'position') || Object.values(value).some(hasPosition));

describe('the document tree flag', () => {
  it('is read at startup, defaults off, and needs the MVP flag too', () => {
    expect(isStructuredDocumentTreeEnabled({})).toBe(false);
    expect(isStructuredDocumentTreeEnabled({STRUCTURED_DOCUMENT_TREE: true})).toBe(true);
    expect(isStructuredDocumentTreeEnabled({STRUCTURED_DOCUMENT_TREE: 'true'})).toBe(true);
    const info = (extension: StructuredDataExtension) =>
      extension.getInfo() as {blocks: Array<{opcode: string; arguments: Record<string, unknown>}>; menus: Record<string, unknown>};

    const off = info(new StructuredDataExtension(host(), true));
    expect(off.blocks.map((block) => block.opcode)).not.toContain('copyDocumentTree');
    expect(off.menus).toEqual({});
    expect(info(new StructuredDataExtension(host(), false, false, false, false, true)).blocks).toEqual([]);

    vi.stubGlobal('STRUCTURED_DOCUMENT_TREE', true);
    const fromGlobal = new StructuredDataExtension(host(), true);
    vi.unstubAllGlobals();
    const on = info(fromGlobal);
    expect(on.blocks.map((block) => block.opcode).slice(0, 4)).toEqual([
      'parseJson', 'parseYaml', 'copyDocumentTree', 'toJson'
    ]);
    expect(on.blocks[2]).toEqual({
      opcode: 'copyDocumentTree',
      blockType: 'command',
      text: 'copy document [DOCUMENT] at [LOCATION] [POSITIONS] as [NAME]',
      arguments: {
        DOCUMENT: {type: 'string', defaultValue: 'page'},
        LOCATION: {type: 'string', defaultValue: '$'},
        POSITIONS: {type: 'string', defaultValue: 'without positions', menu: 'documentTreePositions'},
        NAME: {type: 'string', defaultValue: 'tree'}
      }
    });
    expect(on.menus).toEqual({
      documentTreePositions: {acceptReporters: false, items: ['without positions', 'with positions']}
    });
  });

  it('fails a hidden block explicitly without reaching Document Data', () => {
    // [MVP, named data, schema, document source, document tree]: tree flag off, then MVP off.
    for (const flags of [
      [true, false, false, false, false],
      [false, false, false, false, true]
    ] as const) {
      const scope = {runtime: {on: vi.fn()}};
      const blocked = new StructuredDataExtension(host(scope), ...flags);
      expect(() =>
        blocked.copyDocumentTree({DOCUMENT: 'page', LOCATION: '$', POSITIONS: 'without positions', NAME: 'tree'}, utility())
      ).toThrowError(expect.objectContaining({code: 'DATA_NOT_FOUND'}));
      expect(Object.getOwnPropertySymbols(scope)).not.toContain(documentTreeRegistrySymbol);
    }
  });
});

describe('copy document', () => {
  it('copies the whole document without positions by default and with them on request', () => {
    const {extension, util, provider, copy} = setup();
    copy();
    const plain = JSON.parse(extension.toJson({NAME: 'tree'}, util)) as Tree;
    expect(hasPosition(plain)).toBe(false);
    expect(plain).toEqual(copyNode(DOCUMENT, {location: '$', positions: false, limits: DOCUMENT_TREE_LIMITS}));

    copy({POSITIONS: 'with positions', NAME: 'located'});
    expect(JSON.parse(extension.toJson({NAME: 'located'}, util))).toEqual(DOCUMENT);
    expect(extension.getTextAtPath({NAME: 'located', PATH: '$.children[1].position.start.line'}, util)).toBe('3');

    expect(provider.calls.map((call) => call.options)).toEqual([
      {location: '$', positions: false, limits: {maxDepth: 64, maxNodes: 50000}},
      {location: '$', positions: true, limits: {maxDepth: 64, maxNodes: 50000}}
    ]);
  });

  it('copies a subtree whose children line up with the document locations', () => {
    const {extension, util, copy} = setup();
    copy({LOCATION: '$[1]', NAME: 'list'});
    copy({LOCATION: '$[1][0]', NAME: 'item'});
    copy({NAME: 'whole'});

    expect(extension.getTextAtPath({NAME: 'list', PATH: '$.type'}, util)).toBe('list');
    // `$.children[i]` of a copy taken at L is the Document Data location L[i].
    expect(extension.getJsonAtPath({NAME: 'list', PATH: '$.children[0]'}, util)).toBe(
      extension.toJson({NAME: 'item'}, util)
    );
    expect(extension.getJsonAtPath({NAME: 'whole', PATH: '$.children[1].children[0]'}, util)).toBe(
      extension.toJson({NAME: 'item'}, util)
    );
  });

  it('stores a value that path, loop, and text reporters read like parsed JSON', () => {
    const {extension, util, copy} = setup();
    copy();
    const types: string[] = [];
    const words: string[] = [];
    for (let step = 0; step < 3; step += 1) {
      extension.forEachAtPath({NAME: 'tree', PATH: '$.children', MAX: 100}, util);
      if (step === 2) break;
      types.push(extension.currentTextAtPath({PATH: '$.type'}, util));
      words.push(extension.currentJsonAtPath({PATH: '$.children[0].type'}, util));
    }

    expect(types).toEqual(['heading', 'list']);
    expect(words).toEqual(['"text"', '"listItem"']);
    expect(extension.lengthAtPath({NAME: 'tree', PATH: '$.children[1].children'}, util)).toBe(2);
    expect(extension.getTextAtPath({NAME: 'tree', PATH: '$.children[0].children[0].value'}, util)).toBe('Fruit');
  });

  it('binds like parse JSON: per target, replacing the name, dropping a schema, cleared on stop', () => {
    const {scratch, extension, util, documents, copy} = setup({schema: true});
    const other = utility();
    documents.set(other.target, new Map([['page', {type: 'root', children: []}]]));

    extension.defineSchema({SCHEMA_ID: 'note', VERSION: '1.0.0', TEXT: '{"type":"object"}'}, util);
    extension.parseJsonWithSchema({TEXT: '{"a":1}', NAME: 'tree', SCHEMA_ID: 'note', VERSION: '1.0.0'}, util);
    copy();
    copy({}, other);

    expect(extension.schemaOf({NAME: 'tree'}, util)).toBe('{}');
    expect(extension.getTextAtPath({NAME: 'tree', PATH: '$.children[0].type'}, util)).toBe('heading');
    expect(extension.toJson({NAME: 'tree'}, other)).toBe('{"children":[],"type":"root"}');

    const on = scratch.vm?.runtime?.on as ReturnType<typeof vi.fn>;
    for (const [event, listener] of on.mock.calls) if (event === 'PROJECT_STOP_ALL') (listener as () => void)();
    expect(extension.hasStructuredData({NAME: 'tree'}, util)).toBe(false);
  });

  it('works when structured-data creates the shared registry before Document Data registers', () => {
    const scratch = host();
    const extension = new StructuredDataExtension(scratch, true, false, false, false, true);
    const util = utility();
    const copy = () =>
      extension.copyDocumentTree({DOCUMENT: 'page', LOCATION: '$', POSITIONS: 'without positions', NAME: 'tree'}, util);

    expect(copy).toThrowError(expect.objectContaining({
      code: 'DATA_NOT_FOUND',
      details: {documentName: 'page', location: '$', originalCode: 'DOCUMENT_TREE_UNAVAILABLE'}
    }));
    expect(Object.getOwnPropertySymbols(scratch.vm)).toContain(documentTreeRegistrySymbol);

    const unregister = getDocumentTreeRegistry(scratch.vm as object).register(
      fakeProvider(new Map([[util.target, new Map([['page', DOCUMENT]])]]))
    );
    copy();
    expect(extension.getTextAtPath({NAME: 'tree', PATH: '$.type'}, util)).toBe('root');

    unregister();
    expect(copy).toThrowError(expect.objectContaining({details: expect.objectContaining({originalCode: 'DOCUMENT_TREE_UNAVAILABLE'})}));
  });
});

describe('copy document errors', () => {
  it.each<[string, DocumentTreeErrorCode, string, () => {copy: () => void; read: () => string}]>([
    ['no provider', 'DOCUMENT_TREE_UNAVAILABLE', 'DATA_NOT_FOUND', () => {
      const s = setup();
      s.unregister();
      return {copy: () => s.copy(), read: () => s.extension.toJson({NAME: 'tree'}, s.util)};
    }],
    ['a missing document', 'DOCUMENT_NOT_FOUND', 'DATA_NOT_FOUND', () => {
      const s = setup();
      return {copy: () => s.copy({DOCUMENT: 'missing'}), read: () => s.extension.toJson({NAME: 'tree'}, s.util)};
    }],
    ['an invalid location', 'INVALID_LOCATION', 'INVALID_PATH', () => {
      const s = setup();
      return {copy: () => s.copy({LOCATION: '$.children'}), read: () => s.extension.toJson({NAME: 'tree'}, s.util)};
    }],
    ['a missing location', 'LOCATION_NOT_FOUND', 'PATH_NOT_FOUND', () => {
      const s = setup();
      return {copy: () => s.copy({LOCATION: '$[9]'}), read: () => s.extension.toJson({NAME: 'tree'}, s.util)};
    }],
    ['a tree over the limits', 'DOCUMENT_LIMIT_EXCEEDED', 'PARSE_LIMIT_EXCEEDED', () => {
      const s = setup();
      s.documents.get(s.util.target)?.set('page', deepTree(40));
      return {copy: () => s.copy(), read: () => s.extension.toJson({NAME: 'tree'}, s.util)};
    }],
    ['an invalid provider answer', 'DOCUMENT_TREE_PROVIDER_INVALID', 'DATA_NOT_FOUND', () => {
      const s = setup();
      getDocumentTreeRegistry(s.scratch.vm as object).register({
        capture: () => ({kind: 'markdown', revision: '1', root: [] as unknown as Tree})
      });
      return {copy: () => s.copy(), read: () => s.extension.toJson({NAME: 'tree'}, s.util)};
    }],
    ['no VM scope', 'REGISTRY_SCOPE_INVALID', 'DATA_NOT_FOUND', () => {
      const extension = new StructuredDataExtension(host(null), true, false, false, false, true);
      const util = utility();
      return {
        copy: () => extension.copyDocumentTree({DOCUMENT: 'page', LOCATION: '$', POSITIONS: 'without positions', NAME: 'tree'}, util),
        read: () => extension.toJson({NAME: 'tree'}, util)
      };
    }],
    ['an incompatible registry', 'REGISTRY_INCOMPATIBLE', 'DATA_NOT_FOUND', () => {
      const scope = {runtime: {on: vi.fn()}};
      Object.defineProperty(scope, documentTreeRegistrySymbol, {value: {apiVersion: 2}});
      const extension = new StructuredDataExtension(host(scope), true, false, false, false, true);
      const util = utility();
      return {
        copy: () => extension.copyDocumentTree({DOCUMENT: 'page', LOCATION: '$', POSITIONS: 'without positions', NAME: 'tree'}, util),
        read: () => extension.toJson({NAME: 'tree'}, util)
      };
    }]
  ])('maps %s (%s) to %s and keeps the old value', (_label, originalCode, code, arrange) => {
    const {copy, read} = arrange();
    const before = (() => {
      try {
        return read();
      } catch {
        return undefined;
      }
    })();
    let thrown: unknown;
    try {
      copy();
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toMatchObject({
      name: 'StructuredDataError',
      code,
      details: {documentName: expect.any(String), location: expect.any(String), originalCode}
    });
    if (before === undefined) expect(read).toThrowError(expect.objectContaining({code: 'DATA_NOT_FOUND'}));
    else expect(read()).toBe(before);
  });

  it('keeps an existing value when a copy fails', () => {
    const {extension, util, documents, copy} = setup();
    extension.parseJson({TEXT: '{"kept":true}', NAME: 'tree'}, util);
    documents.get(util.target)?.set('deep', deepTree(40));
    for (const args of [{DOCUMENT: 'missing'}, {LOCATION: 'p.lead'}, {LOCATION: '$[7]'}, {DOCUMENT: 'deep'}, {POSITIONS: 'sometimes'}, {DOCUMENT: ' '}]) {
      expect(() => copy(args)).toThrow();
      expect(extension.toJson({NAME: 'tree'}, util)).toBe('{"kept":true}');
    }
    expect(() => copy({DOCUMENT: 'missing'})).toThrowError(expect.objectContaining({
      details: {documentName: 'missing', location: '$', originalCode: 'DOCUMENT_NOT_FOUND'}
    }));
  });

  it('rejects blank names and unknown position choices before asking Document Data', () => {
    const {provider, copy} = setup();
    expect(() => copy({NAME: ' '})).toThrowError(expect.objectContaining({code: 'INVALID_NAME'}));
    expect(() => copy({DOCUMENT: '  '})).toThrowError(expect.objectContaining({code: 'INVALID_NAME'}));
    for (const positions of ['', 'true', true, 1, 'With positions', ' with positions', undefined]) {
      expect(() => copy({POSITIONS: positions}), String(positions)).toThrowError(
        expect.objectContaining({code: 'TYPE_MISMATCH'})
      );
    }
    expect(provider.calls).toEqual([]);
  });

  it('checks a provider answer itself, so limits and plain JSON hold for any provider', () => {
    const {scratch, extension, util, copy} = setup();
    extension.parseJson({TEXT: '"kept"', NAME: 'tree'}, util);
    const answer = (root: unknown) =>
      getDocumentTreeRegistry(scratch.vm as object).register({
        capture: () => ({kind: 'html', revision: '1', root: root as Tree})
      });
    for (const [root, code, originalCode] of [
      [deepTree(40), 'PARSE_LIMIT_EXCEEDED', 'DOCUMENT_LIMIT_EXCEEDED'],
      [{children: Array.from({length: DOCUMENT_TREE_LIMITS.maxNodes}, () => 0)}, 'PARSE_LIMIT_EXCEEDED', 'DOCUMENT_LIMIT_EXCEEDED'],
      [{value: Number.NaN}, 'DATA_NOT_FOUND', 'DOCUMENT_TREE_PROVIDER_INVALID'],
      [{children: [undefined]}, 'DATA_NOT_FOUND', 'DOCUMENT_TREE_PROVIDER_INVALID'],
      [{run: () => 1}, 'DATA_NOT_FOUND', 'DOCUMENT_TREE_PROVIDER_INVALID']
    ] as const) {
      const unregister = answer(root);
      expect(() => copy()).toThrowError(expect.objectContaining({code, details: expect.objectContaining({originalCode})}));
      unregister();
      expect(extension.toJson({NAME: 'tree'}, util)).toBe('"kept"');
    }
    // Exactly at the limits is accepted, as `parse JSON` accepts it.
    const unregister = answer({children: Array.from({length: DOCUMENT_TREE_LIMITS.maxNodes - 2}, () => 0)});
    copy();
    unregister();
    expect(extension.lengthAtPath({NAME: 'tree', PATH: '$.children'}, util)).toBe(DOCUMENT_TREE_LIMITS.maxNodes - 2);
  });

  it('owns a plain copy of the answer, whatever objects the provider used', () => {
    const {scratch, extension, util, copy} = setup();
    class Node {
      public constructor(public readonly type: string) {}
    }
    const bare = Object.create(null) as Tree;
    bare.value = 'bare';
    const root: Tree = {type: 'root', children: [new Node('custom') as unknown as Tree, bare]};
    Object.defineProperty(root, '__proto__', {value: 'data', enumerable: true, configurable: true, writable: true});
    getDocumentTreeRegistry(scratch.vm as object).register({capture: () => ({kind: 'html', revision: '1', root})});
    copy();
    (root.children as Tree[]).push({type: 'late'});
    bare.value = 'changed';

    expect(extension.toJson({NAME: 'tree'}, util)).toBe(
      '{"__proto__":"data","children":[{"type":"custom"},{"value":"bare"}],"type":"root"}'
    );

    const cyclic: Tree = {type: 'root'};
    cyclic.self = cyclic;
    getDocumentTreeRegistry(scratch.vm as object).register({capture: () => ({kind: 'html', revision: '1', root: cyclic})});
    expect(() => copy()).toThrowError(expect.objectContaining({code: 'PARSE_LIMIT_EXCEEDED'}));
  });

  it('leaves errors that are not Document Data failures untouched', () => {
    const {scratch, copy} = setup();
    const failure = new TypeError('provider bug');
    getDocumentTreeRegistry(scratch.vm as object).register({capture: () => {throw failure;}});
    expect(() => copy()).toThrow(failure);
  });

  it('never produces DOCUMENT_TREE_OPTIONS_INVALID, which would mean a bug in this block', () => {
    // The mapping itself refuses to turn it into a user-facing code.
    const optionsInvalid = new DocumentTreeError('DOCUMENT_TREE_OPTIONS_INVALID', 'bug');
    expect(mapDocumentTreeError(optionsInvalid, {documentName: 'page'})).toBe(optionsInvalid);

    // Whatever a saved project passes, the options reaching the real registry validate.
    const {provider, copy} = setup();
    const odd = [undefined, null, 0, 1.5, true, {}, [], '', ' ', '$', '$[0]', 'h1', '#id', '.class', '\u0000'];
    for (const documentName of ['page', 0, 'missing']) {
      for (const location of odd) {
        for (const positions of ['without positions', 'with positions']) {
          try {
            copy({DOCUMENT: documentName, LOCATION: location, POSITIONS: positions});
          } catch (error) {
            expect(error).toMatchObject({name: 'StructuredDataError'});
            expect(error).not.toMatchObject({details: {originalCode: 'DOCUMENT_TREE_OPTIONS_INVALID'}});
          }
        }
      }
    }
    expect(provider.calls.length).toBeGreaterThan(0);
    for (const {options} of provider.calls) {
      expect(typeof options.location).toBe('string');
      expect(typeof options.positions).toBe('boolean');
      expect(options.limits).toEqual({maxDepth: 64, maxNodes: 50000});
    }
  });
});

interface DocumentDataBlocks {
  parseMarkdown(args: unknown, util: unknown): void;
  parseHtml(args: unknown, util: unknown): void;
}

/** Loads a standalone extension bundle in its own realm, sharing the given host and its VM. */
function loadBundle<T>(source: string, scratch: ScratchApi, globals: Record<string, unknown>): T {
  let registered: T | undefined;
  // The Document Data browser bundle only needs `document` for HTML entity decoding while it loads.
  const document = {createElement() {
    let html = '';
    return {set innerHTML(value: string) {html = value;}, get textContent() {return html;}};
  }};
  vm.runInNewContext(
    source,
    {
      Scratch: {...scratch, extensions: {unsandboxed: true, register(instance: T) {registered = instance;}}},
      TextEncoder, TextDecoder, document, ...globals
    },
    {timeout: 10000}
  );
  if (registered === undefined) throw new Error('The bundle did not register an extension.');
  return registered;
}

const documentDataBundle = () =>
  readFileSync(createRequire(import.meta.url).resolve('@kubohiroya/turbowarp-document-data/extension'), 'utf8');

describe('copy document with the real Document Data extension', () => {
  it('copies a parsed Markdown document and reads it by path', () => {
    const scratch = host();
    const documentData = loadBundle<DocumentDataBlocks>(documentDataBundle(), scratch, {DOCUMENT_DATA_MVP: true});
    const extension = new StructuredDataExtension(scratch, true, false, false, false, true);
    const util = utility();

    documentData.parseMarkdown({TEXT: '# Fruit\n\n- Apple\n- Pear\n', NAME: 'doc'}, {target: util.target});
    extension.copyDocumentTree({DOCUMENT: 'doc', LOCATION: '$', POSITIONS: 'without positions', NAME: 'tree'}, util);
    extension.copyDocumentTree({DOCUMENT: 'doc', LOCATION: '$[1][0]', POSITIONS: 'with positions', NAME: 'apple'}, util);

    const types: string[] = [];
    for (let step = 0; step < 3; step += 1) {
      extension.forEachAtPath({NAME: 'tree', PATH: '$.children', MAX: 100}, util);
      if (step < 2) types.push(extension.currentTextAtPath({PATH: '$.type'}, util));
    }
    expect(types).toEqual(['heading', 'list']);
    expect(extension.getTextAtPath({NAME: 'tree', PATH: '$.children[0].children[0].value'}, util)).toBe('Fruit');
    expect(hasPosition(JSON.parse(extension.toJson({NAME: 'tree'}, util)))).toBe(false);
    expect(extension.getTextAtPath({NAME: 'apple', PATH: '$.type'}, util)).toBe('listItem');
    expect(extension.getTextAtPath({NAME: 'apple', PATH: '$.position.start.line'}, util)).toBe('3');

    documentData.parseHtml({TEXT: '<p class="lead">Hi</p>', NAME: 'html'}, {target: util.target});
    extension.copyDocumentTree({DOCUMENT: 'html', LOCATION: '.lead', POSITIONS: 'without positions', NAME: 'lead'}, util);
    expect(extension.getTextAtPath({NAME: 'lead', PATH: '$.tagName'}, util)).toBe('p');
    expect(() =>
      extension.copyDocumentTree({DOCUMENT: 'doc', LOCATION: '$[5]', POSITIONS: 'without positions', NAME: 'tree'}, util)
    ).toThrowError(expect.objectContaining({code: 'PATH_NOT_FOUND', details: expect.objectContaining({originalCode: 'LOCATION_NOT_FOUND'})}));
    expect(() =>
      extension.copyDocumentTree({DOCUMENT: 'nope', LOCATION: '$', POSITIONS: 'without positions', NAME: 'tree'}, util)
    ).toThrowError(expect.objectContaining({code: 'DATA_NOT_FOUND', details: expect.objectContaining({originalCode: 'DOCUMENT_NOT_FOUND'})}));
  });

  it('cooperates between the two standalone bundles in either load order', () => {
    interface StructuredBlocks {
      getInfo(): {blocks: Array<{opcode: string}>};
      copyDocumentTree(args: unknown, util: unknown): void;
      getTextAtPath(args: unknown, util: unknown): string;
    }
    const scratch = host();
    const structured = loadBundle<StructuredBlocks>(
      readFileSync(new URL('../dist/structured-data.js', import.meta.url), 'utf8'),
      scratch,
      {STRUCTURED_DATA_MVP: true, STRUCTURED_DOCUMENT_TREE: true}
    );
    const util = utility();
    const copy = () =>
      structured.copyDocumentTree({DOCUMENT: 'page', LOCATION: '$[0]', POSITIONS: 'with positions', NAME: 'heading'}, util);

    expect(structured.getInfo().blocks.map((block) => block.opcode)).toContain('copyDocumentTree');
    expect(copy).toThrowError(expect.objectContaining({code: 'DATA_NOT_FOUND'}));

    const documentData = loadBundle<DocumentDataBlocks>(documentDataBundle(), scratch, {DOCUMENT_DATA_MVP: true});
    documentData.parseMarkdown({TEXT: '## Pear\n', NAME: 'page'}, {target: util.target});
    copy();
    expect(structured.getTextAtPath({NAME: 'heading', PATH: '$.children[0].value'}, util)).toBe('Pear');
    expect(structured.getTextAtPath({NAME: 'heading', PATH: '$.depth'}, util)).toBe('2');
    expect(structured.getTextAtPath({NAME: 'heading', PATH: '$.position.end.offset'}, util)).toBe('7');
  });
});

/** Nested nodes; each level adds an object and a `children` array, so depth grows by two. */
function deepTree(levels: number): Tree {
  let node: Tree = {type: 'text', value: 'leaf'};
  for (let level = 0; level < levels; level += 1) node = {type: 'node', children: [node]};
  return node;
}
