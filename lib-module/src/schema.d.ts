import { type JsonValue } from './core.js';
/**
 * Schemas are interpreted, never compiled, by the same validator that checks named function
 * arguments and returns. Reusing that canonical implementation keeps one Schema subset across
 * repositories and keeps this runtime free of an editor Schema engine.
 *
 * Supported keywords: type, properties, required, additionalProperties (boolean), items, enum,
 * const, minimum, maximum, minLength, maxLength, minItems and maxItems. Other keywords, such as
 * title and description, are carried in the stored document but do not constrain values.
 */
export declare const SCHEMA_SUBSET_KEYWORDS: readonly ["type", "properties", "required", "additionalProperties", "items", "enum", "const", "minimum", "maximum", "minLength", "maxLength", "minItems", "maxItems"];
export declare const SCHEMA_PROPERTY_TYPES: readonly ["object", "array", "string", "number", "integer", "boolean", "null"];
export type SchemaPropertyType = (typeof SCHEMA_PROPERTY_TYPES)[number];
/** Stable schema identity, shaped like the named-data registry's schemaRef. */
export interface SchemaReference {
    id: string;
    version: string;
}
export interface SchemaEntry {
    reference: SchemaReference;
    /** Canonical JSON text of the document, so text and visual definitions compare as equal. */
    canonical: string;
    document: JsonValue;
}
export declare const SCHEMA_ID_PATTERN: RegExp;
/** Complete Semantic Version, matching the named-data schemaRef contract. */
export declare const SCHEMA_VERSION_PATTERN: RegExp;
export declare function schemaKey(reference: SchemaReference): string;
export declare function parseSchemaReference(rawId: unknown, rawVersion: unknown): SchemaReference;
/** Reads a Schema document from JSON text and refuses malformed schemas before they are stored. */
export declare function parseSchemaDocument(text: unknown, reference: SchemaReference): JsonValue;
export declare function assertSchemaDocument(document: JsonValue, reference: SchemaReference): JsonValue;
export declare function schemaEntry(reference: SchemaReference, document: JsonValue): SchemaEntry;
/**
 * Checks a whole candidate value and reports the first failure with the schema identity, the data
 * name, the failing path and the expectation. Callers validate the complete candidate before they
 * replace a binding, so a rejected update leaves the previous value in place.
 */
export declare function assertValueMatchesSchema(value: JsonValue, entry: SchemaEntry, dataName: string): void;
/** A Schema being assembled by stacked definition blocks, before it is committed to the registry. */
export interface SchemaDraft {
    reference: SchemaReference;
    additionalProperties: boolean;
    properties: Map<string, SchemaPropertyType>;
    required: Set<string>;
}
export declare function beginSchemaDraft(reference: SchemaReference, additionalProperties: boolean): SchemaDraft;
export declare function addDraftProperty(draft: SchemaDraft, rawProperty: unknown, rawType: unknown, required: boolean): void;
/**
 * Converts a draft to the same canonical document a text definition of the same shape produces.
 * Property order never matters: object keys are canonicalized and `required` is sorted.
 */
export declare function draftToSchemaDocument(draft: SchemaDraft): JsonValue;
export declare function parseAdditionalProperties(raw: unknown, reference: SchemaReference): boolean;
export declare function parseRequiredFlag(raw: unknown, reference: SchemaReference): boolean;
