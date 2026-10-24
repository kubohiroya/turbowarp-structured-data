import {readFileSync} from 'node:fs';
import {StructuredDataExtension} from '../src/extension.js';
import {iterationEntries} from '../src/core.js';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {createFixedInputEditor, EditorRegistry} from '@kubohiroya/turbowarp-extension-data-editor';
import type {BlockEditorHost, FixedBlockSnapshot, FixedInputDraft, JsonObject, JsonValue, LiteralArgumentChange} from '@kubohiroya/turbowarp-extension-data-editor';
import {compileSchemaBundle} from '@kubohiroya/turbowarp-extension-data-editor/schema';
import {fixedInputEditorDefinitions, registerFixedInputEditors} from '../src/fixed-input-editors.js';
import {fixedInputSchemaBundle} from '../src/fixed-input-schema.js';

const options = fixedInputEditorDefinitions[0]!;
const argument = 'MAX';
const opening = '100';
const retainedArguments: Record<string, string> = {"NAME": " missing runtime data ", "PATH": "$[\" untouched path \"]"};
const replacement = '2';
const definition = () => createFixedInputEditor(options);
afterEach(() => vi.unstubAllGlobals());

function fixture(raw = opening, reporter = false) {
  const registry = new EditorRegistry();
  const remove = registerFixedInputEditors({gui: {blockEditors: {apiVersion: 1,
    registerFixedInputEditor: (value: typeof options) => registry.registerFixed(createFixedInputEditor(value))}}}, fixedInputEditorDefinitions);
  const snapshot: FixedBlockSnapshot = {
    targetId: 'sprite', blockId: 'owner-block', opcode: options.opcodes[0]!, revision: '1',
    arguments: {[argument]: reporter ? {kind: 'reporter'} : {kind: 'literal', value: raw},
      UNBOUND: {kind: 'literal', value: '  untouched source  '},
      ...Object.fromEntries(Object.entries(retainedArguments).map(([name, value]) => [name, {kind: 'literal' as const, value}]))},
    fixedContext: {contractId: options.contractId, contractRevision: options.contractRevision,
      generation: 'generation-1', dependencies: [], readOnlyArguments: [], inputs: {
        [argument]: reporter ? {role: 'editable', source: 'reporter', identity: 'reporter-1'}
          : {role: 'editable', source: 'shadow', identity: 'literal-1',
            field: {blockId: 'literal-block', name: 'MAX', type: 'text'}}
      }}
  };
  const commits: (readonly LiteralArgumentChange[])[] = [];
  const host: BlockEditorHost = {readBlock: () => snapshot, commit: () => {throw new Error('Legacy port was used.');},
    fixedInputs: {capability: 'fixed-inputs-v1', readBlock: () => snapshot, commit: request => {commits.push(request.changes);}}};
  const session = registry.open({targetId: 'sprite', blockId: 'owner-block'}, host)!;
  function edit(value: JsonValue, buffer?: string) {
    const draft = session.getDraft();
    (draft.inputs as JsonObject)[argument] = {value, changed: true, ...(buffer === undefined ? {} : {buffer})};
    session.setDraft(draft);
  }
  return {session, snapshot, commits, remove, edit};
}

