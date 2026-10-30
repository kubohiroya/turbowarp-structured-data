import type { SourceDocumentReference, SourceDocumentRegistry } from '@kubohiroya/turbowarp-document-data/composition';
import { type JsonValue } from './core.js';
import { type SchemaEntry, type SchemaReference } from './schema.js';
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
    readonly publish?: (target: object, name: string, value: JsonValue, format: 'json' | 'yaml') => void;
}
/** An explicit one-way projection. It never prepares, commits or serializes source documents. */
export declare function createDocumentSourceProjection({ documents, runtime, publish }: SourceProjectionOptions): Readonly<{
    project(target: object, name: string, reference: SourceDocumentReference): SourceProjection;
    get(target: object, name: string): SourceProjection | undefined;
    clearTarget(target: object): void;
    clear: () => void;
    dispose: () => void;
}>;
/** The legacy runtime subset is identified explicitly; this is not a full JSON Schema engine. */
export declare function createReadonlySchemaResolver(lookup: (reference: SchemaReference) => SchemaEntry | undefined): Readonly<{
    profile: "structured-subset";
    resolve: (reference: SchemaReference) => Readonly<SchemaEntry>;
    inline(reference: SchemaReference): Readonly<{
        profile: "structured-subset";
        reference: SchemaReference;
        document: JsonValue;
    }>;
}>;
export {};
