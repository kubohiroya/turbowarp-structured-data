# Architecture

[日本語](architecture.ja.md)

The optional Named Data integration imports its canonical contract and shared runtime registry from
`@kubohiroya/turbowarp-named-data/composition`. The `structured` provider is registered with
`kind: structured`, target scope, and persistent registration. `PROJECT_STOP_ALL` clears target
bindings and open bodies but retains the provider registration for the next project session.

## Named data model

The extension owns a `WeakMap<Target, Map<Name, JsonValue>>`. Names are trimmed, non-empty strings. A sprite and the stage have separate namespaces. Parsing replaces a binding atomically; path updates construct a new JSON value and replace the binding only after validation succeeds. `PROJECT_STOP_ALL` replaces the registries and iteration stacks, so runtime state does not survive a project stop.

JSON values are `null`, booleans, finite numbers, strings, arrays, and objects with own enumerable properties. They never cross the public block boundary as opaque internal tokens. JSON/YAML text appears only at parse, render, set-value, get-value, keys, and current-value boundaries required by Scratch reporter types.

## Codecs and limits

`src/codecs.ts` parses JSON through the shared core and YAML through the YAML AST. Both enforce 256 KiB input, depth 64, and 50,000 nodes. YAML aliases, parser warnings, duplicate keys, unknown tags, non-string keys, and unsupported scalars fail before a namespace binding changes.

Canonical JSON recursively sorts object keys by Unicode code point. YAML uses the same ordering, quotes string scalars, and only leaves identifier-like keys unquoted.

## Paths and iteration

`src/core.ts` converts restricted string paths to typed key/index segments and implements immutable get, has, set, delete, keys, length, and iteration entry generation. Loop entry snapshots are deterministic. Active loop frames are held in a separate `WeakMap` keyed by TurboWarp thread; nested loops form a stack.

## Compiler manifest v3

The manifest declares a named reference with target scope, lifetime until project stop, and `jsonValue` contents. Each opcode provides arguments, result type, effect (`pure`, `state`, or `control`), possible errors, and its IR v2 operation. Server adapters must provide an equivalent target-local slot environment and reject unsupported manifest versions.

`tests/fixtures/semantic-parity.json` is the portable browser/server contract for namespace, codec, path, result, and error semantics.
