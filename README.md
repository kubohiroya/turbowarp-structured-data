# TurboWarp-Structured-Data

<img src="assets/block-icon.svg" alt="" width="48" height="48">

English | [日本語](README.ja.md)

Named structured data with safe JSON/YAML codecs, deterministic path operations, bounded iteration, and a server compiler contract.

Editor metadata and pure owner validation are available through `./editor-metadata`; the common GUI owns Schema compilation and Ajv. See [the runtime/editor boundary](docs/editor-runtime-boundary.ja.md) for compatibility and rollback details.

## Runnable sample

[**Open the demo in TurboWarp Editor**](https://turbowarp.org/editor?project_url=https%3A%2F%2Fkubohiroya.github.io%2Fturbowarp-structured-data%2Fsamples%2Fedit-json-profile.sb3) · [Download the SB3](https://kubohiroya.github.io/turbowarp-structured-data/samples/edit-json-profile.sb3)

Select **Run without sandbox**, then **Allow**, and click the green flag.
The updated score is 8; the profile retains its name.

This sample enables `STRUCTURED_DATA_MVP` only while creating its extension instance, then restores the host flag. The extension default stays OFF.

Editable sources and expected results: [`samples/README.md`](samples/README.md).
Run `pnpm run samples:build` after source/bundle changes and `pnpm run samples:check` before committing.

## What it does

- parses JSON or YAML into a target-local named namespace;
- renders named data as canonical JSON or deterministic YAML;
- reads, detects, immutably updates, and deletes values with a restricted path grammar;
- reads strings, numbers, and booleans as plain text, so a string comes back without JSON quotes;
- lists sorted object keys, reports array lengths, and performs bounded deterministic iteration;
- copies an HTML or Markdown tree parsed by Document Data into a named value (opt-in);
- emits a machine-readable compiler manifest and browser/server parity fixtures.

## Requirements and safety

The extension must run without the sandbox because its namespace and loop context use TurboWarp BlockUtility target/thread identity. It has no network, storage, Hono, Cloudflare, or Firebase dependency.

The `STRUCTURED_DATA_MVP` feature flag is fixed at extension startup and defaults to `false`. In the TurboWarp page context, set `globalThis.STRUCTURED_DATA_MVP = true`, then load `dist/structured-data.js` with **Run extension without sandbox** enabled. Starting without the flag is the immediate rollback.

JSON and YAML input is limited to 256 KiB, nesting depth 64, and 50,000 values. YAML aliases, warnings, unknown tags, duplicate keys, non-string map keys, and unsupported scalar types are rejected.

The structured-data provider can carry a binding's optional `schemaRef` through named-data 0.4.0.
The ID must match `^[a-z][a-z0-9.-]{0,127}$` and the version must be a complete SemVer version.
Schema identity resolution is a startup-fixed opt-in and defaults to `false`; configure
`globalThis.__TW_NAMED_DATA_FEATURE_FLAGS__ = {NAMED_DATA_SCHEMA_REF: true}` before loading the
provider. A request must match the binding's stable ID and full SemVer version exactly. The
provider does not store schema documents or choose a fallback version. Consumers resolve the
identity in their own schema catalog and validate the returned value with their existing JSON
Schema implementation. The agreed subset is `type`, `properties`, `required`,
`additionalProperties` (boolean), `items`, `enum`, `const`, numeric bounds, and string/array
length bounds; unsupported keywords do not add validation behavior. Turn the flag off to
immediately return to metadata without schema identities.

## Schema-bound values

`STRUCTURED_SCHEMA` is a separate startup-fixed flag, also defaulting to `false`. Set
`globalThis.STRUCTURED_SCHEMA = true` before loading the extension to add nine schema blocks; with
the flag off the extension publishes only its nineteen core blocks (twenty with
`STRUCTURED_DOCUMENT_TREE`), with the same semantics, and
a schema block that a saved project still calls fails with `INVALID_SCHEMA` rather than being
ignored. Existing bindings never require a `schemaRef`, so turning the flag off and reloading is
the immediate rollback.

Schemas are interpreted by `validateAgainstSchema` from
`@kubohiroya/turbowarp-named-functions/composition`, the same validator that checks named function
arguments and returns, so one subset holds across repositories. Register a reusable schema with
`define schema [ID] version [V] from JSON [TEXT]`, or stack `begin schema`, `add property` and
`commit schema` to build the same canonical document from blocks. Bind a value with
`parse JSON|YAML ... with schema [ID] version [V]`; a non-conforming document is never registered.
Afterwards `set` and `delete` validate the whole candidate before replacing the binding, so a
rejected update leaves the stored value untouched. Schemas are target-local like named data,
several names may share one schema, and both are discarded when the project stops.

Schema failures add the stable codes `INVALID_SCHEMA`, `SCHEMA_NOT_FOUND` and
`SCHEMA_VALIDATION_FAILED`. `StructuredDataError` now also carries `details` with the data name,
schema id and version, failing path and expectation, so callers never parse the message. See
[Schema-bound values](docs/schema-bound-values.ja.md) and
[the parity fixture](tests/fixtures/schema-parity.json).

## Installation

```bash
pnpm add --save-exact @kubohiroya/turbowarp-structured-data@0.11.0-rc.1
```

## Quick start

```text
parse YAML [name: sensor
enabled: true] as [config]

set [config] at path [$.enabled] to JSON [false]

to JSON [config]
→ {"enabled":false,"name":"sensor"}
```

Names are scoped to the executing sprite or stage target. Parsing the same name replaces its binding. All named data is discarded when the project stops and is not persisted in the project file.

## Path and update rules

Supported paths are `$`, `$.users[0].profile.name`, and `$["key.with.dots"]`. Dot keys match `[A-Za-z_][A-Za-z0-9_]*`; indices are non-negative decimal integers. Wildcards, slices, filters, recursive lookup, and expression evaluation are rejected.

`set` takes a JSON-encoded replacement value. It may replace the root, replace an existing array item, or add an object key when its parent exists. It never creates missing containers or appends to arrays. Deleting an array item shifts later items left; deleting `$` is invalid.

## Iteration and errors

Arrays iterate by ascending index and objects by Unicode code-point-sorted key. `max N` must be an integer from 1 to 1000 and defaults to 100. A collection larger than `N` fails rather than truncating. Server compilation requires `N` to be a static numeric literal.

Stable error codes are `INVALID_JSON`, `INVALID_YAML`, `INVALID_NAME`, `DATA_NOT_FOUND`, `PARSE_LIMIT_EXCEEDED`, `INVALID_PATH`, `PATH_NOT_FOUND`, `TYPE_MISMATCH`, `INDEX_OUT_OF_RANGE`, `ITERATION_LIMIT_EXCEEDED`, and `ITERATION_CONTEXT_REQUIRED`. Enabling `STRUCTURED_SCHEMA` adds
`INVALID_SCHEMA`, `SCHEMA_NOT_FOUND`, and `SCHEMA_VALIDATION_FAILED`.

## Reading values as text

`get JSON from … at path` and `current value JSON` always return JSON, so a string comes back with
its quotes (`"Apple"`). A key lookup then searches for the quoted key, and comparing the value with
`heading` is never true. Three reporters read the value itself instead:

| Block | Reads | Returns |
|---|---|---|
| `text from [NAME] at path [PATH]` | `PATH` in named data | text |
| `current value at path [PATH]` | `PATH` inside the current loop entry's value | JSON; `$` gives the same result as `current value JSON` |
| `current text at path [PATH]` | `PATH` inside the current loop entry's value | text |

A string is returned as is, and a number or boolean as its canonical JSON text (`3`, `true`).
Null, arrays, and objects have no text form and fail with `TYPE_MISMATCH` rather than turning into
an empty string; read them with the JSON reporters. `PATH` uses the same grammar and errors as the
other path blocks. The `current …` reporters read the innermost loop, so an element's fields can be
read without parsing it again under another name, and outside `for each` they fail with
`ITERATION_CONTEXT_REQUIRED`, like `current key`.

```text
parse JSON [{"items":[{"type":"heading","text":"Fruit"},{"type":"item","text":"Apple"}]}] as [outline]
for each in [outline] at path [$.items] max [100]
  if <(current text at path [$.type]) = [heading]> then
    say (current text at path [$.text])
→ Fruit
```

The same reporter turns a key list into usable keys. With turbowarp-kvs, whose `keys in … as JSON`
returns a sorted JSON array of keys:

```text
parse JSON (keys in [scores] as JSON) as [keys]
for each in [keys] at path [$] max [100]
  say (value of (current text at path [$]) in [scores])
```

## Copying document trees

`copy document [DOCUMENT] at [LOCATION] [POSITIONS] as [NAME]` copies a document parsed by
[Document Data](https://github.com/kubohiroya/turbowarp-document-data), or the part at `LOCATION`,
into a named value, so `for each`, the path blocks, and the text reporters can walk an HTML or
Markdown tree. The tree is copied in memory rather than through JSON text, so the 256 KiB input
limit of `parse JSON` does not apply, but depth 64 and 50,000 values do, counted from the copied
node. Each tree level adds an object and a `children` array, so a subtree more than about 31 levels
deep fails with `PARSE_LIMIT_EXCEEDED`; copy a smaller part instead.

The block appears only when both `STRUCTURED_DATA_MVP` and the startup-fixed
`STRUCTURED_DOCUMENT_TREE` flag are `true`; the new flag defaults to `false`. A saved project that
calls the block while either flag is off fails with `DATA_NOT_FOUND` rather than being ignored.
Document Data must also run without the sandbox with its `DOCUMENT_DATA_MVP` flag on. The registry
is looked up when the block runs, so the two extensions can load in either order.

- `DOCUMENT` names a Document Data document of the running sprite or stage. `LOCATION` is `$`, a
  tree path such as `$[0][1]`, or a simple HTML selector (a tag, `#id`, or `.class`; the first match).
- `POSITIONS` is `without positions` (the default) or `with positions`. With positions, nodes that
  have one keep `position: {start, end}`: `line` and `column` count from 1 and `offset` from 0, in
  UTF-16 units of the text that was parsed. A document changed by `replace text in document` has no
  positions.
- `NAME` is bound like `parse JSON … as [NAME]`: per target, replacing an existing value and any
  schema it carried, and discarded when the project stops. The copy is a snapshot: later changes to
  the document are not reflected, and changing the copy never changes the document.
- With a `LOCATION` `L` in the `$` or `$[…]` form, `$.children[i].children[j]` in the copy is the
  Document Data location `L[i][j]` (`$[i][j]` when `L` is `$`), so a node found by a loop can be
  passed back to `text in document … at …`. A copy taken with a selector has no such mapping; use the
  `$[…]` form when you need to go back to the document.
- A failure leaves an existing value unchanged and uses the existing codes: Document Data not loaded
  or the document missing → `DATA_NOT_FOUND`; a malformed `LOCATION` → `INVALID_PATH`; no node at
  `LOCATION` → `PATH_NOT_FOUND`; a copy too deep or too large → `PARSE_LIMIT_EXCEEDED`; a blank name
  → `INVALID_NAME`; an unknown `POSITIONS` value → `TYPE_MISMATCH`. The error's `details` carry
  `documentName`, `location`, and Document Data's `originalCode`.

```text
parse Markdown [# Fruit

- Apple
- Pear] as document [page]
copy document [page] at [$] [with positions] as [tree]
for each in [tree] at path [$.children] max [100]
  if <(current text at path [$.type]) = [heading]> then
    say (join (current text at path [$.position.start.line]) (join ": " (text in document [page] at (join "$[" (join (current index) "]")))))
→ 1: Fruit
```

## Block reference

<!-- BEGIN GENERATED BLOCKS -->

### `parse JSON [TEXT] as [NAME]`

Parse JSON text into the target-local structured data namespace.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `parseJson` |
| `TEXT` | String, default: `{"name":"TurboWarp"}` |
| `NAME` | String, default: `data` |

### `parse YAML [TEXT] as [NAME]`

Parse safe YAML text into the target-local structured data namespace.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `parseYaml` |
| `TEXT` | String, default: `name: TurboWarp` |
| `NAME` | String, default: `data` |

### `copy document [DOCUMENT] at [LOCATION] [POSITIONS] as [NAME]`

Copy a Document Data document, or the part at a location, into the target-local structured data namespace.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `copyDocumentTree` |
| `DOCUMENT` | String, default: `page` |
| `LOCATION` | String, default: `$` |
| `POSITIONS` | String, default: `without positions` |
| `NAME` | String, default: `tree` |

### `to JSON [NAME]`

Render named structured data as canonical JSON.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `toJson` |
| `NAME` | String, default: `data` |

### `to YAML [NAME]`

Render named structured data as deterministic YAML.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `toYaml` |
| `NAME` | String, default: `data` |

### `structured data [NAME] exists?`

Report whether the current target has named structured data.

| Property | Value |
|---|---|
| Type | Boolean |
| Opcode | `hasStructuredData` |
| `NAME` | String, default: `data` |

### `delete structured data [NAME]`

Delete named structured data from the current target.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `deleteStructuredData` |
| `NAME` | String, default: `data` |

### `get JSON from [NAME] at path [PATH]`

Return a named value at a path as JSON.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `getJsonAtPath` |
| `NAME` | String, default: `data` |
| `PATH` | String, default: `$.name` |

### `text from [NAME] at path [PATH]`

Return a string, number, or boolean at a path as text; strings have no JSON quotes.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `getTextAtPath` |
| `NAME` | String, default: `data` |
| `PATH` | String, default: `$.name` |

### `structured data [NAME] has path [PATH]?`

Report whether a path exists in named structured data.

| Property | Value |
|---|---|
| Type | Boolean |
| Opcode | `hasPath` |
| `NAME` | String, default: `data` |
| `PATH` | String, default: `$.name` |

### `set [NAME] at path [PATH] to JSON [VALUE]`

Immutably update a named value and replace its binding.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `setJsonAtPath` |
| `NAME` | String, default: `data` |
| `PATH` | String, default: `$.name` |
| `VALUE` | String, default: `"Scratch"` |

### `delete path [PATH] from [NAME]`

Immutably delete a path and replace its named binding.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `deleteAtPath` |
| `NAME` | String, default: `data` |
| `PATH` | String, default: `$.name` |

### `keys in [NAME] at path [PATH]`

Return sorted object keys as JSON.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `keysAtPath` |
| `NAME` | String, default: `data` |
| `PATH` | String, default: `$` |

### `length of array in [NAME] at path [PATH]`

Return the array length.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `lengthAtPath` |
| `NAME` | String, default: `data` |
| `PATH` | String, default: `$` |

### `for each in [NAME] at path [PATH] max [MAX]`

Iterate named data deterministically with a static maximum.

| Property | Value |
|---|---|
| Type | Loop |
| Opcode | `forEachAtPath` |
| `NAME` | String, default: `data` |
| `PATH` | String, default: `$` |
| `MAX` | Number, default: `100` |

### `current key`

Return the current object key or array index string.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `currentKey` |

### `current index`

Return the zero-based iteration number.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `currentIndex` |

### `current value JSON`

Return the current iteration value as JSON.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `currentValueJson` |

### `current value at path [PATH]`

Return the value at a path inside the current iteration value as JSON.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `currentJsonAtPath` |
| `PATH` | String, default: `$` |

### `current text at path [PATH]`

Return a string, number, or boolean at a path inside the current iteration value as text.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `currentTextAtPath` |
| `PATH` | String, default: `$` |

### `define schema [SCHEMA_ID] version [VERSION] from JSON [TEXT]`

Register a reusable Schema document from JSON text under a stable id and version.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `defineSchema` |
| `SCHEMA_ID` | String, default: `sensor.reading` |
| `VERSION` | String, default: `1.0.0` |
| `TEXT` | String, default: `{"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}` |

### `begin schema [SCHEMA_ID] version [VERSION] extra properties [EXTRA]`

Start a visual Schema definition for an object, replacing any open draft.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `beginSchema` |
| `SCHEMA_ID` | String, default: `sensor.reading` |
| `VERSION` | String, default: `1.0.0` |
| `EXTRA` | String, default: `reject` |

### `add property [PROPERTY] type [TYPE] [REQUIRED]`

Add one property of the subset types to the open visual Schema draft.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `addSchemaProperty` |
| `PROPERTY` | String, default: `name` |
| `TYPE` | String, default: `string` |
| `REQUIRED` | String, default: `required` |

### `commit schema`

Register the open visual draft as the same canonical Schema a text definition produces.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `commitSchema` |

### `schema [SCHEMA_ID] version [VERSION] exists?`

Report whether the current target has that Schema registered.

| Property | Value |
|---|---|
| Type | Boolean |
| Opcode | `hasSchema` |
| `SCHEMA_ID` | String, default: `sensor.reading` |
| `VERSION` | String, default: `1.0.0` |

### `delete schema [SCHEMA_ID] version [VERSION]`

Delete a registered Schema; bindings already validated against it keep their values.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `deleteSchema` |
| `SCHEMA_ID` | String, default: `sensor.reading` |
| `VERSION` | String, default: `1.0.0` |

### `parse JSON [TEXT] as [NAME] with schema [SCHEMA_ID] version [VERSION]`

Parse JSON text and bind it only when it matches the named Schema.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `parseJsonWithSchema` |
| `TEXT` | String, default: `{"name":"TurboWarp"}` |
| `NAME` | String, default: `data` |
| `SCHEMA_ID` | String, default: `sensor.reading` |
| `VERSION` | String, default: `1.0.0` |

### `parse YAML [TEXT] as [NAME] with schema [SCHEMA_ID] version [VERSION]`

Parse safe YAML text and bind it only when it matches the named Schema.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `parseYamlWithSchema` |
| `TEXT` | String, default: `name: TurboWarp` |
| `NAME` | String, default: `data` |
| `SCHEMA_ID` | String, default: `sensor.reading` |
| `VERSION` | String, default: `1.0.0` |

### `schema of [NAME]`

Return the schemaRef bound to named data as JSON, or an empty object when it has none.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `schemaOf` |
| `NAME` | String, default: `data` |

<!-- END GENERATED BLOCKS -->

## Compiler contract

`dist/extension-manifest.json` format version 3 declares the target-local named reference model, typed path segments, block argument/result types, effects, stable errors, and IR v2 operations. See [architecture](docs/architecture.md), the [JSON Schema](schemas/extension-manifest.schema.json), and [semantic parity fixtures](tests/fixtures/semantic-parity.json).

`copyDocumentTree` is declared `server: {supported: false}` without an IR operation, because the server has no Document Data; a server compiler rejects a project that uses it.

## Integrated-build module API

Building this source also produces a `./bundle-module` ESM entry and declarations
in `lib-module/`. This entry is separate from the standalone JavaScript file.

```ts
import {bundleModuleMetadata, createExtension, type ScratchApi}
  from '@kubohiroya/turbowarp-structured-data/bundle-module';

export function createMember(memberScratch: ScratchApi) {
  return createExtension(memberScratch);
}
```

Importing the entry does not access global Scratch / window / document or create
and register an extension. Each explicit createExtension(memberScratch) call
returns a fresh instance bound to that host, including deferred block execution,
editor helpers and lifecycle callbacks. The factory does not call
Scratch.extensions.register; the standalone entry uses the same factory and
registers exactly once.

The frozen bundleModuleMetadata declares formatVersion: 1, the original id and
unsandboxed requirement. An integrated host validates these before creation and
owns registration and disposal. Existing IDs, opcodes and saved data stay unchanged.

The existing STRUCTURED_DATA_MVP, NAMED_DATA_REGISTRY_MVP and Schema reference startup flags retain their defaults. Creation performs the existing optional editor and named-data initialization against the injected host. Call and await dispose() to release the instance registrations and listeners. Internal callers constructing StructuredDataExtension directly now pass the host first, followed by the existing optional feature arguments.

Runtime dependencies (including yaml and their subpaths) remain external imports.
Only the existing small, pure development-time editor helpers are included, so
production consumers need no editor package or GUI engine. Public types use the
same ES2022 libraries as the project tsconfig; generated JavaScript targets ES2020.
The package retains its existing exports and adds ./bundle-module; no template
runtime dependency is required.

pnpm run build:module builds this entry; pnpm run check:module packs and installs
the actual package with production dependencies only, checks host isolation,
standalone parity and public types, and rejects editor-engine dependency leaks.
The integrated sb3-toolchain build remains a later step in
[sb3-toolchain #65](https://github.com/kubohiroya/sb3-toolchain/issues/65).
To roll back, continue loading the existing classic dist artifact without selecting
this module entry. No runtime flag or saved-data migration is introduced.

## Development

```bash
npm install --global corepack@latest
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```

## License

SPDX-License-Identifier: MPL-2.0

Bundled third-party license terms are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Fixed-input editor form (S3-4)

When the shared editor's startup flag `blockEditorFixedInputs` and Dialogs are both on in the GUI, the extension registers a fixed form for `forEachAtPath`'s `MAX` input only. Older GUIs, or a GUI with the flag off, get no extra registration. The canonical Schema is `schemas/block-editor-fixed-inputs.schema.json#/$defs/forEachAtPath/properties/MAX`; the codec and registration live in `src/fixed-input-editors.ts`. Saving without changes never rewrites existing raw values, unchanged aliases, or unknown enum values, and connected reporters are never evaluated. Only explicit changes are validated; other arguments, block declarations, and the saved format are unchanged.

`MAX` is an integer from 1 to 1000. New input also follows the shared finite-number token rule, and partial input is not saved. When the MVP flag is off nothing is registered, and whether `NAME`/`PATH` accept connected reporters (derived from `staticLiteral`) does not change.

Registration is limited to the optional API (`apiVersion: 1`) and is released on `RUNTIME_DISPOSED` or an explicit dispose. Turning the startup flag off and reloading restores the previous behavior. When rolling back the dependency, restore the manifest, lockfile, and actual resolution together. This stage does not include an npm release or dynamic candidates from later stages.

The contract the Schema describes is grounded in the actual `getInfo` declarations and the existing pure runtime conversions. The SchemaBundle `retrievalUri` identifies this local document; it does not mean the Schema is served from that URL or that `$ref` is resolved over HTTP. The Schema compiles from the bundled documents only.
Existing non-empty finite Number aliases for `MAX` (for example `001`, `+1`, or `0x10`) are only projected through `Number` for display; unchanged raw values are not saved again. Blank, non-finite, or unprojectable values are read-only, and no `0` or default is substituted. New input does not accept these aliases and follows NP-finite-new-input-v1.

Registration uses the optional editor API available when the extension instance is constructed. Adding or replacing that API later is not followed automatically; reload the GUI and reconstruct the extension instance after changing the startup configuration.


## Projection from persistent source documents

The opt-in `./document-source` API reads a Document Data source document through its canonical reference and produces a structured runtime value. It uses the shared YAML/JSON codec and retains the original text, comments and line endings in Document Data. Failed parsing or Schema checks leave the previous value untouched; projecting a value never serializes it back over the source. The new `STRUCTURED_DOCUMENT_SOURCE` startup flag defaults to OFF alongside the existing `STRUCTURED_DATA_MVP` gate. Runtime projections are cleared on stop, while the owner's source document remains in SB3 storage. See the [source-document integration guide](docs/document-source.ja.md) for the API, revision guard and Schema reference boundary.