describe('fixed input owner contract', () => {
  it('compiles the on-disk canonical field and registers exactly the planned argument', () => {
    expect(compileSchemaBundle(fixedInputSchemaBundle).kind).toBe('compiled');
    expect(definition().editableArguments).toEqual([argument]);
    expect(definition().readOnlyArguments).toEqual([]);
    expect(definition().opcodes).toEqual(options.opcodes);
    expect(fixedInputSchemaBundle.root.artifact.role).toBe('canonical-schema');
    expect(fixedInputSchemaBundle.provenance.canonicalSources[0]!.symbol).toContain(`/properties/${argument}`);
  });
  it('keeps no-op raw and unrelated arguments without a patch', async () => {
    const f = fixture();
    expect(await f.session.save()).toEqual({status: 'saved', changed: false});
    expect(f.commits).toEqual([]);
    expect(f.snapshot.arguments.UNBOUND).toEqual({kind: 'literal', value: '  untouched source  '});
    for (const [name, value] of Object.entries(retainedArguments)) expect(f.snapshot.arguments[name]).toEqual({kind: 'literal', value});
    f.remove();
  });
  it('commits only the explicitly selected literal through the fixed port', async () => {
    const f = fixture();
    f.edit(replacement);
    expect(await f.session.save()).toEqual({status: 'saved', changed: true});
    expect(f.commits).toEqual([[{argument, value: replacement}]]);
    expect(f.snapshot.arguments.UNBOUND).toEqual({kind: 'literal', value: '  untouched source  '});
    for (const [name, value] of Object.entries(retainedArguments)) expect(f.snapshot.arguments[name]).toEqual({kind: 'literal', value});
    f.remove();
  });
  it('rejects invalid changed values without a patch and retains the dialog draft', async () => {
    const f = fixture();
    f.edit('1e');
    expect((await f.session.save()).status).toBe('invalid');
    expect(f.commits).toEqual([]);
    expect((f.session.getDraft() as FixedInputDraft).inputs[argument]).toMatchObject({changed: true});
    f.remove();
  });
  it('never evaluates or replaces a reporter-backed input', async () => {
    const f = fixture(opening, true);
    expect((f.session.getDraft() as FixedInputDraft).inputs[argument]).toEqual({readOnly: true});
    expect(f.session.getFixedInputView()!.inputs[argument]!.state).toBe('readonly');
    expect(await f.session.save()).toEqual({status: 'saved', changed: false});
    expect(f.commits).toEqual([]);f.remove();
  });
  it('fails closed for a forged reporter edit', async () => {
    const f = fixture(opening, true);f.edit(replacement);
    expect((await f.session.save()).status).toBe('invalid');expect(f.commits).toEqual([]);f.remove();
  });
  it('keeps optional capability absent or version mismatch inactive', () => {
    expect(() => registerFixedInputEditors({}, fixedInputEditorDefinitions)()).not.toThrow();
    const register = vi.fn();
    registerFixedInputEditors({gui: {blockEditors: {apiVersion: 2, registerFixedInputEditor: register}}}, fixedInputEditorDefinitions)();
    expect(register).not.toHaveBeenCalled();
  });
  it('unregisters once on runtime disposal and permits later re-registration', () => {
    const listeners = new Map<string, () => void>();const unregister = vi.fn();
    const scratch = {gui: {blockEditors: {apiVersion: 1, registerFixedInputEditor: vi.fn(() => unregister)}},
      vm: {runtime: {on: (event: string, fn: () => void) => listeners.set(event, fn),
        off: (event: string) => listeners.delete(event)}}};
    const dispose = registerFixedInputEditors(scratch, fixedInputEditorDefinitions);
    listeners.get('RUNTIME_DISPOSED')!();dispose();expect(unregister).toHaveBeenCalledTimes(1);expect(listeners.size).toBe(0);
    registerFixedInputEditors(scratch, fixedInputEditorDefinitions)();expect(unregister).toHaveBeenCalledTimes(2);
  });
  it('releases prior registrations if a later registration fails', () => {
    const unregister = vi.fn();let calls = 0;
    expect(() => registerFixedInputEditors({gui: {blockEditors: {apiVersion: 1, registerFixedInputEditor: () => {
      if (++calls === 2) throw new Error('registration failed');return unregister;
    }}}}, [options, options])).toThrow('registration failed');
    expect(unregister).toHaveBeenCalledTimes(1);
  });
  it('does not register inactive owner definitions or attach lifecycle listeners', () => {
    const register = vi.fn();const on = vi.fn();
    registerFixedInputEditors({gui: {blockEditors: {apiVersion: 1, registerFixedInputEditor: register}}, vm: {runtime: {on}}}, [])();
    expect(register).not.toHaveBeenCalled();expect(on).not.toHaveBeenCalled();
  });
  it('does not execute owner codecs while registering static metadata', () => {
    const binding = options.bindings[0]!;const read = vi.fn(binding.read);const encode = vi.fn(binding.encode);const validate = vi.fn(binding.validateCandidate);
    registerFixedInputEditors({gui: {blockEditors: {apiVersion: 1, registerFixedInputEditor: () => () => {}}}},
      [{...options, bindings: [{...binding, read, encode, validateCandidate: validate}]}])();
    expect(read).not.toHaveBeenCalled();expect(encode).not.toHaveBeenCalled();expect(validate).not.toHaveBeenCalled();
  });
});

describe('integer bounds and raw numeric projection', () => {
  it.each(['1', '1000', '1e3'])('accepts changed finite token %s with exact token bytes', async value => {
    const f = fixture();f.edit(Number(value), value);
    expect(await f.session.save()).toEqual({status: 'saved', changed: true});expect(f.commits).toEqual([[{argument, value}]]);f.remove();
  });
  it.each(['0', '1001', '1.5', '', ' ', 'NaN', 'Infinity', '1e9999', '+1', '001', '0x10', '.5', '1e'])('rejects changed token %s and preserves the buffer', async value => {
    const f = fixture();f.edit(0, value);
    expect((await f.session.save()).status).toBe('invalid');expect(f.commits).toEqual([]);
    expect((f.session.getDraft() as FixedInputDraft).inputs[argument]).toMatchObject({buffer: value});f.remove();
  });
  it.each(['001', '+1', '0x10', ' 1e2 '])('projects old finite alias %s without rewriting it', async value => {
    const f = fixture(value);expect((f.session.getDraft() as FixedInputDraft).inputs[argument]).toMatchObject({value: Number(value), changed: false});
    expect(await f.session.save()).toEqual({status: 'saved', changed: false});expect(f.commits).toEqual([]);f.remove();
  });
  it.each(['', ' ', 'NaN', 'Infinity', '1e9999'])('shows nonrepresentable old raw %s readonly without a zero fallback', async value => {
    const f = fixture(value);expect((f.session.getDraft() as FixedInputDraft).inputs[argument]).toEqual({readOnly: true});
    expect(await f.session.save()).toEqual({status: 'saved', changed: false});expect(f.commits).toEqual([]);f.remove();
  });
});

