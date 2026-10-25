# Schemaを結び付けた名前付きvalue

追跡: [turbowarp-structured-data #6](https://github.com/kubohiroya/turbowarp-structured-data/issues/6)。

既存のtarget-localなJSON/YAML named valueへ、再利用可能なSchema参照を任意で結び付ける。
Schemaを指定しない値は従来どおり自由なJSON valueとして扱い、指定した値だけparseと更新時に検証する。

## 起動時flag

`STRUCTURED_SCHEMA`は起動時固定で既定`false`である。TurboWarpページのcontextで
`globalThis.STRUCTURED_SCHEMA = true`を設定してから`dist/structured-data.js`を読み込むと、
Schema関連の9 blockが追加される。OFFのままなら公開blockは従来の16個で、
`parseJson`/`parseYaml`/path操作/反復の意味論は一切変わらない。
既存bindingはschemaRefを要求しないので、flagをOFFに戻して再読込すれば現行動作へ戻る。
OFFの状態でSchema blockが呼ばれた場合は`INVALID_SCHEMA`で明示的に拒否し、暗黙に無視しない。

この flag はprovider側の`NAMED_DATA_SCHEMA_REF`とは独立である。両者の関係は後述する。

## 共通Schema subset

検証器は`@kubohiroya/turbowarp-named-functions/composition`の`validateAgainstSchema`と
`validateSchemaDefinition`をそのまま使う。関数の引数・戻り値を検証するものと同一実装なので、
ここで受理される値は名前付き関数側でも受理される。手書きの複製は作らない。
この検証器はSchemaをcompileせず解釈するだけなので、`eval`が使えないserver環境でも同じ結果になる。

解釈するkeyword: `type`、`properties`、`required`、Boolean形式の`additionalProperties`、`items`、
`enum`、`const`、`minimum`、`maximum`、`minLength`、`maxLength`、`minItems`、`maxItems`。
`type`は`object`、`array`、`string`、`number`、`integer`、`boolean`、`null`とその配列を受ける。
`title`や`description`などの未対応keywordは保存はされるが値を制約しない。`$ref`は初回範囲に含めない。

Schema IDは`^[a-z][a-z0-9.-]{0,127}$`、versionは完全なSemVerでなければならない。
これはnamed-dataの`schemaRef`契約と同じ制約である。構造の壊れたSchemaは登録前に`INVALID_SCHEMA`で拒否する。

## block

| block | 役割 |
|---|---|
| `define schema [ID] version [V] from JSON [TEXT]` | JSONテキストからSchemaを登録する |
| `begin schema [ID] version [V] extra properties [EXTRA]` | 視覚定義のdraftを開始する（`allow`／`reject`） |
| `add property [NAME] type [TYPE] [REQUIRED]` | draftにproperty 1件を追加する（`required`／`optional`） |
| `commit schema` | draftをcanonical Schemaとして登録する |
| `schema [ID] version [V] exists?` | 登録の有無を返す |
| `delete schema [ID] version [V]` | 登録を削除する |
| `parse JSON [TEXT] as [NAME] with schema [ID] version [V]` | 適合時のみbindingへ登録する |
| `parse YAML [TEXT] as [NAME] with schema [ID] version [V]` | 同じくYAMLから |
| `schema of [NAME]` | bindingのschemaRefをJSONで返す（未結合は`{}`） |

Schema registryはnamed valueと同じtarget-localで、同じtargetの複数のnamed valueが1つのSchemaを共有できる。
project停止時にnamed valueと一緒に破棄する。project／global scopeでの共有は共通Schema registry契約の確定後とする。

## 検証の意味論

- schemaRef付きparseは候補値全体を検証し、失敗した場合はbindingを作らない。既存の同名bindingも変更しない。
- schemaRef付きbindingへのpath set/deleteは、更新候補全体を検証してから置換する。
  path操作はいずれも不変更新で候補を組み立てるので、拒否された場合は元bindingがそのまま残る。
- schemaRefを持たないbindingは検証しない。schemaなしの`parse`で同名を再束縛するとschemaRefも外れる。
  これはparseがbindingを作り直す操作であり、設計上の既定である。
- JSONとYAMLは同じJSON valueへ変換してから同じvalidatorにかけるので、受理・拒否と診断が一致する。
- bindingのSchemaを`delete schema`で削除した後のpath更新は`SCHEMA_NOT_FOUND`で拒否する。
  値はそのまま読めるが、検証できない更新を黙って通さない。

## error

安定codeを3つ追加する。`StructuredDataError`は`code`に加えて`details`を持ち、
呼び出し側がmessageをparseせずに原因を読めるようにした。既存codeとmessage形式は変更していない。

| code | 条件 | `details` |
|---|---|---|
| `INVALID_SCHEMA` | Schema文書・ID・version・引数値が不正、draft未開始、flag OFF | `schemaId`、`schemaVersion` |
| `SCHEMA_NOT_FOUND` | 参照先Schemaが登録されていない | `schemaId`、`schemaVersion` |
| `SCHEMA_VALIDATION_FAILED` | 候補値がSchemaに適合しない | `dataName`、`schemaId`、`schemaVersion`、`path`、`expected` |

`path`と`expected`は共通validatorの診断から取り出す。messageは診断文をそのまま含めるので、
同じ不適合が名前付き関数の引数と同じ文面で読める。例:

```text
SCHEMA_VALIDATION_FAILED: Structured data sensor does not match schema reading@1.4.2: $.samples[1] must be number
details = {dataName: "sensor", schemaId: "reading", schemaVersion: "1.4.2", path: "$.samples[1]", expected: "number"}
```

`path`は共通validatorの表記（`$.a[0].b`）である。識別子にならないkeyでは
path blockが受ける`$["a-b"]`形式ではなく`$.a-b`と表示される。
診断文面を関数側と一致させることを優先した結果であり、意図的な差である。

## 視覚Schema定義

`begin schema`／`add property`／`commit schema`を積むと、同じ形のテキスト定義と同一のcanonical Schemaになる。
canonical形はkeyをソートしたJSON表現で、`required`もソートするため、propertyを並べる順序は結果に影響しない。
blockそのものがproject fileに保存されるので、保存・再読込後も同じ定義が再構築される。

初回範囲はobject 1階層である。propertyの型はsubsetの7種から選び、入れ子や`items`、数値・長さ制約は
`define schema`のテキスト定義で指定する。専用のC字blockとdropdown menuは後続とする。
この拡張は現在menuを持つblockを一切使っていないため、`EXTRA`と`REQUIRED`は検証付きの文字列引数にした。

## named-data連携

providerはbindingのschemaRefを`stat`／`openBody`のmetadataへ載せる。payload形式とlifetimeは変えていない。
公開には2つのflagが揃う必要がある。

| `STRUCTURED_SCHEMA` | `NAMED_DATA_SCHEMA_REF` | 結果 |
|---|---|---|
| OFF | 任意 | Schema blockなし。bindingはschemaRefを持たない |
| ON | OFF | bindingはschemaRefを持つ。schemaRef付き要求は`NAMED_DATA_SCHEMA_UNRESOLVED`。通常要求は従来どおり |
| ON | ON | schemaRef付き要求が一致したbindingを解決し、metadataにschemaRefを載せる |

consumerはschemaRefのID＋versionが完全一致する場合のみ解決できる。
一致しない場合は`NAMED_DATA_SCHEMA_VERSION_MISMATCH`、schemaRefを持たないbindingへschemaRef付きで要求した場合も同じcodeになる。
providerはSchema本体を配らないので、consumerは自身のcatalogでIDを解決し、同じsubsetのvalidatorで値を検証する。
共有Schema registryそのものは[turbowarp-named-data #7](https://github.com/kubohiroya/turbowarp-named-data/issues/7)の契約確定後とする。

## parity fixture

[tests/fixtures/schema-parity.json](../tests/fixtures/schema-parity.json)はsubsetのkeywordごとに
受理・拒否と期待する`path`・`expected`を並べる。testは各caseをJSONとYAMLの両方で実行し、
同じ結果と同じ診断になることを確認する。fixtureは共通validatorのentry pointを記録するので、
server compilerは同じ入力で同じ判定を再現できる。

## ローカル検証記録（2026-10-25）

- 基準: 公開main `7ff849b`。
- test 135件（追加25件）、型検査、ESLint、docs生成確認、standalone／editor metadata／module build、
  dist確認、package export・repo policy確認が成功。
- standalone JSは258,455 Bから283,469 Bへ増加した。共通validator、Schema module、追加9 blockの定義分である。
  tree-shakingによりnamed-functionsからは検証器のみが入り、function registry／dispatcherは入らないことを確認した。
- 実ブラウザでの表示確認、npm公開、PR、mergeはこのローカル検証に含めない。
