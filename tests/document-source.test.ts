import {describe, it, expect} from 'vitest';
import {EventEmitter} from 'node:events';
import {createSourceDocumentRegistry} from '@kubohiroya/turbowarp-document-data/composition';
import {
  createDocumentSourceProjection,
  createReadonlySchemaResolver
} from '../src/document-source.js';
import {schemaEntry, parseSchemaReference, assertValueMatchesSchema} from '../src/schema.js';
function fixture() {
  let source = '# retained comment\nz: 2\na: [1, true]\n';
  let released = 0;
  const documents = createSourceDocumentRegistry();
  documents.register({
    id: 'test-source',
    list: () => [{documentId: 'story', filename: 'story.yml', format: 'yaml' as const}],
    open: () => ({
      inspect: () => ({available: true}),
      capture: () => ({source}),
      prepare: async () => {
        throw new Error('must not write');
      },
      commit: async () => {
        throw new Error('must not write');
      },
      dispose: () => {
        released++;
      }
    })
  });
  return {
    documents,
    setSource: (text: string) => {
      source = text;
    },
    source: () => source,
    released: () => released
  };
}
describe('explicit source projection', () => {
  it('keeps the original source and previous runtime value on failure until an explicit successful reprojection', () => {
    const f = fixture(),
      target = {},
      ref = {providerId: 'test-source', documentId: 'story'};
    const projection = createDocumentSourceProjection({documents: f.documents});
    const first = projection.project(target, 'data', ref);
    expect(first.value).toEqual({z: 2, a: [1, true]});
    expect(f.source()).toContain('# retained comment');
    f.setSource('a: [');
    expect(() => projection.project(target, 'data', ref)).toThrow();
    expect(projection.get(target, 'data')).toBe(first);
    f.setSource('a: 3\n');
    expect(projection.get(target, 'data')).toBe(first);
    expect(projection.project(target, 'data', ref).value).toEqual({a: 3});
    expect(f.released()).toBe(3);
  });
  it('clears transient target state on stop while retaining source and isolates targets', () => {
    const f = fixture(),
      runtime = new EventEmitter(),
      a = {},
      b = {},
      ref = {providerId: 'test-source', documentId: 'story'};
    const projection = createDocumentSourceProjection({documents: f.documents, runtime});
    projection.project(a, 'data', ref);
    expect(projection.get(b, 'data')).toBeUndefined();
    runtime.emit('PROJECT_STOP_ALL');
    expect(projection.get(a, 'data')).toBeUndefined();
    expect(f.source()).toContain('# retained comment');
    projection.project(b, 'data', ref);
    runtime.emit('RUNTIME_DISPOSED');
    expect(projection.get(b, 'data')).toBeUndefined();
    projection.project(a, 'data', ref);
    expect(projection.get(a, 'data')?.value).toEqual({z: 2, a: [1, true]});
    projection.dispose();
    expect(runtime.listenerCount('PROJECT_STOP_ALL')).toBe(0);
  });
  it('does not publish a failed candidate and closes the source read handle', () => {
    const f = fixture(),
      target = {},
      ref = {providerId: 'test-source', documentId: 'story'};
    let published = 0;
    const projection = createDocumentSourceProjection({
      documents: f.documents,
      publish: () => {
        published++;
        throw new Error('sink rejected');
      }
    });
    expect(() => projection.project(target, 'data', ref)).toThrow('sink rejected');
    expect(projection.get(target, 'data')).toBeUndefined();
    expect(published).toBe(1);
    expect(f.released()).toBe(1);
  });
  it('resolves exact schema versions and returns frozen subset-profile metadata', () => {
    const reference = parseSchemaReference('story', '1.0.0');
    const entry = schemaEntry(reference, {type: 'number', oneOf: [{const: 99}]});
    const resolver = createReadonlySchemaResolver((ref) =>
      ref.id === reference.id && ref.version === reference.version ? entry : undefined
    );
    const found = resolver.resolve(reference);
    expect(Object.isFrozen(found.document)).toBe(true);
    expect(resolver.inline(reference).profile).toBe('structured-subset');
    expect(() => assertValueMatchesSchema(3, entry, 'data')).not.toThrow();
    expect(() => resolver.resolve({id: 'story', version: '^1.0.0'})).toThrow();
    expect(() => resolver.resolve({id: 'story', version: '1.0.1'})).toThrow();
  });
});
