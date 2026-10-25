import {
  validateAgainstSchema,
  validateSchemaDefinition
} from '@kubohiroya/turbowarp-named-functions/composition';
import {
  parseJson,
  stringifyJson,
  StructuredDataError,
  type JsonValue
} from './core.js';

/**
 * Schemas are interpreted, never compiled, by the same validator that checks named function
 * arguments and returns. Reusing that canonical implementation keeps one Schema subset across
 * repositories and keeps this runtime free of an editor Schema engine.
 *
 * Supported keywords: type, properties, required, additionalProperties (boolean), items, enum,
 * const, minimum, maximum, minLength, maxLength, minItems and maxItems. Other keywords, such as
 * title and description, are carried in the stored document but do not constrain values.
 */
export const SCHEMA_SUBSET_KEYWORDS = [
  'type',
  'properties',
  'required',
  'additionalProperties',
  'items',
  'enum',
  'const',
  'minimum',
  'maximum',
  'minLength',
  'maxLength',
  'minItems',
  'maxItems'
] as const;

export const SCHEMA_PROPERTY_TYPES = [
  'object',
  'array',
  'string',
  'number',
  'integer',
  'boolean',
  'null'
] as const;

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

export const SCHEMA_ID_PATTERN = /^[a-z][a-z0-9.-]{0,127}$/u;

