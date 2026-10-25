import type { JsonValue } from './core.js';
import { type NamedDataBody, type NamedDataMetadata, type NamedDataProvider, type NamedDataReference, type NamedDataSchemaRef, type NamedDataRepresentation, type NamedDataResolveContext } from '@kubohiroya/turbowarp-named-data/composition';
export declare const STRUCTURED_DATA_NAMESPACE = "structured";
export declare const STRUCTURED_BODY_MAX_BYTES: number;
export interface StructuredDataBinding {
    value: JsonValue;
    revision: number;
    nativeRepresentation: 'json' | 'yaml';
    schemaRef?: NamedDataSchemaRef;
}
export interface StructuredDataBindingStore {
    get(target: object, name: string): StructuredDataBinding | undefined;
}
export declare class StructuredDataNamedDataProvider implements NamedDataProvider {
    private readonly store;
    private readonly maxBodyBytes;
    private readonly schemaRefEnabled;
    readonly namespace = "structured";
    readonly kind: "structured";
    private readonly openBodies;
    private released;
    constructor(store: StructuredDataBindingStore, maxBodyBytes?: number, schemaRefEnabled?: boolean);
    canResolve(reference: NamedDataReference, representation: NamedDataRepresentation): boolean;
    stat(reference: NamedDataReference, representation: NamedDataRepresentation, context: NamedDataResolveContext): NamedDataMetadata;
    openBody(reference: NamedDataReference, representation: NamedDataRepresentation, context: NamedDataResolveContext): NamedDataBody;
    release(): void;
    clearSession(): void;
    private resolve;
    private validateReference;
    private render;
    private metadata;
    private throwIfAborted;
}
