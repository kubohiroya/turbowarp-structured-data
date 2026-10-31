import { type DocumentTreeLimits } from '@kubohiroya/turbowarp-document-data/composition';
import { type JsonValue, type StructuredDataErrorDetails } from './core.js';
/** `POSITIONS` menu values; the saved value is the visible text. */
export declare const DOCUMENT_TREE_POSITIONS: readonly ["without positions", "with positions"];
/** The depth and value limits `parse JSON` applies. No text is parsed, so no byte limit applies. */
export declare const DOCUMENT_TREE_LIMITS: DocumentTreeLimits;
export interface DocumentTreeCopyRequest {
    /** The TurboWarp VM Document Data registers under; an absent VM reports `REGISTRY_SCOPE_INVALID`. */
    readonly scope: object | undefined;
    readonly target: object;
    readonly documentName: string;
    readonly location: string;
    readonly positions: boolean;
}
export declare function parseDocumentTreePositions(value: string): boolean;
/**
 * Copies a Document Data subtree as a plain JSON value. The shared registry is looked up on every
 * call, so it does not matter which extension loads first; when structured-data is first, this
 * creates the empty registry that Document Data registers into later.
 */
export declare function copyDocumentTree(request: DocumentTreeCopyRequest): JsonValue;
/** Maps a Document Data error to a structured-data error; anything else is returned unchanged. */
export declare function mapDocumentTreeError(error: unknown, details?: StructuredDataErrorDetails): unknown;