/** Complete Semantic Version, matching the named-data schemaRef contract. */
export const SCHEMA_VERSION_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][\dA-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][\dA-Za-z-]*))*))?(?:\+([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?$/u;

export function schemaKey(reference: SchemaReference): string {
  return `${reference.id}@${reference.version}`;
}

export function parseSchemaReference(rawId: unknown, rawVersion: unknown): SchemaReference {
  const id = String(rawId).trim();
  const version = String(rawVersion).trim();
  if (!SCHEMA_ID_PATTERN.test(id)) {
    throw new StructuredDataError(
      'INVALID_SCHEMA',
      `Schema id must match ${SCHEMA_ID_PATTERN.source}: ${id}`,
      {schemaId: id}
    );
  }
  if (!SCHEMA_VERSION_PATTERN.test(version)) {
    throw new StructuredDataError(
      'INVALID_SCHEMA',
      `Schema version must be a complete Semantic Version: ${version}`,
      {schemaId: id, schemaVersion: version}
    );
  }
  return {id, version};
}

/** Reads a Schema document from JSON text and refuses malformed schemas before they are stored. */
export function parseSchemaDocument(text: unknown, reference: SchemaReference): JsonValue {
  let document: JsonValue;
  try {
    document = parseJson(text);
  } catch {
    throw new StructuredDataError('INVALID_SCHEMA', 'Schema must be valid JSON.', {
      schemaId: reference.id,
      schemaVersion: reference.version
    });
  }
  return assertSchemaDocument(document, reference);
}

export function assertSchemaDocument(document: JsonValue, reference: SchemaReference): JsonValue {
  try {
    validateSchemaDefinition(document, 'schema');
  } catch (error) {
    throw new StructuredDataError(
      'INVALID_SCHEMA',
      error instanceof Error ? error.message : String(error),
      {schemaId: reference.id, schemaVersion: reference.version}
    );
  }
  return document;
}

export function schemaEntry(reference: SchemaReference, document: JsonValue): SchemaEntry {
  return {reference, canonical: stringifyJson(document), document};
}

/**
 * Checks a whole candidate value and reports the first failure with the schema identity, the data
 * name, the failing path and the expectation. Callers validate the complete candidate before they
 * replace a binding, so a rejected update leaves the previous value in place.
 */
export function assertValueMatchesSchema(
  value: JsonValue,
  entry: SchemaEntry,
  dataName: string
): void {
  const diagnostics = validateAgainstSchema(value, entry.document);
  const [first] = diagnostics;
  if (first === undefined) return;
  const {path, expected} = splitDiagnostic(first);
  throw new StructuredDataError(
    'SCHEMA_VALIDATION_FAILED',
    `Structured data ${dataName} does not match schema ${schemaKey(entry.reference)}: ${first}`,
    {
      dataName,
      schemaId: entry.reference.id,
      schemaVersion: entry.reference.version,
      path,
      expected
    }
  );
}

/** A Schema being assembled by stacked definition blocks, before it is committed to the registry. */
export interface SchemaDraft {
  reference: SchemaReference;
  additionalProperties: boolean;
  properties: Map<string, SchemaPropertyType>;
  required: Set<string>;
}

export function beginSchemaDraft(
  reference: SchemaReference,
  additionalProperties: boolean
): SchemaDraft {
  return {reference, additionalProperties, properties: new Map(), required: new Set()};
}

export function addDraftProperty(
  draft: SchemaDraft,
  rawProperty: unknown,
  rawType: unknown,
  required: boolean
): void {
  const property = String(rawProperty).trim();
  if (property.length === 0) {
    throw new StructuredDataError('INVALID_SCHEMA', 'Property name cannot be empty.', {
      schemaId: draft.reference.id,
      schemaVersion: draft.reference.version
    });
  }
  const type = String(rawType).trim();
  if (!(SCHEMA_PROPERTY_TYPES as readonly string[]).includes(type)) {
    throw new StructuredDataError(
      'INVALID_SCHEMA',
      `Property type must be one of ${SCHEMA_PROPERTY_TYPES.join(', ')}: ${type}`,
      {
        schemaId: draft.reference.id,
        schemaVersion: draft.reference.version,
        path: `$.${property}`,
        expected: SCHEMA_PROPERTY_TYPES.join(' or ')
      }
    );
  }
  draft.properties.set(property, type as SchemaPropertyType);
  if (required) draft.required.add(property);
  else draft.required.delete(property);
}

/**
 * Converts a draft to the same canonical document a text definition of the same shape produces.
 * Property order never matters: object keys are canonicalized and `required` is sorted.
 */
export function draftToSchemaDocument(draft: SchemaDraft): JsonValue {
  const properties: {[key: string]: JsonValue} = {};
  for (const [property, type] of draft.properties) properties[property] = {type};
  const document: {[key: string]: JsonValue} = {
    type: 'object',
    properties,
    additionalProperties: draft.additionalProperties
  };
  if (draft.required.size > 0) document.required = [...draft.required].sort();
  return document;
}

export function parseAdditionalProperties(raw: unknown, reference: SchemaReference): boolean {
  const value = String(raw).trim();
  if (value === 'allow') return true;
  if (value === 'reject') return false;
  throw new StructuredDataError(
    'INVALID_SCHEMA',
    `Extra properties must be allow or reject: ${value}`,
    {schemaId: reference.id, schemaVersion: reference.version, expected: 'allow or reject'}
  );
}

export function parseRequiredFlag(raw: unknown, reference: SchemaReference): boolean {
  const value = String(raw).trim();
  if (value === 'required') return true;
  if (value === 'optional') return false;
  throw new StructuredDataError(
    'INVALID_SCHEMA',
    `Property requirement must be required or optional: ${value}`,
    {schemaId: reference.id, schemaVersion: reference.version, expected: 'required or optional'}
  );
}

const DIAGNOSTIC_PREDICATES = [' must be ', ' must have ', ' is required', ' is not allowed'];

/**
 * Splits a shared-validator diagnostic into its path and expectation. The message text itself is
 * kept verbatim so a failure reads the same here as it does for a named function argument.
 */
function splitDiagnostic(message: string): {path: string; expected: string} {
  const boundary = DIAGNOSTIC_PREDICATES.map((predicate) => message.indexOf(predicate))
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)[0];
  if (boundary === undefined) return {path: '$', expected: message};
  return {
    path: message.slice(0, boundary),
    expected: message.slice(boundary + 1).replace(/^(?:must be|must have|is) /u, '')
  };
}
