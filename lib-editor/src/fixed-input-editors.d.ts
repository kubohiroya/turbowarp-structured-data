import type { FixedInputEditorOptions } from '@kubohiroya/turbowarp-extension-data-editor';
export declare const fixedInputEditorDefinitions: readonly FixedInputEditorOptions[];
interface RuntimeLifetime {
    on?: (event: string, listener: () => void) => void;
    off?: (event: string, listener: () => void) => void;
}
/**
 * Register metadata only; the GUI startup capability owns editor activation.
 * Every project load disposes the runtime, which releases the registrations, but the extension
 * stays loaded for the next project, so they are registered again once that project has loaded.
 * Only the returned owner dispose is final.
 */
export declare function registerFixedInputEditors(scratch: unknown, definitions: readonly FixedInputEditorOptions[], runtimeOverride?: RuntimeLifetime): () => void;
export {};
