# TurboWarp-Structured-Data

[日本語](README.ja.md)

Named structured data with safe JSON/YAML codecs, deterministic path operations, bounded iteration, and a server compiler contract.

## What it does

- parses JSON or YAML into a target-local named namespace;
- renders named data as canonical JSON or deterministic YAML;
- reads, detects, immutably updates, and deletes values with a restricted path grammar;
- lists sorted object keys, reports array lengths, and performs bounded deterministic iteration;
- emits a machine-readable compiler manifest and browser/server parity fixtures.

## Requirements and safety

The extension must run without the sandbox because its namespace and loop context use TurboWarp BlockUtility target/thread identity. It has no network, storage, Hono, Cloudflare, or Firebase dependency.

The `STRUCTURED_DATA_MVP` feature flag is fixed at extension startup and defaults to `false`. In the TurboWarp page context, set `globalThis.STRUCTURED_DATA_MVP = true`, then load `dist/structured-data.js` with **Run extension without sandbox** enabled. Starting without the flag is the immediate rollback.

JSON and YAML input is limited to 256 KiB, nesting depth 64, and 50,000 values. YAML aliases, warnings, unknown tags, duplicate keys, non-string map keys, and unsupported scalar types are rejected.

## Installation

```bash
pnpm add --save-exact @kubohiroya/turbowarp-structured-data@0.5.0
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

Stable error codes are `INVALID_JSON`, `INVALID_YAML`, `INVALID_NAME`, `DATA_NOT_FOUND`, `PARSE_LIMIT_EXCEEDED`, `INVALID_PATH`, `PATH_NOT_FOUND`, `TYPE_MISMATCH`, `INDEX_OUT_OF_RANGE`, `ITERATION_LIMIT_EXCEEDED`, and `ITERATION_CONTEXT_REQUIRED`.

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

<!-- END GENERATED BLOCKS -->

## Compiler contract

`dist/extension-manifest.json` format version 3 declares the target-local named reference model, typed path segments, block argument/result types, effects, stable errors, and IR v2 operations. See [architecture](docs/architecture.md), the [JSON Schema](schemas/extension-manifest.schema.json), and [semantic parity fixtures](tests/fixtures/semantic-parity.json).

## Development

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```

## License

SPDX-License-Identifier: MPL-2.0

Bundled third-party license terms are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
