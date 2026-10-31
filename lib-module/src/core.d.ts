export declare const STRUCTURED_DATA_ERROR_CODES: readonly ["INVALID_JSON", "INVALID_YAML", "INVALID_NAME", "DATA_NOT_FOUND", "INVALID_PATH", "PATH_NOT_FOUND", "TYPE_MISMATCH", "INDEX_OUT_OF_RANGE", "ITERATION_LIMIT_EXCEEDED", "ITERATION_CONTEXT_REQUIRED", "PARSE_LIMIT_EXCEEDED", "INVALID_SCHEMA", "SCHEMA_NOT_FOUND", "SCHEMA_VALIDATION_FAILED"];
export type StructuredDataErrorCode = (typeof STRUCTURED_DATA_ERROR_CODES)[number];
export type JsonPrimitive = null | boolean | number | string;
export type JsonValue = JsonPrimitive | JsonValue[] | {
    [key: string]: JsonValue;
};
export type PathSegment = {
    kind: 'key';
    value: string;
} | {
    kind: 'index';
    value: number;
};
/** Machine-readable context carried beside the stable code, so callers never parse the message. */
export interface StructuredDataErrorDetails {
    /** Name of the structured data binding the failure belongs to. */
    dataName?: string;
    /** Stable identity of the schema that rejected the value. */
    schemaId?: string;
    schemaVersion?: string;
    /** JSON path of the failing value, in the `$.a[0].b` syntax the path blocks accept. */
    path?: string;
    /** What the schema expected at that path, for example `number` or `required`. */
    expected?: string;
    /** Document Data document a tree copy read from. */
    documentName?: string;
    /** Document Data location a tree copy read, in the `$`, `$[0][1]`, or selector syntax. */
    location?: string;
    /** Code reported by the other package, for example the Document Data `DocumentTreeError` code. */
    originalCode?: string;
}
export declare class StructuredDataError extends Error {
    readonly code: StructuredDataErrorCode;
    readonly details: StructuredDataErrorDetails;
    constructor(code: StructuredDataErrorCode, message: string, details?: StructuredDataErrorDetails);
}
export declare function parseJson(text: unknown): JsonValue;
export declare function isValidJson(text: unknown): boolean;
export declare function normalizeJson(text: unknown): string;
export declare function stringifyJson(value: JsonValue): string;
/**
 * Renders a value for the text reporters. A string is returned as is, without JSON quotes or
 * escapes; a number or boolean uses its canonical JSON text. Null, arrays, and objects have no
 * text form and fail instead of becoming an empty or JSON string.
 */
export declare function scalarToText(value: JsonValue): string;
export declare function parsePath(input: unknown): PathSegment[];
export declare function getAtPath(root: JsonValue, segments: readonly PathSegment[]): JsonValue;
export declare function hasAtPath(root: JsonValue, segments: readonly PathSegment[]): boolean;
export declare function setAtPath(root: JsonValue, segments: readonly PathSegment[], replacement: JsonValue): JsonValue;
export declare function deleteAtPath(root: JsonValue, segments: readonly PathSegment[]): JsonValue;
export declare function keysAtPath(root: JsonValue, segments: readonly PathSegment[]): string[];
export declare function lengthAtPath(root: JsonValue, segments: readonly PathSegment[]): number;
export interface IterationEntry {
    key: string;
    value: JsonValue;
}
export declare function iterationEntries(root: JsonValue, segments: readonly PathSegment[], maximum: number): IterationEntry[];
export declare function cloneJson(value: JsonValue): JsonValue;
export declare function compareUnicodeCodePoints(left: string, right: string): number;
