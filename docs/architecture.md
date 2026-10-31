# Architecture

[日本語](architecture.ja.md)

The optional Named Data integration imports its canonical contract and shared runtime registry from
`@kubohiroya/turbowarp-named-data/composition`. The `structured` provider is registered with
`kind: structured`, target scope, and persistent registration. `PROJECT_STOP_ALL` clears target
bindings and open bodies but retains the provider registration for the next project session.

## Named data model

The extension owns a `WeakMap<Target, Map<Name, JsonValue>>`. Names are trimmed, non-empty strings. A sprite and the stage have separate namespaces. Parsing replaces a binding atomically; path updates construct a new JSON value and replace the binding only after validation succeeds. `PROJECT_STOP_ALL` replaces the registries and iteration stacks, so runtime state does not survive a project stop.

JSON values are `null`, booleans, finite numbers, strings, arrays, and objects with own enumerable properties. They never cross the public block boundary as opaque internal tokens. JSON/YAML text appears only at parse, render, set-value, get-value, keys, and current-value boundaries required by Scratch reporter types. The text reporters (`text from … at path`, `current text at path`) return a string as is and a number or boolean as its canonical JSON text; null, arrays, and objects fail with `TYPE_MISMATCH` instead of becoming text.

## Codecs and limits

`src/codecs.ts` parses JSON through the shared core and YAML through the YAML AST. Both enforce 256 KiB input, depth 64, and 50,000 nodes. YAML aliases, parser warnings, duplicate keys, unknown tags, non-string keys, and unsupported scalars fail before a namespace binding changes.

Canonical JSON recursively sorts object keys by Unicode code point. YAML uses the same ordering, quotes string scalars, and only leaves identifier-like keys unquoted.

## Paths and iteration

`src/core.ts` converts restricted string paths to typed key/index segments and implements immutable get, has, set, delete, keys, length, and iteration entry generation. Loop entry snapshots are deterministic. Active loop frames are held in a separate `WeakMap` keyed by TurboWarp thread; nested loops form a stack. `current value at path` and `current text at path` apply a path to the value of the top frame, so they read the innermost loop; with no frame they fail with `ITERATION_CONTEXT_REQUIRED` before the path is parsed.

## Document trees

`copyDocumentTree` reads Document Data through the parser-free registry from `@kubohiroya/turbowarp-document-data/composition`. `getDocumentTreeRegistry(Scratch.vm)` returns the registry stored on the VM under `Symbol.for('@kubohiroya/turbowarp-document-data/document-tree-registry/v1')`, so separately bundled extensions share it. The block looks the registry up each time it runs; when structured-data runs first, the lookup creates the empty registry that Document Data registers into later. Each bundle has its own `DocumentTreeError` class, so failures are recognized by `name` and `code` rather than by `instanceof`.

`capture(target, name, {location, positions, limits})` receives the codec's `maxDepth` and `maxNodes`, the same limits `parse JSON` applies; there is no byte limit because no text is parsed. The provider counts values like the codec and stops at the first value over a limit. Because the newest registration answers, `src/document-tree.ts` rebuilds the answer into plain arrays and objects within the same limits before binding it, so the stored value is an ordinary JSON value owned by this extension. Binding then follows `parse JSON`: target-local name, replacement, a schema reference dropped, and clearing on project stop. Document Data codes map onto existing codes (`DOCUMENT_TREE_UNAVAILABLE`, `DOCUMENT_NOT_FOUND`, `DOCUMENT_TREE_PROVIDER_INVALID`, `REGISTRY_SCOPE_INVALID`, `REGISTRY_INCOMPATIBLE` → `DATA_NOT_FOUND`; `INVALID_LOCATION` → `INVALID_PATH`; `LOCATION_NOT_FOUND` → `PATH_NOT_FOUND`; `DOCUMENT_LIMIT_EXCEEDED` → `PARSE_LIMIT_EXCEEDED`), with the original code in `details.originalCode`. `DOCUMENT_TREE_OPTIONS_INVALID` would mean a bug in the block and is rethrown unchanged.

## Compiler manifest v2

The manifest declares a named reference with target scope, lifetime until project stop, and `jsonValue` contents. Each opcode provides arguments, result type, effect (`pure`, `state`, or `control`), possible errors, and its IR v2 operation. Server adapters must provide an equivalent target-local slot environment and reject unsupported manifest versions. A block the server cannot run is declared `server: {supported: false}` with no operation; `copyDocumentTree` is the only one, because the server has no Document Data.

`tests/fixtures/semantic-parity.json` is the portable browser/server contract for namespace, codec, path, result, and error semantics. Its `cases` parse, optionally update, and render a value; its `readCases` name a reporter by IR operation (`structuredData.getText`, `structuredData.currentGet`, `structuredData.currentGetText`, and their JSON counterparts), optionally enter nested loops at given entries first, and expect text, JSON, or an error code. `serverUnsupportedOpcodes` lists the browser-only blocks a server adapter must reject.
