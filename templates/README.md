# TurboWarp-<Extension-Name>

[English](README.md) | [日本語](README.ja.md)

A TurboWarp extension that <one-sentence purpose>.

**User guide:** [English](<PAGES_URL>/)

## What it does

- <User-visible capability 1>
- <User-visible capability 2>
- <User-visible capability 3>

Keep this section about outcomes, not implementation files.

## Documentation and block icon

This extension publishes its English user documentation with GitHub Pages.

- `docsURI` points to the English GitHub Pages documentation: `<PAGES_URL>/`.
- `blockIconURI` is a self-contained SVG encoded as `data:image/svg+xml;base64,...`.
- The block icon should be a simple, recognizable symbol that represents this extension and improves block readability. Do not use a generic placeholder icon in a released extension.

## Requirements and safety

- <TurboWarp Desktop / Web / Packager support>
- <Browser API or companion extension requirements>
- <Sandbox requirement>

> [!IMPORTANT]
> This extension must run without the sandbox because <reason>. Load unsandboxed
> extension code only from a source you trust.

Delete the notice above when the extension is sandbox-compatible.

## Installation

### Ready-to-use JavaScript

1. Download [`dist/<file>.js`](dist/<file>.js?raw=1).
2. Open **Extensions** in TurboWarp.
3. Choose **Custom Extension** and load the file.
4. Enable **Run extension without sandbox** when required.

The reviewed JavaScript build is committed to this repository, so users do not
need Node.js to install the extension.

### npm package

Install an exact version that you have reviewed:

```bash
pnpm add --save-exact @kubohiroya/<package>@<version>
```

Load the standalone bundle from:

```text
node_modules/@kubohiroya/<package>/dist/<file>.js
```

A version-pinned CDN URL is:

```text
https://cdn.jsdelivr.net/npm/@kubohiroya/<package>@<version>/dist/<file>.js
```

Do not maintain `<version>` manually unless CI checks it against `package.json`.

## Quick start

1. <Step 1>
2. <Step 2>
3. <Step 3>

```text
<Minimal TurboWarp block flow>
```

## Block reference

The block reference is generated from
[`src/block-definitions.json`](src/block-definitions.json). Do not edit the
generated section manually.

<!-- BEGIN GENERATED BLOCKS -->

<Generated block documentation>

<!-- END GENERATED BLOCKS -->

## Important behavior

| Situation | Behavior |
|---|---|
| <Case> | <Exact behavior> |
| Project stop | <Cleanup behavior> |
| Project reload | <Cleanup or restoration behavior> |
| Invalid input | <Error or fallback behavior> |

## Composition API

Delete this section when the package has no Composition API.

Importing the Composition API does not register the standalone TurboWarp
extension.

```ts
import {create<Feature>Composition} from '@kubohiroya/<package>/composition';

const feature = create<Feature>Composition({
  // Explicit dependencies
});

// Use the capability.

feature.releaseAll();
```

Explain:

- ownership;
- cancellation and `AbortSignal`;
- target/project lifecycle;
- side effects;
- browser, network, storage, and renderer boundaries;
- `release()` / `releaseAll()` behavior.

Move the complete method reference to [`docs/composition-api.md`](docs/composition-api.md).

## Integration

| Consumer | Relationship |
|---|---|
| `<consumer package>` | <required / optional / capability injection> |

Dependencies must point from the consumer to the provider. Do not document
private-field access as an integration API.

## Compatibility

| Identifier | Value | Stability |
|---|---|---|
| Product name | `TurboWarp-<Extension-Name>` | Human-facing |
| Repository | `kubohiroya/<repository>` | Current source location |
| npm package | `@kubohiroya/<package>` | Public package contract |
| Extension ID | `<extensionid>` | Stored in SB3; migration required to change |

Use hyphens between every component of a multi-word TurboWarp extension name,
for example `TurboWarp-Asset-Manager`, `TurboWarp-Runtime-Expression`, and
`TurboWarp-Diagnostic-Overlay`.

Document schema-aware migrations when an extension ID or opcode changes. Never
instruct users to replace JavaScript alone when stored identifiers have changed.

## Integrated-build module API

Building this source also produces a `./bundle-module` ESM entry and declarations
in `lib-module/`. This entry is separate from the standalone JavaScript file.

```ts
import {bundleModuleMetadata, createExtension, type ScratchApi}
  from '@kubohiroya/<package>/bundle-module';

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

Use Node.js `<minimum version>` and the pnpm version declared by
`packageManager`.

```bash
npm install --global corepack@latest
corepack enable
pnpm install --frozen-lockfile
pnpm check
```

Useful commands:

| Command | Purpose |
|---|---|
| `pnpm dev` | Rebuild while source files change |
| `pnpm test` | Run tests |
| `pnpm docs` | Regenerate block documentation |
| `pnpm check:dist` | Verify committed build artifacts |
| `pnpm pack:check` | Inspect the npm package |
| `pnpm release:check` | Dry-run the release |

## Release

1. Update `CHANGELOG.md` when present.
2. Update the version in `package.json`.
3. Run `pnpm check` and the repository release checks.
4. Merge the release PR.
5. Create tag `v<version>` on the verified commit.
6. Publish the same version to npm when applicable.
7. Verify GitHub Release, npm tarball, GitHub Pages, `docsURI`, block icon, and CDN artifacts.

The release consistency check should verify every exact-version README and CDN
example, and should ensure that `docsURI` still resolves to the English Pages
site and `blockIconURI` remains a `data:image/svg+xml;base64,...` URI.

## License

[Mozilla Public License 2.0](LICENSE) (SPDX: `MPL-2.0`).

Third-party components, when present, are listed in
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## Fixed-input editor form (S3-4)

When the shared editor's startup flag `blockEditorFixedInputs` and Dialogs are both on in the GUI, the extension registers a fixed form for `forEachAtPath`'s `MAX` input only. Older GUIs, or a GUI with the flag off, get no extra registration. The canonical Schema is `schemas/block-editor-fixed-inputs.schema.json#/$defs/forEachAtPath/properties/MAX`; the codec and registration live in `src/fixed-input-editors.ts`. Saving without changes never rewrites existing raw values, unchanged aliases, or unknown enum values, and connected reporters are never evaluated. Only explicit changes are validated; other arguments, block declarations, and the saved format are unchanged.

`MAX` is an integer from 1 to 1000. New input also follows the shared finite-number token rule, and partial input is not saved. When the MVP flag is off nothing is registered, and whether `NAME`/`PATH` accept connected reporters (derived from `staticLiteral`) does not change.

Registration is limited to the optional API (`apiVersion: 1`) and is released on `RUNTIME_DISPOSED` or an explicit dispose. Turning the startup flag off and reloading restores the previous behavior. When rolling back the dependency, restore the manifest, lockfile, and actual resolution together. This stage does not include an npm release or dynamic candidates from later stages.

The contract the Schema describes is grounded in the actual `getInfo` declarations and the existing pure runtime conversions. The SchemaBundle `retrievalUri` identifies this local document; it does not mean the Schema is served from that URL or that `$ref` is resolved over HTTP. The Schema compiles from the bundled documents only.
Existing non-empty finite Number aliases for `MAX` (for example `001`, `+1`, or `0x10`) are only projected through `Number` for display; unchanged raw values are not saved again. Blank, non-finite, or unprojectable values are read-only, and no `0` or default is substituted. New input does not accept these aliases and follows NP-finite-new-input-v1.

Registration uses the optional editor API available when the extension instance is constructed. Adding or replacing that API later is not followed automatically; reload the GUI and reconstruct the extension instance after changing the startup configuration.
