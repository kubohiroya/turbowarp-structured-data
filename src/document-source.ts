import type {
  SourceDocumentReference,
  SourceDocumentRegistry
} from '@kubohiroya/turbowarp-document-data/composition';
import {parseJsonDocument, parseYamlDocument} from './codecs.js';
import {cloneJson, StructuredDataError, type JsonValue} from './core.js';
import {parseSchemaReference, schemaKey, type SchemaEntry, type SchemaReference} from './schema.js';
export interface SourceProjection {
  readonly reference: Readonly<SourceDocumentReference>;
  readonly filename: string;
  readonly format: 'json' | 'yaml';
  readonly value: JsonValue;
}
interface RuntimeEvents {
  on(event: string, listener: () => void): void;
  off?(event: string, listener: () => void): void;
}
export interface SourceProjectionOptions {
  readonly documents: SourceDocumentRegistry;
  readonly runtime?: RuntimeEvents;
  /** Replace a complete validated candidate; throwing must leave the sink unchanged. */
  readonly publish?: (
    target: object,
    name: string,
    value: JsonValue,
    format: 'json' | 'yaml'
  ) => void;
}
/** An explicit one-way projection. It never prepares, commits or serializes source documents. */
export function createDocumentSourceProjection({
  documents,
  runtime,
  publish
}: SourceProjectionOptions) {
  let values = new WeakMap<object, Map<string, SourceProjection>>();
  let disposed = false;
  let generation = 0;
  const clear = () => {
    values = new WeakMap();
    generation++;
  };
  const stop = () => clear();
  const close = () => {
    if (disposed) return;
    disposed = true;
    clear();
    runtime?.off?.('PROJECT_STOP_ALL', stop);
    runtime?.off?.('RUNTIME_DISPOSED', stop);
    runtime?.off?.('PROJECT_LOADED', stop);
  };
  runtime?.on('PROJECT_STOP_ALL', stop);
  runtime?.on('RUNTIME_DISPOSED', stop);
  runtime?.on('PROJECT_LOADED', stop);
  return Object.freeze({
    project(target: object, name: string, reference: SourceDocumentReference): SourceProjection {
      if (disposed)
        throw new StructuredDataError('DATA_NOT_FOUND', 'The source projection session has ended.');
      if (target === null || (typeof target !== 'object' && typeof target !== 'function'))
        throw new StructuredDataError('TYPE_MISMATCH', 'A runtime target is required.');
      if (typeof name !== 'string' || !name.trim())
        throw new StructuredDataError('INVALID_NAME', 'Structured data name cannot be empty.');
      const identity = Object.freeze({...reference});
      const metadata = documents
        .list()
        .find(
          (item) =>
            item.reference.providerId === identity.providerId &&
            item.reference.documentId === identity.documentId
        );
      if (!metadata)
        throw new StructuredDataError('DATA_NOT_FOUND', 'The source document does not exist.');
      const format = metadata.format;
      if (format !== 'json' && format !== 'yaml')
        throw new StructuredDataError(
          'TYPE_MISMATCH',
          'A source document must declare JSON or YAML format.'
        );
      const current = generation;
      const adapter = documents.open(identity);
      let value: JsonValue;
      try {
        const captured = adapter.capture();
        value =
          format === 'json'
            ? parseJsonDocument(captured.source)
            : parseYamlDocument(captured.source);
      } finally {
        adapter.dispose();
      }
      if (disposed || current !== generation)
        throw new StructuredDataError(
          'DATA_NOT_FOUND',
          'The runtime session changed during source projection.'
        );
      const candidate = freeze({
        reference: identity,
        filename: metadata.filename,
        format,
        value: cloneJson(value)
      }) as SourceProjection;
      publish?.(target, name.trim(), cloneJson(value), format);
      let bindings = values.get(target);
      if (!bindings) {
        bindings = new Map();
        values.set(target, bindings);
      }
      bindings.set(name.trim(), candidate);
      return candidate;
    },
    get(target: object, name: string): SourceProjection | undefined {
      return values.get(target)?.get(name.trim());
    },
    clearTarget(target: object) {
      values.delete(target);
      generation++;
    },
    clear,
    dispose: close
  });
}
function freeze<T>(value: T): Readonly<T> {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value as Readonly<T>;
}

/** The legacy runtime subset is identified explicitly; this is not a full JSON Schema engine. */
export function createReadonlySchemaResolver(
  lookup: (reference: SchemaReference) => SchemaEntry | undefined
) {
  const resolve = (reference: SchemaReference): Readonly<SchemaEntry> => {
    const exact = parseSchemaReference(reference.id, reference.version);
    const entry = lookup(exact);
    if (!entry || entry.reference.id !== exact.id || entry.reference.version !== exact.version)
      throw new StructuredDataError(
        'SCHEMA_NOT_FOUND',
        `Schema does not exist: ${schemaKey(exact)}`,
        {schemaId: exact.id, schemaVersion: exact.version}
      );
    return freeze(JSON.parse(JSON.stringify(entry)) as SchemaEntry);
  };
  return Object.freeze({
    profile: 'structured-subset' as const,
    resolve,
    inline(reference: SchemaReference) {
      const entry = resolve(reference);
      return Object.freeze({
        profile: 'structured-subset' as const,
        reference: entry.reference,
        document: entry.document
      });
    }
  });
}
