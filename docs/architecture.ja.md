# アーキテクチャ

[English](architecture.md)

任意のNamed Data統合は、canonical契約とruntime共有registryを
`@kubohiroya/turbowarp-named-data/composition`からimportします。`structured` providerは
`kind: structured`、target scope、persistent登録として接続します。`PROJECT_STOP_ALL`では
target bindingとopen bodyをclearしますが、次のproject sessionでもprovider登録を維持します。

structured-data、document-data、binary-data、Asset Manager、HTTP Serverを名前付き参照とHTTP body供給契約で接続する段階計画は[Named Data統合計画](named-data-integration-plan.ja.md)を参照してください。

## 名前付きデータmodel

機能拡張は`WeakMap<Target, Map<Name, JsonValue>>`を所有します。nameはtrim済みの空でないstringです。spriteとstageは別namespaceです。parseはbindingをatomicに置換し、path更新は新しいJSON valueを構築して検証成功後だけbindingを置換します。`PROJECT_STOP_ALL`でregistryとiteration stackを交換するため、runtime stateはproject停止後に残りません。

JSON valueは`null`、boolean、有限number、string、array、own enumerable propertyだけを持つobjectです。opaqueな内部tokenを公開block境界へ渡しません。Scratch reporter型の制約により必要なparse、render、set value、get value、keys、current value境界だけでJSON/YAML textを使います。文字列で返すreporter（`text from … at path`、`current text at path`）は、stringをそのまま、numberとbooleanをcanonical JSONの表記で返し、null・array・objectは文字列にせず`TYPE_MISMATCH`で失敗します。

## codecと上限

`src/codecs.ts`はJSONを共有core、YAMLをYAML ASTでparseします。両方とも入力256 KiB、深さ64、50,000 nodeを上限とします。YAML alias、parser warning、duplicate key、unknown tag、string以外のkey、未対応scalarはnamespace binding変更前に失敗します。

canonical JSONはobject keyを再帰的にUnicodeコードポイント順へ揃えます。YAMLも同じ順序を使い、string scalarをquoteし、identifier形式のkeyだけをquoteなしで出力します。

## pathと反復

`src/core.ts`は制限付きpathを型付きkey/index segmentへ変換し、不変get、has、set、delete、keys、length、iteration entry生成を実装します。loop entry snapshotは決定的です。active loop frameはTurboWarp threadをkeyとする別の`WeakMap`に保持し、nested loopはstackになります。`current value at path`と`current text at path`はstack最上段のframeの値にpathを適用するため、最も内側のloopを読みます。frameがなければpathを解釈する前に`ITERATION_CONTEXT_REQUIRED`で失敗します。

## compiler manifest v3

manifestはtarget scope、project停止までのlifetime、`jsonValue`内容を持つnamed referenceを宣言します。各opcodeはargument、result型、effect（`pure`、`state`、`control`）、error、IR v2 operationを持ちます。server adapterは同等のtarget-local slot環境を提供し、未対応manifest versionを拒否します。

`tests/fixtures/semantic-parity.json`をnamespace、codec、path、結果、error意味論のbrowser/server共通契約とします。`cases`は値をparseし、必要ならpathを更新してrenderします。`readCases`はreporterをIR operation（`structuredData.getText`、`structuredData.currentGet`、`structuredData.currentGetText`と、対応するJSON版）で指定し、必要なら先に入れ子のloopを指定した要素まで進めてから、文字列・JSON・error codeを期待値として照合します。
