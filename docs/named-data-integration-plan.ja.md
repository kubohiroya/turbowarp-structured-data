# Named Data統合計画

## 目的

structured-data、将来のdocument-dataとbinary-data、既存のAsset Manager、HTTP Serverを、名前付きデータ参照とHTTP body供給契約で接続する。

共通化する対象は各データ型の内部表現や編集APIではない。HTTPレスポンスへ安全に変換できる名前付きresourceの識別、metadata、解決、lifetime、error意味論を共通化する。HTTP ServerはJSON、YAML、HTML、Markdown、画像、音声その他のbinaryを、各providerのprivate stateへ依存せずresponse bodyとして利用できるようにする。

## 現状と課題

### structured-data

- targetごとの名前付きregistryにJSON valueを保持する
- JSON/YAMLのparseとserialize、path操作、反復を提供する
- registryは機能拡張内部に閉じており、別の機能拡張から名前を解決できない
- valueはproject停止時に破棄され、project fileへ永続化しない

### Asset Manager

- 名前付きasset registryで画像、音声、text、project assetを扱う
- APIではArrayBufferまたはUint8Arrayを名前付きassetとして登録できる
- composition APIにはnamespaceとnameを使うbinary bundle storeがある
- Asset Manager固有のasset操作と汎用binary resourceの責務が一部重なる

### HTTP Server

- `/@assets/<name>`で外部capabilityが提供する名前付きresourceを配信できる
- handler blockのresponse bodyは主にtext、HTML、JSON文字列を受け取る
- IR v2には再利用可能なbinary-refと、一回だけ消費できるbinary-bodyがある
- structured-dataやdocument-dataの名前を共通response bodyとして解決する契約がない

各機能拡張が独自registryとHTTP連携を実装すると、名前のscope、MIME type、byte上限、stream ownership、error code、停止時の解放が重複して不整合になる。

## 設計原則

1. 名前付き参照をbyte列やdata URLとしてScratch reporterへ埋め込まない。
2. JSON/YAML、HTML/Markdown、binaryの保存形式と編集意味論は各providerが所有する。
3. HTTP Serverはproviderの内部表現を参照せず、共通body resolverだけを利用する。
4. 暗黙変換を避け、representationとMIME typeを明示またはproviderの既定値から決定する。
5. requestのstream bodyと、保存済みnamed dataを別の型として扱う。
6. size、depth、node count、byte count、stream消費回数に上限を設ける。
7. 段階導入は既定OFFの起動時feature flagで行う。
8. browser runtimeとserver compilerで参照、error、lifetime意味論を一致させる。

## 対象モデル

| provider | 入出力形式 | 内部表現 | provider固有の操作 |
|---|---|---|---|
| structured-data | JSON、YAML | JSON value | path参照、更新、削除、key列挙、反復 |
| document-data | HTML、Markdown | kindを保持するdocument treeまたはAST | selector、属性、text、子node、render |
| binary-data | 任意のMIME | bytesまたはstream backing | size、digest、range、import、export |
| Asset Manager | 画像、音声、costume、backdrop、runtime text | asset binding | render、play、sprite/stage適用 |

Asset Managerはbinary-dataの置き換えではない。汎用binaryを画像や音声として利用するconsumer兼specialized providerとする。

### 共通参照

共通参照は次の論理fieldを持つ。

| field | 意味 |
|---|---|
| namespace | providerまたは用途の衝突を避ける安定ID |
| name | namespace内の論理名 |
| kind | structured、document、binary、asset |
| scope | targetまたはproject |

target scopeはsprite／stageごとに分離し、project scopeはHTTP公開resourceや共有assetに使用する。Scratch blockでは当面namespaceとnameを別argumentとして渡す。未検証のJSON文字列や区切り文字入りtokenを参照形式にしない。

初期namespaceはstructured、document、binary、assetを予約する。providerの二重登録、unknown namespace、kind不一致、scope不一致は安定errorとして拒否する。

### 共通metadata