describe('programmatic new-input tokens', () => {
  it.each(['0x10', '+1', '001', '.5', '', ' ', 'NaN', 'Infinity', '1e9999'])('cannot bypass the new-token grammar with draft.value %s', async value => {
    const f = fixture();f.edit(value);expect((await f.session.save()).status).toBe('invalid');
    expect(f.commits).toEqual([]);f.remove();
  });
});

describe('real Structured Data flag metadata and integer parity', () => {
  it('registers MAX only with the existing MVP flag and does not run the loop', async () => {
    const register = vi.fn(() => vi.fn());
    vi.stubGlobal('Scratch', {gui: {blockEditors: {apiVersion: 1, registerFixedInputEditor: register}},
      vm: {runtime: {on: vi.fn(), off: vi.fn()}}, BlockType: {COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'boolean', LOOP: 'loop'},
      ArgumentType: {STRING: 'string', NUMBER: 'number'}, Cast: {toString: String, toNumber: Number}, translate: (value: string) => value});
    const inactive = new StructuredDataExtension(false, false);expect(inactive.getInfo().blocks).toEqual([]);expect(register).not.toHaveBeenCalled();
    const active = new StructuredDataExtension(true, false);const info = active.getInfo();expect(active.getInfo()).toEqual(info);expect(register).toHaveBeenCalledTimes(1);
    const loop = (info.blocks as {opcode: string; arguments: Record<string, unknown>}[]).find(block => block.opcode === 'forEachAtPath')!;
    expect(Object.keys(loop.arguments)).toEqual(['NAME', 'PATH', 'MAX']);expect(loop.arguments.MAX).toEqual({type: 'number', defaultValue: 100});
    await active.dispose();await inactive.dispose();
  });
  it.each([1, 1000, 0, 1001, 1.5, NaN, Infinity, -Infinity])('matches pure existing iteration bounds for %s', maximum => {
    let accepted = true;try {iterationEntries([], [], maximum);} catch {accepted = false;}
    const binding = options.bindings[0]!;const f = fixture();
    expect(binding.validateCandidate(maximum, options.validationContext(), f.snapshot).length === 0).toBe(accepted);f.remove();
  });
});

it('rejects duplicate registrations without removing the first owner registration', () => {
  const registry = new EditorRegistry();
  const scratch = {gui: {blockEditors: {apiVersion: 1,
    registerFixedInputEditor: (value: typeof options) => registry.registerFixed(createFixedInputEditor(value))}}};
  const dispose = registerFixedInputEditors(scratch, fixedInputEditorDefinitions);
  expect(() => registerFixedInputEditors(scratch, fixedInputEditorDefinitions)).toThrow();
  expect(registry.resolveFixed(options.opcodes[0]!)).toMatchObject({contractId: options.contractId});
  dispose();expect(registry.resolveFixed(options.opcodes[0]!)).toBeUndefined();
});

it.each([true, false])('rolls back earlier SOURCE and fixed resources on real constructor failure: fixedFails=%s', fixedFails => {
  const sourceRemove = vi.fn();const fixedRemove = vi.fn();
  const listeners = new Map<string, Set<() => void>>();
  const runtime = {on(event: string, listener: () => void) {
    if (!listeners.has(event)) listeners.set(event, new Set());listeners.get(event)!.add(listener);
    if (!fixedFails && event === 'PROJECT_STOP_ALL') throw new Error('later constructor failure');
  }, off(event: string, listener: () => void) {listeners.get(event)?.delete(listener);}};
  vi.stubGlobal('Scratch', {gui: {blockEditors: {apiVersion: 1, registerSourceEditor: () => sourceRemove, registerFixedInputEditor() {
    if (fixedFails) throw new Error('fixed registration failure');return fixedRemove;
  }}}, vm: {runtime}});
  expect(() => new StructuredDataExtension(true, false)).toThrow(fixedFails ? 'fixed registration failure' : 'later constructor failure');
  expect(sourceRemove).toHaveBeenCalledTimes(3);expect(fixedRemove).toHaveBeenCalledTimes(fixedFails ? 0 : 1);
  expect([...listeners.values()].every(set => set.size === 0)).toBe(true);
});

it('keeps the docsURI landing-page block anchor linked to generated fixed-form help and the canonical Schema copy', () => {
  const html = readFileSync(new URL('../docs/index.html', import.meta.url), 'utf8');
  expect(html).toContain('href="#block-forEachAtPath"');
  const article = html.match(/<article id="block-forEachAtPath"[^>]*>[\s\S]*?<\/article>/)![0];
  expect(article).toContain('id="fixed-input-forEachAtPath-MAX"');expect(article).toContain('FixedInputs');expect(article).toContain('MAX');
  expect(readFileSync(new URL('../docs/schemas/block-editor-fixed-inputs.schema.json', import.meta.url), 'utf8'))
    .toBe(readFileSync(new URL('../schemas/block-editor-fixed-inputs.schema.json', import.meta.url), 'utf8'));
});
