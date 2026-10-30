# 文書原文から構造化データへの明示的な投影

`@kubohiroya/turbowarp-structured-data/document-source` は、Document Data の原文 provider と structured runtime を接続する GUI 非依存の入口です。

```js
import {createDocumentSourceProjection} from '@kubohiroya/turbowarp-structured-data/document-source';
const projection = createDocumentSourceProjection({documents: sourceDocumentRegistry, runtime});
const target = {};
projection.project(target, 'settings', {providerId: 'document-data', documentId: 'settings'});
const value = projection.get(target, 'settings')?.value;
```

registry のメタデータに `json` / `yaml` 形式が必要です。投影は `open()`・`capture()` で原文を読み、共通 YAML/JSON codec の変換がすべて成功してから target の値を置き換えます。失敗した候補は既存の値を変更しません。読み取りハンドルは成功・失敗のどちらでも閉じます。

`project` の再呼出しで明示的に再投影します。原文が変更されても値を自動で置き換えません。値の変更を理由に原文を再 serialize / prepare / commit しません。コメント・引用符・改行等を含む原文は Document Data / 所有者に保持されます。

`runtime` を指定すると停止で投影の target 状態だけを消し、`RUNTIME_DISPOSED` / `PROJECT_LOADED` による作品の入れ替えでも一時状態を消し、同じ cached extension / adapter で再投影できます。明示的な `dispose()` だけが購読を解除して恒久終了します。元の文書は保持されます。`clearTarget`・`clear`・`dispose` も利用できます。任意の `publish` は検証済みの全候補を受け取る sink であり、失敗時には sink 自身も以前の値を維持する必要があります。

`StructuredDataExtension.createSourceProjection(documents)` はこの sink を既存 runtime bindings に接続し、従来の JSON/YAML・パス・Named Data API から値を利用可能にします。`STRUCTURED_DATA_MVP` に加え、新しい `STRUCTURED_DOCUMENT_SOURCE` も既定 OFF です。`src/config.ts` の読取関数を constructor で一度だけ呼び、起動後の値変更では切り替えません。両方が ON の場合だけ拡張の接続を作れます（テストでは constructor の第 5 引数で明示可能）。pure `./document-source` API は関数の呼出し自体が明示的な opt-in です。停止時には runtime bindings と投影状態をともに消去します。新しい Scratch ブロックは追加しません。

## Schema の読み取り

`extension.getSchemaResolver(target)` は既存の Schema registry の読み取り専用窓口です。`resolve({id,version})` は完全な SemVer と ID の一致だけを受け入れ、コピーを深く凍結して返します。範囲指定や暗黙の latest はありません。

返却サービスの `profile` は `structured-subset` です。`inline(ref)` は `{profile, reference, document}` を返し、full JSON Schema の inline metadata と取り違えない形にしています。従来どおり named-functions の同じ subset 検証器を利用し、未知のキーワードの意味を変更しません。full JSON Schema / Ajv2020 への自動変換は行いません。

## 互換性・切戻し

既存 codecs は共通 codec の互換 adapter に置き換え、エラーコード・主要診断・256 KiB / 深さ64 / ノード50,000制限・Unicode code point 順の出力を維持します。パース後に拡張された従来の runtime 値の出力には、値の制限を追加しません。

新 API を利用せず従来の parse ブロックを使えば文書連携を切り戻せます。runtime から原文への暗黙の書き戻しや、保存済み作品の移行はありません。
