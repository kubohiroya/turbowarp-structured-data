export const STRUCTURED_DATA_MVP_DEFAULT = false;
export const NAMED_DATA_REGISTRY_MVP_DEFAULT = false;

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
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHJlY3QgeD0iNCIgeT0iOCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE0IiByeD0iMyIgZmlsbD0iIzRDOTdGRiIvPjxyZWN0IHg9IjI2IiB5PSI4IiB3aWR0aD0iMTgiIGhlaWdodD0iMTQiIHJ4PSIzIiBmaWxsPSIjNTlDMDU5Ii8+PHJlY3QgeD0iMTUiIHk9IjI2IiB3aWR0aD0iMTgiIGhlaWdodD0iMTQiIHJ4PSIzIiBmaWxsPSIjRkZBQjE5Ii8+PC9zdmc+'
} as const;