| field | 規則 |
|---|---|
| mediaType | parameterを含む正規化済みMIME type |
| byteLength | encode前に確定できない場合は省略可能 |
| digest | 利用可能ならsha256とlowercase hexadecimal |
| revision | atomic replacementを識別し、ETag生成に利用可能 |
| replayable | 保存済みnamed dataでは原則true |

### HTTP body供給契約

providerはstatとopenBodyを提供する。openBodyは次を返す。

- mediaType
- 任意のbyteLength、digest
- revision
- Uint8ArrayまたはReadableStream
- 必要な場合のrelease callback

HTTP Serverはこの結果からContent-Type、可能ならContent-LengthとETagを設定する。client切断時はAbortSignalを伝播し、完了または失敗時にreleaseを高々一回呼ぶ。

| kind | representation | MIME type |
|---|---|---|
| structured | json | application/json; charset=utf-8 |
| structured | yaml | application/yaml; charset=utf-8 |
| document | html | text/html; charset=utf-8 |
| document | markdown | text/markdown; charset=utf-8 |
| binary | raw | 登録時のMIME type |
| asset | raw | assetのMIME type |

structured-dataとdocument-dataのencode結果はUTF-8 bytesとして渡す。binary-dataとAsset Managerはbase64やJavaScript stringへ変換せずbytesまたはstreamを渡す。

## Block API案

### 共通namespace操作

providerごとにblock色と専門用語は維持しつつ、次の表層を揃える。

- named dataが存在するか
- named dataを削除
- named dataを別名へcopy
- named dataのMIME type
- named dataのsize

copyやsizeを提供できないproviderは初期versionでblockを公開せず、偽の値を返さない。

### HTTP response

HTTP Serverに次の共通操作を追加する。

- set response body from NAMESPACE named NAME as REPRESENTATION
- respond with NAMESPACE data NAME as REPRESENTATION

既存のJSON、HTML等のresponse blockを維持する期間は、内部で同じresponse builderへloweringするcompatibility wrapperとする。新規compiler IRでは共通operationをcanonical formとする。

### HTTP request

request bodyは保存済み参照と同一視しない。

- current request bodyをbinary data NAMEとして保存
- current request bodyをJSONまたはYAMLとしてparseしNAMEへ登録
- current request bodyをHTMLまたはMarkdown documentとしてparseしNAMEへ登録

IRのbinary-bodyはaffine resourceとして最大一回consumeする。保存またはparseが成功した後に、再利用可能なnamed dataをatomicに登録する。失敗時に既存bindingを変更しない。

## Registryとprovider境界

共通registryは特定format拡張のprivate fieldには置かない。小さなruntime-neutral packageとして定義し、TurboWarp runtimeごとに一つのserviceを生成する。候補package名は @kubohiroya/turbowarp-named-data とする。

共通packageの責務:

- provider登録と解除
- namespace衝突検査
- target／project scopeの解決
- project停止時の一括release
- metadataとbody resolverの型
- stable error codeと上限policyの共通部分

共通packageはJSON path、DOM、Markdown、codec、binary永続化、HTTP routingを所有しない。

### lifetime

- target scopeはtarget identityに結び付ける
- project scopeはruntime identityに結び付ける
- PROJECT_STOP_ALLでsession-only bindingとopen bodyを解放する
- persistent binary backingはbindingと分離し、明示deleteまたはretention policyで管理する
- provider交換時は新規解決を停止し、open済みbodyのrelease完了後に解除する

## Compiler／IR統合

IR v2のbinary-refをbinary専用の例外として増殖させず、named data参照を表現できるdescriptorへ一般化する。descriptorはnamespace、name、kind、scopeと、任意のmediaType、byteLength、digestを持つ。byte payloadはIR JSONへ格納しない。

既存binary-refはkindがbinaryまたはassetのdescriptorとして読めるmigration adapterを設ける。binary-bodyはstream resourceなのでvalue descriptorへ統合しない。

target adapterはnamespace provider、representation、stream response、response size、binary-read effect、scopeの対応状況を検査する。未対応時にtextやbase64へ暗黙fallbackしない。

## Errorと安全性

