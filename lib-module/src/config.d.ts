export declare const STRUCTURED_DATA_MVP_DEFAULT = false;
export declare const NAMED_DATA_REGISTRY_MVP_DEFAULT = false;
export declare const NAMED_DATA_SCHEMA_REF_DEFAULT = false;
export declare const STRUCTURED_SCHEMA_DEFAULT = false;
export declare function isNamedDataSchemaRefEnabled(source?: {
    __TW_NAMED_DATA_FEATURE_FLAGS__?: {
        NAMED_DATA_SCHEMA_REF?: unknown;
    };
}): boolean;
export declare function isStructuredDataMvpEnabled(source?: {
    STRUCTURED_DATA_MVP?: unknown;
}): boolean;
export declare function isNamedDataRegistryMvpEnabled(source?: {
    NAMED_DATA_REGISTRY_MVP?: unknown;
}): boolean;
export declare function isStructuredSchemaEnabled(source?: {
    STRUCTURED_SCHEMA?: unknown;
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
    readonly blockIconURI: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHJlY3QgeD0iNCIgeT0iOCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjMyIiByeD0iNiIgZmlsbD0iIzhBNTVENyIvPjxwYXRoIGQ9Ik0xOSAxNWMtMyAwLTIgNy01IDkgMyAyIDIgOSA1IDkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMjkgMTVjMyAwIDIgNyA1IDktMyAyLTIgOS01IDkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSIyLjIiIGZpbGw9IiNmZmYiLz48L3N2Zz4=";
};
