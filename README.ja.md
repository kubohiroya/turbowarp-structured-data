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

## 固定引数の編集フォーム（S3-4）

共通エディターの起動時フラグ `blockEditorFixedInputs` とDialogsがONのGUIでは、`forEachAtPath` の `MAX` だけを固定フォームとして登録します。旧GUI・フラグOFFでは追加登録を行いません。Schemaの正本は `schemas/block-editor-fixed-inputs.schema.json#/$defs/forEachAtPath/properties/MAX`、codecと登録は `src/fixed-input-editors.ts` です。既存raw値・未変更alias・未知enumは無操作保存で書き換えず、reporterを評価しません。明示変更だけを検査し、他の引数やブロック宣言、保存形式を変更しません。

MAXは整数1〜1000です。新しい入力には共通の有限数値token規則も適用し、途中入力を保存しません。MVP flagがOFFなら登録せず、NAME/PATH・staticLiteral由来の接続可否を変更しません。

登録はoptional API（apiVersion:1）に限定し、RUNTIME_DISPOSED/明示disposeで解除します。起動フラグOFF＋再読込で従来経路へ切り戻せます。依存を戻す場合はmanifest/lock/実解決を一組で復旧します。npm公開や後続段階の動的候補は含みません。

Schemaが記述する契約の根拠は実getInfoの宣言と既存の純粋なruntime変換です。SchemaBundleのretrievalUriはこのローカル文書の識別子であり、URL配信済み・HTTP取得によるref解決を意味しません。Schemaは同梱文書だけでcompileします。
既存MAXの非空finiteなNumber alias（例`001`・`+1`・`0x10`）はNumberによる表示投影だけを行い、無変更rawを保存し直しません。空白・非finite・投影不能値はreadonlyとし、0/defaultを補いません。新しい入力にはこれらaliasを許可せずNP-finite-new-input-v1を適用します。

登録は拡張インスタンスの構築時に存在する任意の editor API を使用します。後からの API 追加や差し替えには自動追従しません。起動設定を変更した場合は GUI を再読み込みし、拡張インスタンスを再構築してください。