共通層では少なくとも次の安定errorを定義する。

| code | 条件 |
|---|---|
| NAMED_DATA_INVALID_REF | namespace、name、kind、scopeが不正 |
| NAMED_DATA_PROVIDER_NOT_FOUND | namespace providerが未登録 |
| NAMED_DATA_NOT_FOUND | bindingが存在しない |
| NAMED_DATA_KIND_MISMATCH | requested kindと登録kindが異なる |
| NAMED_DATA_SCOPE_MISMATCH | target／project scopeが不一致 |
| NAMED_DATA_REPRESENTATION_UNSUPPORTED | requested representationをencodeできない |
| NAMED_DATA_BODY_TOO_LARGE | encodeまたはrequest保存上限を超えた |
| NAMED_DATA_ABORTED | client切断等で処理を中止した |
| NAMED_DATA_PROVIDER_RELEASED | 解放済みproviderを参照した |

安全要件:

- HTML出力を自動sanitize済みとみなさない
- MarkdownからHTMLへの変換はactive content policyを明記する
- MIME sniffingに依存せずproviderがMIME typeを確定する
- active contentを配信するrouteへauthorizationとCSPを設定可能にする
- request body、encode結果、binary rangeに個別上限を持たせる
- logへbody bytesや機密document内容を記録しない

## 段階的な実装計画

各項目は別Issue／小粒PRとし、依存、受け入れ基準、rollback、feature flagをIssue本文へ記載する。

### Phase 0: 契約の固定

推奨branch: docs/named-data/body-provider-contract

- common type、scope、lifetime、error、representationをschemaまたはTypeScript declarationとして固定
- 各repositoryのcompatibility matrixを作成
- browser/server共通contract fixtureを作成

受け入れ基準:

- payloadを含まない参照schemaをvalidationできる
- target/project scopeと全representationのfixtureがある
- duplicate provider、unknown namespace、unsupported representationのerror期待値がある

rollback: documentationと未使用typeだけを除けばruntime挙動が変わらない。

### Phase 1: 共通registry MVP

推奨branch: feat/named-data/registry-mvp

依存: Phase 0

- runtime単位のprovider registryとscope resolverを実装
- provider登録、stat、openBody、releaseを実装
- NAMED_DATA_REGISTRY_MVPを起動時固定、既定OFFで追加

受け入れ基準:

- private objectをScratch reporterへ返さず名前から解決できる
- project停止後にsession bindingとopen resourceが残らない
- provider失敗時にもstateが部分更新されない
- flag OFFで既存extensionの挙動が変わらない

rollback: flag OFFでcommon registryへの登録と解決を完全に迂回する。

### Phase 2: structured-data provider

推奨branch: feat/structured-data/named-body-provider

依存: Phase 1

- 現在のtarget-local bindingをstructured providerから参照可能にする
- jsonとyamlをUTF-8 bodyとして公開
- canonical encode、上限、atomic replacementを既存実装と共有

受け入れ基準:

- 既存serialize blockとbody resolverの結果が一致する
- 別targetのtarget-local bindingを参照できない
- encode失敗時にHTTP responseを部分送信しない
- browser/server parity testが通る

rollback: provider登録flagをOFFにし、既存blockだけを維持する。

### Phase 3: binary-data providerとAsset Manager adapter

推奨branch: feat/binary-data/provider-mvp

依存: Phase 1

- session-only named byte／stream registryを実装
- MIME type、byte length、digest、revisionを保持
- Asset Managerのassetをasset namespaceからread-only bodyとして公開
- persistent backingは別feature flagでadapter

受け入れ基準:

- base64やstringへ変換せずHTTP bodyへ渡せる
- asset replacement後にrevisionが変わる
- open中のsnapshotはreplacementの影響を受けない
- unsupported kindをempty bodyとして返さない

rollback: provider／adapter flagをOFFにし、既存asset registryを維持する。

### Phase 4: HTTP Server response統合

推奨branch: feat/http-server/named-response-body

依存: Phase 2、Phase 3

