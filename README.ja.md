# TurboWarp-Structured-Data

[English](README.md)

名前付き構造化データ、安全なJSON/YAML codec、決定的なpath操作、上限付き反復、server compiler契約を提供するTurboWarp機能拡張です。

## できること

- JSONまたはYAMLをtarget-localな名前付きnamespaceへparse
- 名前付きデータをcanonical JSONまたは決定的YAMLへ変換
- 制限付きpathによる参照、存在確認、不変更新、削除
- ソート済みkey、array長、上限付き決定的反復
- compiler manifestとbrowser/server意味論fixtureの出力

## 動作条件と安全性

namespaceとloop contextがTurboWarp BlockUtilityのtarget/thread identityを使うため、sandboxなしで実行します。network、storage、Hono、Cloudflare、Firebaseへ直接依存しません。

`STRUCTURED_DATA_MVP`は起動時固定で既定`false`です。TurboWarpページのcontextで`globalThis.STRUCTURED_DATA_MVP = true`を設定し、**サンドボックスなしで実行する**を有効にして`dist/structured-data.js`を読み込みます。flagなしで起動すれば即時rollbackできます。

JSON/YAML入力は256 KiB、深さ64、50,000 valueまでです。YAML alias、warning、unknown tag、duplicate key、string以外のmap key、未対応scalarは拒否します。

## クイックスタート

```text
parse YAML [name: sensor
enabled: true] as [config]

set [config] at path [$.enabled] to JSON [false]

to JSON [config]
→ {"enabled":false,"name":"sensor"}
```

名前は実行中のspriteまたはstage target単位です。同名をparseするとbindingを置換します。名前付きデータはproject停止時に破棄され、project fileへ永続化しません。

## pathと更新規則

使用できるpathは`$`、`$.users[0].profile.name`、`$["key.with.dots"]`です。dot keyは`[A-Za-z_][A-Za-z0-9_]*`、indexは0以上の10進整数です。wildcard、slice、filter、再帰探索、式評価は拒否します。

`set`のreplacementはJSON形式です。root置換、既存array要素の置換、親が存在するobject keyの追加を許可します。中間container生成やarray appendは行いません。array要素削除は後続要素を左へ詰め、root削除は禁止です。

## 反復とerror

arrayはindex昇順、objectはUnicodeコードポイント順で反復します。`max N`は1〜1000の整数で既定100です。件数超過は打ち切らず失敗します。server compilerでは`N`を静的数値literalにする必要があります。

安定error codeは`INVALID_JSON`、`INVALID_YAML`、`INVALID_NAME`、`DATA_NOT_FOUND`、`PARSE_LIMIT_EXCEEDED`、`INVALID_PATH`、`PATH_NOT_FOUND`、`TYPE_MISMATCH`、`INDEX_OUT_OF_RANGE`、`ITERATION_LIMIT_EXCEEDED`、`ITERATION_CONTEXT_REQUIRED`です。

## ブロック

| 分類 | 主なblock |
|---|---|
| import | `parse JSON ... as ...`、`parse YAML ... as ...` |
| export | `to JSON ...`、`to YAML ...` |
| namespace | `structured data ... exists?`、`delete structured data ...` |
| path | get、has、set、delete、keys、length |
| iteration | for each、current key/index/value |

## compiler契約

`dist/extension-manifest.json` format version 3はtarget-local named reference、型付きpath、argument/result型、effect、error、IR v2 operationを宣言します。[architecture](docs/architecture.ja.md)、[JSON Schema](schemas/extension-manifest.schema.json)、[semantic parity fixture](tests/fixtures/semantic-parity.json)を参照してください。

## 開発

```bash
pnpm run check
```

## ライセンス

SPDX-License-Identifier: MPL-2.0

bundleへ含まれるthird-party softwareのlicenseは[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)に記載します。
