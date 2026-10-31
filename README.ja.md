# TurboWarp-Structured-Data

<img src="assets/block-icon.svg" alt="" width="48" height="48">

[English](README.md) | 日本語

名前付き構造化データ、安全なJSON/YAML codec、決定的なpath操作、上限付き反復、server compiler契約を提供するTurboWarp機能拡張です。

編集metadataとpure owner検証は`./editor-metadata`で公開し、編集用Schema compileとAjvは共通GUIが担当します。
再生用JSには編集エンジンを同梱しません。[編集とruntimeの境界](docs/editor-runtime-boundary.ja.md)を参照してください。

## 実行できるサンプル

[**TurboWarp Editorでデモを開く**](https://turbowarp.org/editor?project_url=https%3A%2F%2Fkubohiroya.github.io%2Fturbowarp-structured-data%2Fsamples%2Fedit-json-profile.sb3) · [SB3をダウンロード](https://kubohiroya.github.io/turbowarp-structured-data/samples/edit-json-profile.sb3)

**Run without sandbox**を選んで**Allow**し、緑の旗を押します。
`parseJson`で名前と点数を登録し、`setJsonAtPath`で点数を更新、`getJsonAtPath`で表示。サンプルの元データと期待結果は[`samples/README.md`](samples/README.md)に記載しています。

このサンプルは拡張生成時だけ`STRUCTURED_DATA_MVP`を有効にし、直後にホストの設定を元に戻します。拡張本体の既定OFFは変更しません。

`pnpm run samples:build`でSB3を再生成し、`pnpm run samples:check`で更新漏れと生成処理を確認します。

## できること

- JSONまたはYAMLをtarget-localな名前付きnamespaceへparse
- 名前付きデータをcanonical JSONまたは決定的YAMLへ変換
- 制限付きpathによる参照、存在確認、不変更新、削除
- string・number・booleanをJSONの引用符なしの文字列として読み取り
- ソート済みkey、array長、上限付き決定的反復
- compiler manifestとbrowser/server意味論fixtureの出力

## 動作条件と安全性

namespaceとloop contextがTurboWarp BlockUtilityのtarget/thread identityを使うため、sandboxなしで実行します。network、storage、Hono、Cloudflare、Firebaseへ直接依存しません。

`STRUCTURED_DATA_MVP`は起動時固定で既定`false`です。TurboWarpページのcontextで`globalThis.STRUCTURED_DATA_MVP = true`を設定し、**サンドボックスなしで実行する**を有効にして`dist/structured-data.js`を読み込みます。flagなしで起動すれば即時rollbackできます。

JSON/YAML入力は256 KiB、深さ64、50,000 valueまでです。YAML alias、warning、unknown tag、duplicate key、string以外のmap key、未対応scalarは拒否します。

structured-data providerはnamed-data 0.4.0を介してbindingの任意の`schemaRef`を伝播できます。IDは`^[a-z][a-z0-9.-]{0,127}$`に一致し、versionは完全なSemVerである必要があります。Schema identityの解決は起動時固定で、明示的に有効化するまで既定OFFです。provider読み込み前に`globalThis.__TW_NAMED_DATA_FEATURE_FLAGS__ = {NAMED_DATA_SCHEMA_REF: true}`を設定します。参照はbindingの安定IDと完全なSemVer versionに一致する必要があります。providerはSchema本体を保持せず、別versionへのfallbackもしません。consumerは自身のSchema catalogでidentityを解決し、既存のJSON Schema実装で値を検証します。合意するsubsetは`type`、`properties`、`required`、Boolean形式の`additionalProperties`、`items`、`enum`、`const`、数値範囲、文字列／配列の長さ制約です。未対応keywordは検証動作を追加しません。flagをOFFにすればschema identityなしのmetadataへ即時に戻せます。

## Schemaを結び付けたvalue

`STRUCTURED_SCHEMA`は独立した起動時固定flagで、既定`false`です。拡張の読み込み前に
`globalThis.STRUCTURED_SCHEMA = true`を設定するとSchema関連の9 blockが追加されます。OFFのままなら
公開blockはSchema以外の19個で意味論も変わらず、保存済みprojectがSchema blockを呼んだ場合は暗黙に無視せず
`INVALID_SCHEMA`で失敗します。既存bindingはschemaRefを要求しないため、flagをOFFにして再読込すれば即時rollbackできます。

Schemaは`@kubohiroya/turbowarp-named-functions/composition`の`validateAgainstSchema`で解釈します。
名前付き関数の引数・戻り値を検証するものと同一実装なので、subsetがrepository間で1つに保たれます。
`define schema [ID] version [V] from JSON [TEXT]`でテキストから登録するか、`begin schema`、`add property`、
`commit schema`を積んで同じcanonical文書をblockから組み立てます。`parse JSON|YAML ... with schema [ID] version [V]`
で結合し、不適合な文書はbindingへ登録しません。以降の`set`と`delete`は更新候補全体を検証してから置換するため、
拒否された更新では保存済みの値がそのまま残ります。Schemaはnamed valueと同じtarget-localで、
複数の名前が1つのSchemaを共有でき、どちらもproject停止時に破棄されます。

Schema関連の安定codeは`INVALID_SCHEMA`、`SCHEMA_NOT_FOUND`、`SCHEMA_VALIDATION_FAILED`です。
`StructuredDataError`はデータ名、Schema ID／version、失敗path、期待値を持つ`details`も公開するので、
呼び出し側がmessageをparseする必要はありません。[Schemaを結び付けた名前付きvalue](docs/schema-bound-values.ja.md)と
[parity fixture](tests/fixtures/schema-parity.json)を参照してください。

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

安定error codeは`INVALID_JSON`、`INVALID_YAML`、`INVALID_NAME`、`DATA_NOT_FOUND`、`PARSE_LIMIT_EXCEEDED`、`INVALID_PATH`、`PATH_NOT_FOUND`、`TYPE_MISMATCH`、`INDEX_OUT_OF_RANGE`、`ITERATION_LIMIT_EXCEEDED`、`ITERATION_CONTEXT_REQUIRED`です。`STRUCTURED_SCHEMA`を有効にすると
`INVALID_SCHEMA`、`SCHEMA_NOT_FOUND`、`SCHEMA_VALIDATION_FAILED`が加わります。

## 値を文字列で読む

`get JSON from … at path`と`current value JSON`は常にJSON表記を返すため、文字列は引用符付き（`"Apple"`）になります。
そのままでは、キーで値を探すと引用符付きのキーを探してしまい、値を`heading`と比較しても一致しません。
次の3つのreporterは値そのものを読みます。

| block | 読む場所 | 戻り値 |
|---|---|---|
| `text from [NAME] at path [PATH]` | 名前付きデータの`PATH` | 文字列 |
| `current value at path [PATH]` | 反復中の要素の値から見た`PATH` | JSON。`$`なら`current value JSON`と同じ |
| `current text at path [PATH]` | 反復中の要素の値から見た`PATH` | 文字列 |

stringはそのまま、numberとbooleanはcanonical JSONの表記（`3`、`true`）で返します。
null・array・objectには文字列の形がないため、空文字列などへ黙って変換せず`TYPE_MISMATCH`で失敗します。これらはJSONのreporterで読みます。
`PATH`の書式とerrorは他のpath blockと同じです。`current …`は最も内側のloopの要素を読むので、要素を別の名前でparseし直さずに中身を読めます。
`for each`の外では`current key`と同じく`ITERATION_CONTEXT_REQUIRED`で失敗します。

```text
parse JSON [{"items":[{"type":"heading","text":"Fruit"},{"type":"item","text":"Apple"}]}] as [outline]
for each in [outline] at path [$.items] max [100]
  if <(current text at path [$.type]) = [heading]> then
    say (current text at path [$.text])
→ Fruit
```

キーの一覧も、そのまま使えるキーになります。turbowarp-kvsの`keys in … as JSON`（ソート済みのキーのJSON配列）と組み合わせる例です。

```text
parse JSON (keys in [scores] as JSON) as [keys]
for each in [keys] at path [$] max [100]
  say (value of (current text at path [$]) in [scores])
```

## ブロック

| 分類 | 主なblock |
|---|---|
| import | `parse JSON ... as ...`、`parse YAML ... as ...` |
| export | `to JSON ...`、`to YAML ...` |
| namespace | `structured data ... exists?`、`delete structured data ...` |
| path | get JSON、get text、has、set、delete、keys、length |
| iteration | for each、current key/index/value、current value/text at path |
| schema（flag ON時） | define/begin/add property/commit、exists?、delete、parse ... with schema、schema of |

## compiler契約

`dist/extension-manifest.json` format version 3はtarget-local named reference、型付きpath、argument/result型、effect、error、IR v2 operationを宣言します。[architecture](docs/architecture.ja.md)、[JSON Schema](schemas/extension-manifest.schema.json)、[semantic parity fixture](tests/fixtures/semantic-parity.json)を参照してください。

## 統合ビルド用module API

このソースのbuildは、単体JSとは別に、統合用のESM入口`./bundle-module`と
型宣言を`lib-module/`へ生成します。

```ts
import {bundleModuleMetadata, createExtension, type ScratchApi}
  from '@kubohiroya/turbowarp-structured-data/bundle-module';

export function createMember(memberScratch: ScratchApi) {
  return createExtension(memberScratch);
}
```

import時はglobal Scratch / window / documentを参照せず、拡張の生成・登録を行いません。
明示的なcreateExtension(memberScratch)ごとに新しいinstanceを返し、後から実行する
ブロック・編集用補助処理・lifecycle callbackも同じhostを使います。factoryは
Scratch.extensions.registerを呼びません。単体entryも同じfactoryを使い、登録は1回です。

凍結されたbundleModuleMetadataはformatVersion: 1、元のid、unsandboxed条件を
宣言します。統合hostが生成前に検査し、登録とdisposeを管理します。ID・opcode・
保存データ形式を変更しません。

既存のSTRUCTURED_DATA_MVP・NAMED_DATA_REGISTRY_MVP・Schema参照の起動フラグと既定値を維持します。生成時の任意の編集登録・named-data初期化には注入hostを使います。dispose()をawaitして、このinstanceの登録とlistenerを解除します。StructuredDataExtensionを直接newする内部コードでは、hostを先頭に渡し、その後に従来の任意の機能フラグ引数を渡します。

yaml等のruntime依存とそのsubpathは外部importのまま保持します。既存の小さな編集用
純粋ヘルパーだけを含め、production consumerには編集packageやGUIエンジンを要求しません。
公開型は既存tsconfigと同じES2022の型ライブラリを使い、生成JSはES2020を対象とします。
既存exportsを維持して./bundle-moduleを追加し、templateへのruntime依存は追加しません。

pnpm run build:moduleで生成し、pnpm run check:moduleは実tarballをproduction依存だけの
consumerへinstallしてhost分離・単体版との動作一致・公開型・編集エンジンの非混入を検査します。
sb3-toolchain側の統合buildは[sb3-toolchain #65](https://github.com/kubohiroya/sb3-toolchain/issues/65)の後続です。
切戻しはこのmodule入口を選択せず従来のclassic distを読み込みます。新しいruntimeフラグや
保存データの移行は導入しません。

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

原文を正本として保持し構造化データへ変換する API と Schema の読み取り境界は [文書原文からの投影](docs/document-source.ja.md) を参照してください。