- named body resolverをhandlerとcompiler adapterへ注入
- 共通response blockとIR operationを追加
- Content-Type、Content-Length、ETag、abort、releaseを接続
- 既存format別response blockを共通builderへlowering
- NAMED_RESPONSE_BODYを既定OFFで追加

受け入れ基準:

- structured JSON/YAMLとbinary assetを同じ共通blockから返せる
- HEADはGETと同じmetadataをbodyなしで返す
- client切断時にabortが伝播する
- body bytesをlogへ記録しない

rollback: flag OFFで新block／IRを拒否し、既存response pathへ戻す。

### Phase 5: document-data MVP

推奨branch: feat/document-data/html-markdown-mvp

依存: Phase 1。HTTP統合検証はPhase 4にも依存する。

- HTMLとMarkdownのkindを保持するnamed document registryを実装
- parse、node操作、serializeの最小集合を定義
- htmlとmarkdown representationをbody providerとして公開
- lossy変換を明示し、既定では元kindと同じrepresentationを使う

受け入れ基準:

- 文字列連結ではなくnamed documentとして段階編集できる
- parse、node、serialize上限がある
- format変換が行われたか判別できる
- HTMLを自動的にsafeと表示しない

rollback: document provider flagをOFFにし、既存text responseを維持する。

### Phase 6: request body import

推奨branch: feat/http-server/named-request-import

依存: Phase 2、Phase 3、Phase 5

- affineなbinary-bodyからbinary-dataへ保存するconsumerを追加
- 明示的JSON、YAML、HTML、Markdown parse blockを追加
- consume、abort、limit、atomic registrationをruntimeとcompilerで一致させる

受け入れ基準:

- request bodyを最大一回だけconsumeできる
- parse／保存失敗時に既存bindingを置換しない
- Content-Typeを暗黙推測しない
- compilerが二重consumeとscope外利用を拒否する

rollback: import flagをOFFにし、既存text request body reporterを維持する。

### Phase 7: compatibility API整理

推奨branch: refactor/http-server/body-api-convergence

依存: Phase 4からPhase 6の利用実績と回帰試験

- format固有blockをwrapperとして維持するものとdeprecatedにするものへ分類
- manifestとdocumentationでcanonical operationを一本化
- default ON条件と削除versionを別Issueで承認

受け入れ基準:

- 既存projectのmigration手順と互換性表がある
- default ON前に全providerの回帰、負荷、abort testが通る
- flag OFFによる切戻し手順をrelease noteで確認できる

rollback: compatibility wrapperと旧IR loweringを一つ以上の移行期間保持する。

## 依存関係

Phase 0からPhase 1を直列に実施する。Phase 1完了後、Phase 2、Phase 3、Phase 5は並列化できる。Phase 4は最低限Phase 2とPhase 3のfixtureを使って統合検証する。Phase 6は各providerの完成後、Phase 7は運用実績取得後に着手する。

## 共通Definition of Done

- GitHub Issueにbranch、依存、受け入れ基準、rollback、feature flagを記載
- public type、manifest、schema、block definition、実装を一致
- unit、semantic parity、browser integration、server compiler testを追加
- repository既定のlint、format、typecheck、testを通過
- size、abort、lifetime、atomicity、二重consumeのnegative testを追加
- bodyまたは機密値をlogへ出さないことを検証
- scope、lifetime、MIME type、上限、error、migrationを文書化
- feature flag OFFで従来挙動へ戻せることを確認

## Phase 0で決める未決事項

1. common registryを独立packageにするか共有workspace packageとして開始するか
2. project scopeの名前がsprite clone間でどのように見えるか
3. namespaceとnameをScratch block上でmenuにするか自由入力にするか
4. structured/documentを事前bufferする最大sizeとstreaming開始条件
5. ETagへdigestとrevisionのどちらを使うか
6. binary range responseをMVPへ含めるか
7. persistent backingのretention、quota、project exportとの関係
8. HTML sanitizerをdocument-dataの別operationとするか別providerとするか

これらを暗黙の実装判断にせず、contract fixtureとIssueの受け入れ基準へ反映してからruntime変更へ進む。
