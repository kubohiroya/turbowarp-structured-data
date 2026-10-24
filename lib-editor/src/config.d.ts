export declare const STRUCTURED_DATA_MVP_DEFAULT = false;
export declare const NAMED_DATA_REGISTRY_MVP_DEFAULT = false;
export declare function isStructuredDataMvpEnabled(source?: {
    STRUCTURED_DATA_MVP?: unknown;
}): boolean;
export declare function isNamedDataRegistryMvpEnabled(source?: {
    NAMED_DATA_REGISTRY_MVP?: unknown;
}): boolean;
export declare const extensionConfig: {
    readonly id: "kubohiroyastructureddata";
    readonly slug: "structured-data";
    readonly name: "Structured Data";
    readonly description: "Named structured data with JSON/YAML codecs for TurboWarp and server compilation.";
    readonly author: "Hiroya Kubo";
    readonly license: "MPL-2.0";
    readonly unsandboxed: true;
    readonly docsURI: "https://kubohiroya.github.io/turbowarp-structured-data/";
    readonly blockIconURI: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHJlY3QgeD0iNCIgeT0iOCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE0IiByeD0iMyIgZmlsbD0iIzRDOTdGRiIvPjxyZWN0IHg9IjI2IiB5PSI4IiB3aWR0aD0iMTgiIGhlaWdodD0iMTQiIHJ4PSIzIiBmaWxsPSIjNTlDMDU5Ii8+PHJlY3QgeD0iMTUiIHk9IjI2IiB3aWR0aD0iMTgiIGhlaWdodD0iMTQiIHJ4PSIzIiBmaWxsPSIjRkZBQjE5Ii8+PC9zdmc+";
};
