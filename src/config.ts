export const STRUCTURED_DATA_MVP_DEFAULT = false;
export const NAMED_DATA_REGISTRY_MVP_DEFAULT = false;
export const NAMED_DATA_SCHEMA_REF_DEFAULT = false;
export const STRUCTURED_SCHEMA_DEFAULT = false;
export const STRUCTURED_DOCUMENT_SOURCE_DEFAULT = false;

export function isNamedDataSchemaRefEnabled(
  source: {__TW_NAMED_DATA_FEATURE_FLAGS__?: {NAMED_DATA_SCHEMA_REF?: unknown}} =
    globalThis as {__TW_NAMED_DATA_FEATURE_FLAGS__?: {NAMED_DATA_SCHEMA_REF?: unknown}}
): boolean {
  const value = source.__TW_NAMED_DATA_FEATURE_FLAGS__?.NAMED_DATA_SCHEMA_REF;
  return value === undefined
    ? NAMED_DATA_SCHEMA_REF_DEFAULT
    : value === true || value === 'true';
}

export function isStructuredDataMvpEnabled(
  source: {STRUCTURED_DATA_MVP?: unknown} = globalThis as {STRUCTURED_DATA_MVP?: unknown}
): boolean {
  const value = source.STRUCTURED_DATA_MVP;
  return value === undefined ? STRUCTURED_DATA_MVP_DEFAULT : value === true || value === 'true';
}

export function isNamedDataRegistryMvpEnabled(
  source: {NAMED_DATA_REGISTRY_MVP?: unknown} = globalThis as {
    NAMED_DATA_REGISTRY_MVP?: unknown;
  }
): boolean {
  const value = source.NAMED_DATA_REGISTRY_MVP;
  return value === undefined ? NAMED_DATA_REGISTRY_MVP_DEFAULT : value === true || value === 'true';
}

export function isStructuredSchemaEnabled(
  source: {STRUCTURED_SCHEMA?: unknown} = globalThis as {STRUCTURED_SCHEMA?: unknown}
): boolean {
  const value = source.STRUCTURED_SCHEMA;
  return value === undefined ? STRUCTURED_SCHEMA_DEFAULT : value === true || value === 'true';
}

/** Read once by the extension constructor; pure source adapters remain explicit opt-in APIs. */
export function isStructuredDocumentSourceEnabled(
  source: {STRUCTURED_DOCUMENT_SOURCE?: unknown} = globalThis as {STRUCTURED_DOCUMENT_SOURCE?: unknown}
): boolean {
  const value = source.STRUCTURED_DOCUMENT_SOURCE;
  return value === undefined ? STRUCTURED_DOCUMENT_SOURCE_DEFAULT : value === true || value === 'true';
}

export const extensionConfig = {
  id: 'kubohiroyastructureddata',
  slug: 'structured-data',
  name: 'Structured Data',
  description: 'Named structured data with JSON/YAML codecs for TurboWarp and server compilation.',
  author: 'Hiroya Kubo',
  license: 'MPL-2.0',
  unsandboxed: true,
  docsURI: 'https://kubohiroya.github.io/turbowarp-structured-data/',
  blockIconURI:
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHJlY3QgeD0iNCIgeT0iOCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjMyIiByeD0iNiIgZmlsbD0iIzhBNTVENyIvPjxwYXRoIGQ9Ik0xOSAxNWMtMyAwLTIgNy01IDkgMyAyIDIgOSA1IDkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMjkgMTVjMyAwIDIgNyA1IDktMyAyLTIgOS01IDkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSIyLjIiIGZpbGw9IiNmZmYiLz48L3N2Zz4='
} as const;
