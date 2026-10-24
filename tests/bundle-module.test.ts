import {afterEach, expect, it, vi} from 'vitest';

function makeHost(label = '') {
  const listeners = new Map<string, Set<() => void>>();
  const sourceCleanups: (() => void)[] = [], fixedCleanups: (() => void)[] = [];
  const source = vi.fn(() => {const remove = vi.fn(); sourceCleanups.push(remove); return remove;});
  const fixed = vi.fn(() => {const remove = vi.fn(); fixedCleanups.push(remove); return remove;});
  const port = {createScene: vi.fn(async () => {}), createNode: vi.fn(), addClass: vi.fn(), setData: vi.fn(), setAttribute: vi.fn()};
  const runtime = {
    turbowarpAFrameCapability: port,
    on: vi.fn((event: string, listener: () => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(listener);
    }),
    off: vi.fn((event: string, listener: () => void) => {listeners.get(event)?.delete(listener);})
  };
  const scratch = {
    extensions: {unsandboxed: true, register: vi.fn((extension: unknown) => {void extension;})},
    BlockType: {COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'boolean', HAT: 'hat', LOOP: 'loop'},
    ArgumentType: {STRING: 'string', NUMBER: 'number', BOOLEAN: 'boolean'},
    Cast: {toString: vi.fn(String), toNumber: Number, toBoolean: Boolean},
    translate: (message: string | {default: string}) => label + (typeof message === 'string' ? message : message.default),
    gui: {blockEditors: {apiVersion: 1, registerSourceEditor: source, registerFixedInputEditor: fixed}},
    vm: {runtime}
  };
  return {scratch, port, source, fixed, sourceCleanups, fixedCleanups, listeners,
    emit(event: string) {for (const listener of [...listeners.get(event) ?? []]) listener();}};
}

function forbidHostGlobals() {
  for (const name of ['Scratch', 'window', 'document']) {
    vi.stubGlobal(name, undefined);
    Object.defineProperty(globalThis, name, {configurable: true, get() {throw new Error('Unexpected global: ' + name);}});
  }
}

afterEach(() => vi.unstubAllGlobals());

it('imports without host access, instance creation or registration', async () => {
  vi.resetModules(); forbidHostGlobals();
  const h = makeHost();
  const module = await import('../src/bundle-module.js');
  expect(module.bundleModuleMetadata).toEqual({formatVersion: 1, id: 'kubohiroyastructureddata', unsandboxed: 'required'});
  expect(Object.isFrozen(module.bundleModuleMetadata)).toBe(true);
  expect(h.source).not.toHaveBeenCalled(); expect(h.fixed).not.toHaveBeenCalled();
  expect(h.scratch.vm.runtime.on).not.toHaveBeenCalled(); expect(h.scratch.extensions.register).not.toHaveBeenCalled();
});

it('registers the standalone entry exactly once', async () => {
  vi.resetModules(); const h = makeHost(); vi.stubGlobal('Scratch', h.scratch);
  await import('../src/index.js');
  expect(h.scratch.extensions.register).toHaveBeenCalledOnce();
  const extension = h.scratch.extensions.register.mock.calls[0]?.[0] as {getInfo(): {id?: unknown}; dispose(): void | Promise<void>};
  expect(extension.getInfo().id).toBe('kubohiroyastructureddata');
  await extension.dispose();
});

it('uses only the injected host for codecs, namespaces, editors, registry and cleanup', async () => {
  vi.stubGlobal('STRUCTURED_DATA_MVP', true);
  vi.stubGlobal('NAMED_DATA_REGISTRY_MVP', true);
  forbidHostGlobals();
  const {createExtension} = await import('../src/bundle-module.js');
  const a = makeHost('a:'), b = makeHost('b:');
  const first = createExtension(a.scratch), second = createExtension(b.scratch);
  const util = {target: {}, thread: {}, stackFrame: {}, startBranch: vi.fn()};
  first.parseYaml({NAME: 'data', TEXT: 'value: 1'}, util);
  second.parseJson({NAME: 'data', TEXT: '{"value":2}'}, util);
  expect(first.getJsonAtPath({NAME: 'data', PATH: '$.value'}, util)).toBe('1');
  expect(second.toJson({NAME: 'data'}, util)).toBe('{"value":2}');
  expect(first.getInfo().name).toBe('a:Structured Data');
  expect(second.getInfo().name).toBe('b:Structured Data');
  expect(first.getNamedDataRegistry()).not.toBe(second.getNamedDataRegistry());
  expect(first.getNamedDataProvider()).toBeDefined();
  for (const h of [a, b]) {expect(h.source).toHaveBeenCalledTimes(3); expect(h.fixed).toHaveBeenCalledOnce(); expect(h.scratch.extensions.register).not.toHaveBeenCalled();}
  a.emit('PROJECT_STOP_ALL');
  expect(first.hasStructuredData({NAME: 'data'}, util)).toBe(false);
  expect(second.hasStructuredData({NAME: 'data'}, util)).toBe(true);
  await first.dispose(); await first.dispose();
  for (const remove of [...a.sourceCleanups, ...a.fixedCleanups]) expect(remove).toHaveBeenCalledOnce();
  for (const remove of [...b.sourceCleanups, ...b.fixedCleanups]) expect(remove).not.toHaveBeenCalled();
  expect([...a.listeners.values()].every(set => set.size === 0)).toBe(true);
  b.emit('RUNTIME_DISPOSED'); await second.dispose();
  for (const remove of [...b.sourceCleanups, ...b.fixedCleanups]) expect(remove).toHaveBeenCalledOnce();
});

it('retains startup defaults through the factory', async () => {
  const {createExtension} = await import('../src/bundle-module.js');
  const h = makeHost(); const extension = createExtension(h.scratch);
  expect(extension.getInfo().blocks).toEqual([]);
  expect(extension.getNamedDataProvider()).toBeUndefined();
  expect(h.source).not.toHaveBeenCalled(); expect(h.fixed).not.toHaveBeenCalled();
  await extension.dispose();
});
