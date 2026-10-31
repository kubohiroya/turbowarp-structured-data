import type { SourceDocumentRegistry } from '@kubohiroya/turbowarp-document-data/composition';
import type { ScratchApi, TurboWarpExtension, ScratchBlockUtility } from './runtime-api.js';
import { type NamedDataRegistryService } from '@kubohiroya/turbowarp-named-data/composition';
import { type SchemaEntry, type SchemaReference } from './schema.js';
import { type JsonValue } from './core.js';
import { StructuredDataNamedDataProvider } from './structured-provider.js';
interface NamedPathArguments {
    NAME: unknown;
    PATH: unknown;
}
export declare class StructuredDataExtension implements TurboWarpExtension {
    private readonly scratch;
    private readonly schemaEnabled;
    private readonly documentSourceEnabled;
    private readonly enabled;
    private disposed;
    private readonly releaseRuntimeListeners;
    private readonly unregisterSourceEditors;
    private readonly unregisterFixedInputEditors;
    private readonly sourceProjections;
    private registries;
    private schemaRegistries;
    private schemaDrafts;
    private iterationStacks;
    private nextRevision;
    private readonly namedDataProvider?;
    private readonly namedDataRegistry?;
    private readonly namedDataRegistration?;
    private readonly unbindNamedDataRegistryLifecycle?;
    constructor(scratch: ScratchApi, enabled?: boolean, namedDataEnabled?: boolean, schemaEnabled?: boolean, documentSourceEnabled?: boolean);
    /** Explicitly project preserved source into this extension's transient target bindings. */
    createSourceProjection(documents: SourceDocumentRegistry): Readonly<{
        project(target: object, name: string, reference: import("@kubohiroya/turbowarp-document-data/composition").SourceDocumentReference): import("./document-source.js").SourceProjection;
        get(target: object, name: string): import("./document-source.js").SourceProjection | undefined;
        clearTarget(target: object): void;
        clear: () => void;
        dispose: () => void;
    }>;
    getSchemaResolver(target: object): Readonly<{
        profile: "structured-subset";
        resolve: (reference: SchemaReference) => Readonly<SchemaEntry>;
        inline(reference: SchemaReference): Readonly<{
            profile: "structured-subset";
            reference: SchemaReference;
            document: JsonValue;
        }>;
    }>;
    getNamedDataProvider(): StructuredDataNamedDataProvider | undefined;
    getNamedDataRegistry(): NamedDataRegistryService | undefined;
    dispose(): Promise<void>;
    getInfo(): Record<string, unknown>;
    parseJson(args: {
        TEXT: unknown;
        NAME: unknown;
    }, util: ScratchBlockUtility): void;
    parseYaml(args: {
        TEXT: unknown;
        NAME: unknown;
    }, util: ScratchBlockUtility): void;
    toJson(args: {
        NAME: unknown;
    }, util: ScratchBlockUtility): string;
    toYaml(args: {
        NAME: unknown;
    }, util: ScratchBlockUtility): string;
    hasStructuredData(args: {
        NAME: unknown;
    }, util: ScratchBlockUtility): boolean;
    deleteStructuredData(args: {
        NAME: unknown;
    }, util: ScratchBlockUtility): void;
    getJsonAtPath(args: NamedPathArguments, util: ScratchBlockUtility): string;
    getTextAtPath(args: NamedPathArguments, util: ScratchBlockUtility): string;
    hasPath(args: NamedPathArguments, util: ScratchBlockUtility): boolean;
    setJsonAtPath(args: NamedPathArguments & {
        VALUE: unknown;
    }, util: ScratchBlockUtility): void;
    deleteAtPath(args: NamedPathArguments, util: ScratchBlockUtility): void;
    keysAtPath(args: NamedPathArguments, util: ScratchBlockUtility): string;
    lengthAtPath(args: NamedPathArguments, util: ScratchBlockUtility): number;
    forEachAtPath(args: NamedPathArguments & {
        MAX: unknown;
    }, util: ScratchBlockUtility): void;
    currentKey(_args: Record<string, never>, util: ScratchBlockUtility): string;
    currentIndex(_args: Record<string, never>, util: ScratchBlockUtility): number;
    currentValueJson(_args: Record<string, never>, util: ScratchBlockUtility): string;
    currentJsonAtPath(args: {
        PATH: unknown;
    }, util: ScratchBlockUtility): string;
    currentTextAtPath(args: {
        PATH: unknown;
    }, util: ScratchBlockUtility): string;
    defineSchema(args: {
        SCHEMA_ID: unknown;
        VERSION: unknown;
        TEXT: unknown;
    }, util: ScratchBlockUtility): void;
    beginSchema(args: {
        SCHEMA_ID: unknown;
        VERSION: unknown;
        EXTRA: unknown;
    }, util: ScratchBlockUtility): void;
    addSchemaProperty(args: {
        PROPERTY: unknown;
        TYPE: unknown;
        REQUIRED: unknown;
    }, util: ScratchBlockUtility): void;
    commitSchema(_args: Record<string, never>, util: ScratchBlockUtility): void;
    hasSchema(args: {
        SCHEMA_ID: unknown;
        VERSION: unknown;
    }, util: ScratchBlockUtility): boolean;
    deleteSchema(args: {
        SCHEMA_ID: unknown;
        VERSION: unknown;
    }, util: ScratchBlockUtility): void;
    parseJsonWithSchema(args: {
        TEXT: unknown;
        NAME: unknown;
        SCHEMA_ID: unknown;
        VERSION: unknown;
    }, util: ScratchBlockUtility): void;
    parseYamlWithSchema(args: {
        TEXT: unknown;
        NAME: unknown;
        SCHEMA_ID: unknown;
        VERSION: unknown;
    }, util: ScratchBlockUtility): void;
    schemaOf(args: {
        NAME: unknown;
    }, util: ScratchBlockUtility): string;
    /** Parses a document and binds it only when the whole value matches the referenced Schema. */
    private storeWithSchema;
    /**
     * Checks a candidate for a schema-bound binding before it replaces the stored value. Every path
     * writer builds its candidate immutably, so a rejection leaves the previous binding untouched.
     */
    private assertCandidate;
    private requireSchema;
    private requireDraft;
    private schemaRegistryFor;
    private requireSchemaSupport;
    private schemaNotFound;
    private store;
    private requireData;
    private requireDataByName;
    private registryFor;
    private setBinding;
    private name;
    private dataNotFound;
    private currentIteration;
    /** Reads a path relative to the innermost entry; the loop context is checked before the path. */
    private currentValueAt;
    private stackFor;
    private path;
    private clearRuntimeState;
    private toScratchBlock;
}
export {};
