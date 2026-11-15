import type { SchemaBundle, SchemaDocument, SourceBinding, SourceEditorOptions } from '@kubohiroya/turbowarp-extension-data-editor/schema';
export declare function canonicalBundle(ownerId: string, contractId: string, document: SchemaDocument, ownerSource: {
    path: string;
    symbol: string;
}): SchemaBundle;
export declare function sourceBinding(argument: string, bundle: SchemaBundle, read: (source: string) => unknown, check?: (source: string) => unknown, format?: 'json' | 'yaml', uiSchema?: SourceBinding['variants'][number]['uiSchema']): SourceBinding;
/**
 * The optional capability keeps legacy hosts and the startup flag safely inactive.
 * Every project load disposes the runtime, which releases the registrations, but the extension
 * stays loaded for the next project, so they are registered again once that project has loaded.
 * Only the returned owner dispose is final.
 */
export declare function registerSourceEditors(scratch: unknown, definitions: readonly SourceEditorOptions[]): () => void;
