import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import fixture from './fixtures/named-data-provider-contract.json';
import {StructuredDataExtension} from '../src/extension.js';
import {isNamedDataRegistryMvpEnabled, isNamedDataSchemaRefEnabled} from '../src/config.js';
import {
  installNamedDataRegistry,
  NamedDataError,
  type NamedDataReference
} from '@kubohiroya/turbowarp-named-data/composition';
import {validateAgainstSchema} from '@kubohiroya/turbowarp-named-functions/composition';
import {
  StructuredDataNamedDataProvider,
  type StructuredDataBinding
} from '../src/structured-provider.js';

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

function utility(target: object) {
  return {target, thread: {}, stackFrame: {}, startBranch: vi.fn()};
}

function reference(overrides: Partial<NamedDataReference> = {}): NamedDataReference {
  return {
    namespace: fixture.namespace,
    name: 'data',
    kind: fixture.kind as 'structured',
    scope: fixture.scope as 'target',
    ...overrides
  };
}

function text(body: Uint8Array | ReadableStream<Uint8Array>): string {
  if (!(body instanceof Uint8Array)) throw new TypeError('Fixture body must be buffered.');
  return new TextDecoder().decode(body);
}

describe('structured named data provider contract', () => {
  it('is disabled by default and does not expose a provider while disabled', () => {
    expect(isNamedDataRegistryMvpEnabled({})).toBe(false);
    expect(isNamedDataRegistryMvpEnabled({NAMED_DATA_REGISTRY_MVP: true})).toBe(true);
    expect(new StructuredDataExtension(Scratch, true, false).getNamedDataProvider()).toBeUndefined();
  });

  it('keeps schema reference resolution disabled by default', () => {
    expect(isNamedDataSchemaRefEnabled({})).toBe(false);
    expect(isNamedDataSchemaRefEnabled({__TW_NAMED_DATA_FEATURE_FLAGS__: {NAMED_DATA_SCHEMA_REF: true}})).toBe(true);
  });

  it('composes versioned schema identity from the provider through the registry to a named-functions consumer', async () => {
    const target = {};
    const schemaRef = {id: 'com.example.profile', version: '1.0.0'};
    const binding: StructuredDataBinding = {
      value: {name: 'Ada'}, revision: 9, nativeRepresentation: 'json', schemaRef
    };
    const provider = new StructuredDataNamedDataProvider(
      {get: (candidate, name) => candidate === target && name === 'data' ? binding : undefined},
      undefined,
      true
    );
    const registry = installNamedDataRegistry({});
    registry.registerProvider(provider);
    const schemaBoundReference = reference({schemaRef});
    const schemaCatalog = new Map([
      ['com.example.profile@1.0.0', {
        type: 'object',
        properties: {name: {type: 'string'}},
        required: ['name'],
        additionalProperties: false
      }]
    ]);

    const opened = await registry.openBody(schemaBoundReference, 'json', {target});
    expect(opened.schemaRef).toEqual(schemaRef);
    expect(opened.reference.schemaRef).toEqual(schemaRef);
    const schema = schemaCatalog.get(`${opened.schemaRef?.id}@${opened.schemaRef?.version}`);
    expect(schema).toBeDefined();
    const value: unknown = JSON.parse(text(opened.body));
    expect(validateAgainstSchema(value, schema)).toEqual([]);
    expect(validateAgainstSchema({name: 1}, schema)).not.toEqual([]);
    await opened.release();

    const disabledProvider = new StructuredDataNamedDataProvider(
      {get: (candidate, name) => candidate === target && name === 'data' ? binding : undefined}
    );
    expect(() => disabledProvider.stat(schemaBoundReference, 'json', {target})).toThrowError(
      expect.objectContaining({code: 'NAMED_DATA_SCHEMA_UNRESOLVED'})
    );

    await expect(
      registry.stat(reference({schemaRef: {...schemaRef, version: '2.0.0'}}), 'json', {target})
    ).rejects.toMatchObject({code: 'NAMED_DATA_SCHEMA_VERSION_MISMATCH'});
  });

  it('publishes the schemaRef a schema-bound block set, and refuses an unknown schema', async () => {
    // Publishing schema identity needs the named-data registry's own flag as well as this
    // extension's, because the two features roll out independently.
    vi.stubGlobal('__TW_NAMED_DATA_FEATURE_FLAGS__', {NAMED_DATA_SCHEMA_REF: true});
    const extension = new StructuredDataExtension(Scratch, true, true, true);
    const target = {};
    const util = utility(target);
    const schemaRef = {id: 'com.example.profile', version: '1.0.0'};
    const document = {
      type: 'object',
      properties: {name: {type: 'string'}},
      required: ['name'],
      additionalProperties: false
    };

    extension.defineSchema(
      {SCHEMA_ID: schemaRef.id, VERSION: schemaRef.version, TEXT: JSON.stringify(document)},
      util
    );
    extension.parseJsonWithSchema(
      {TEXT: '{"name":"Ada"}', NAME: 'data', SCHEMA_ID: schemaRef.id, VERSION: schemaRef.version},
      util
    );
    extension.parseJson({TEXT: '{"name":"Ada"}', NAME: 'free'}, util);

    const provider = extension.getNamedDataProvider();
    if (!provider) throw new Error('Provider must be registered.');
    const bound = provider.stat(reference({schemaRef}), 'json', {target});
    expect(bound.schemaRef).toEqual(schemaRef);

    // A consumer that resolves the body can check it against the same shared validator.
    const opened = provider.openBody(reference({schemaRef}), 'json', {target});
    expect(validateAgainstSchema(JSON.parse(text(opened.body)), document)).toEqual([]);
    opened.release();

    // Unbound data has no schema identity to publish, so a schema-bound request cannot match it.
    expect(provider.stat(reference({name: 'free'}), 'json', {target}).schemaRef).toBeUndefined();
    expect(() => provider.stat(reference({name: 'free', schemaRef}), 'json', {target})).toThrowError(
      expect.objectContaining({code: 'NAMED_DATA_SCHEMA_VERSION_MISMATCH'})
    );
    expect(() =>
      provider.stat(reference({schemaRef: {...schemaRef, version: '2.0.0'}}), 'json', {target})
    ).toThrowError(expect.objectContaining({code: 'NAMED_DATA_SCHEMA_VERSION_MISMATCH'}));
    await extension.dispose();
  });

  it('serves plain requests while the named-data schema flag is off', async () => {
    const extension = new StructuredDataExtension(Scratch, true, true, true);
    const target = {};
    const util = utility(target);
    const schemaRef = {id: 'com.example.profile', version: '1.0.0'};
    extension.defineSchema(
      {
        SCHEMA_ID: schemaRef.id,
        VERSION: schemaRef.version,
        TEXT: '{"type":"object","properties":{"name":{"type":"string"}}}'
      },
      util
    );
    extension.parseJsonWithSchema(
      {TEXT: '{"name":"Ada"}', NAME: 'data', SCHEMA_ID: schemaRef.id, VERSION: schemaRef.version},
      util
    );

    const provider = extension.getNamedDataProvider();
    if (!provider) throw new Error('Provider must be registered.');
    const plain = provider.stat(reference(), 'json', {target});
    expect(plain.schemaRef).toBeUndefined();
    expect(plain.revision).toBe('1');
    expect(() => provider.stat(reference({schemaRef}), 'json', {target})).toThrowError(
      expect.objectContaining({code: 'NAMED_DATA_SCHEMA_UNRESOLVED'})
    );
    await extension.dispose();
  });

  it('resolves canonical JSON and YAML as replayable UTF-8 bodies', () => {
    const extension = new StructuredDataExtension(Scratch, true, true);
    const target = {};
    const util = utility(target);
    extension.parseJson({TEXT: '{"b":2,"a":1}', NAME: 'data'}, util);
    const provider = extension.getNamedDataProvider();
    expect(provider).toBeDefined();

    for (const representation of ['json', 'yaml'] as const) {
      const expected = fixture.representations[representation];
      const body = provider?.openBody(reference(), representation, {target});
      expect(body).toMatchObject({
        nativeRepresentation: 'json',
        mediaType: expected.mediaType,
        byteLength: expected.byteLength,
        replayable: true,
        revision: fixture.revision
      });
      expect(text(body?.body as Uint8Array)).toBe(expected.text);
      expect(text(body?.body as Uint8Array)).toBe(
        representation === 'json'
          ? extension.toJson({NAME: 'data'}, util)
          : extension.toYaml({NAME: 'data'}, util)
      );
      body?.release();
      body?.release();
    }

    extension.parseYaml({TEXT: 'source: yaml', NAME: 'yaml-data'}, util);
    expect(
      provider?.stat(reference({name: 'yaml-data'}), 'json', {target})
    ).toMatchObject({
      nativeRepresentation: 'yaml',
      representation: 'json',
      mediaType: 'application/json; charset=utf-8'
    });
  });

  it('isolates target-local bindings and exposes stable contract errors', () => {
    const extension = new StructuredDataExtension(Scratch, true, true);
    const target = {};
    extension.parseJson({TEXT: '{}', NAME: 'data'}, utility(target));
    const provider = extension.getNamedDataProvider();
    expect(() => provider?.stat(reference(), 'json', {target: {}})).toThrowError(
      expect.objectContaining({code: fixture.errors.otherTarget})
    );
    expect(() => provider?.stat(reference({scope: 'project'}), 'json', {target})).toThrowError(
      expect.objectContaining({code: fixture.errors.projectScope})
    );
    expect(() => provider?.stat(reference(), 'raw', {target})).toThrowError(
      expect.objectContaining({code: fixture.errors.rawRepresentation})
    );
    const controller = new AbortController();
    controller.abort();
    expect(() => provider?.stat(reference(), 'json', {target, signal: controller.signal})).toThrowError(
      expect.objectContaining({code: fixture.errors.aborted})
    );
  });

  it('rejects oversized bodies without changing the binding', () => {
    const target = {};
    const binding: StructuredDataBinding = {
      value: {message: 'large'},
      revision: 7,
      nativeRepresentation: 'json'
    };
    const provider = new StructuredDataNamedDataProvider(
      {get: (candidate, name) => candidate === target && name === 'data' ? binding : undefined},
      4
    );
    expect(() => provider.openBody(reference(), 'json', {target})).toThrowError(
      expect.objectContaining({code: 'NAMED_DATA_BODY_TOO_LARGE'})
    );
    expect(binding).toEqual({
      value: {message: 'large'},
      revision: 7,
      nativeRepresentation: 'json'
    });
  });

  it('increments revision atomically, clears bindings on stop, and supports release', () => {
    const extension = new StructuredDataExtension(Scratch, true, true);
    const target = {};
    const util = utility(target);
    const provider = extension.getNamedDataProvider();
    extension.parseJson({TEXT: '{"value":1}', NAME: 'data'}, util);
    expect(provider?.stat(reference(), 'json', {target}).revision).toBe('1');
    extension.setJsonAtPath({NAME: 'data', PATH: '$.value', VALUE: '2'}, util);
    expect(provider?.stat(reference(), 'json', {target}).revision).toBe('2');

    const on = Scratch.vm?.runtime?.on as ReturnType<typeof vi.fn>;
    for (const [, listener] of on.mock.calls.filter(([event]) => event === 'PROJECT_STOP_ALL')) {
      (listener as () => void)();
    }
    expect(() => provider?.stat(reference(), 'json', {target})).toThrowError(
      expect.objectContaining({code: fixture.errors.missing})
    );
    provider?.release();
    expect(() => provider?.stat(reference(), 'json', {target})).toThrowError(
      expect.objectContaining({code: fixture.errors.released})
    );
  });

  it('uses NamedDataError for provider failures', () => {
    const provider = new StructuredDataNamedDataProvider({get: () => undefined});
    expect(() => provider.stat(reference(), 'json', {target: {}})).toThrow(NamedDataError);
  });

  it('registers persistently in the shared registry and survives project stop', async () => {
    const extension = new StructuredDataExtension(Scratch, true, true);
    const registry = extension.getNamedDataRegistry();
    const target = {};
    const util = utility(target);
    const structuredReference = reference();
    expect(registry).toBeDefined();
    expect(registry?.canResolve(structuredReference, 'json')).toBe(true);

    extension.parseJson({TEXT: '{"value":1}', NAME: 'data'}, util);
    const first = await registry?.openBody(structuredReference, 'json', {target});
    expect(text(first?.body as Uint8Array)).toBe('{"value":1}');
    await first?.release();

    const on = Scratch.vm?.runtime?.on as ReturnType<typeof vi.fn>;
    for (const [, listener] of on.mock.calls.filter(([event]) => event === 'PROJECT_STOP_ALL')) {
      (listener as () => void)();
    }
    expect(registry?.canResolve(structuredReference, 'json')).toBe(true);
    await expect(registry?.stat(structuredReference, 'json', {target})).rejects.toMatchObject({
      code: 'NAMED_DATA_NOT_FOUND'
    });

    extension.parseJson({TEXT: '{"value":2}', NAME: 'data'}, util);
    await expect(registry?.stat(structuredReference, 'json', {target})).resolves.toMatchObject({
      nativeRepresentation: 'json',
      representation: 'json',
      mediaType: 'application/json; charset=utf-8',
      revision: '1'
    });
    await extension.dispose();
    expect(registry?.canResolve(structuredReference, 'json')).toBe(false);
  });
});
