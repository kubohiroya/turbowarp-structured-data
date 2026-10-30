import { parseJsonDocument, parseYamlDocument } from './codecs.js';
import { cloneJson, StructuredDataError } from './core.js';
import { parseSchemaReference, schemaKey } from './schema.js';
/** An explicit one-way projection. It never prepares, commits or serializes source documents. */
export function createDocumentSourceProjection({ documents, runtime, publish }) {
    let values = new WeakMap();
    let disposed = false;
    let generation = 0;
    const clear = () => {
        values = new WeakMap();
        generation++;
    };
    const stop = () => clear();
    const close = () => {
        if (disposed)
            return;
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
        project(target, name, reference) {
            if (disposed)
                throw new StructuredDataError('DATA_NOT_FOUND', 'The source projection session has ended.');
            if (target === null || (typeof target !== 'object' && typeof target !== 'function'))
                throw new StructuredDataError('TYPE_MISMATCH', 'A runtime target is required.');
            if (typeof name !== 'string' || !name.trim())
                throw new StructuredDataError('INVALID_NAME', 'Structured data name cannot be empty.');
            const identity = Object.freeze({ ...reference });
            const metadata = documents
                .list()
                .find((item) => item.reference.providerId === identity.providerId &&
                item.reference.documentId === identity.documentId);
            if (!metadata)
                throw new StructuredDataError('DATA_NOT_FOUND', 'The source document does not exist.');
            const format = metadata.format;
            if (format !== 'json' && format !== 'yaml')
                throw new StructuredDataError('TYPE_MISMATCH', 'A source document must declare JSON or YAML format.');
            const current = generation;
            const adapter = documents.open(identity);
            let value;
            try {
                const captured = adapter.capture();
                value =
                    format === 'json'
                        ? parseJsonDocument(captured.source)
                        : parseYamlDocument(captured.source);
            }
            finally {
                adapter.dispose();
            }
            if (disposed || current !== generation)
                throw new StructuredDataError('DATA_NOT_FOUND', 'The runtime session changed during source projection.');
            const candidate = freeze({
                reference: identity,
                filename: metadata.filename,
                format,
                value: cloneJson(value)
            });
            publish?.(target, name.trim(), cloneJson(value), format);
            let bindings = values.get(target);
            if (!bindings) {
                bindings = new Map();
                values.set(target, bindings);
            }
            bindings.set(name.trim(), candidate);
            return candidate;
        },
        get(target, name) {
            return values.get(target)?.get(name.trim());
        },
        clearTarget(target) {
            values.delete(target);
            generation++;
        },
        clear,
        dispose: close
    });
}
function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
        for (const child of Object.values(value))
            freeze(child);
        Object.freeze(value);
    }
    return value;
}
/** The legacy runtime subset is identified explicitly; this is not a full JSON Schema engine. */
export function createReadonlySchemaResolver(lookup) {
    const resolve = (reference) => {
        const exact = parseSchemaReference(reference.id, reference.version);
        const entry = lookup(exact);
        if (!entry || entry.reference.id !== exact.id || entry.reference.version !== exact.version)
            throw new StructuredDataError('SCHEMA_NOT_FOUND', `Schema does not exist: ${schemaKey(exact)}`, { schemaId: exact.id, schemaVersion: exact.version });
        return freeze(JSON.parse(JSON.stringify(entry)));
    };
    return Object.freeze({
        profile: 'structured-subset',
        resolve,
        inline(reference) {
            const entry = resolve(reference);
            return Object.freeze({
                profile: 'structured-subset',
                reference: entry.reference,
                document: entry.document
            });
        }
    });
}
