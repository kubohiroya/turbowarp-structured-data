# 段階2の安定版検証記録

公開予定版: `@kubohiroya/turbowarp-structured-data@0.6.0`。JSON/YAML のTEXTとpath操作のVALUEを接続し、既存サイズ・深度・node・alias制限を維持します。

| opcode | 入力 |
| --- | --- |
| parseJson | TEXT |
| parseYaml | TEXT |
| setJsonAtPath | VALUE |

正本は共通 `src/json-value.ts` と既存 `src/codecs.ts` / `src/core.ts` のpure検証です。JSON/YAMLのroot型・配列・object・scalarを明示操作で編集します。runtimeの任意Schemaとの連動は追加しません。

共通依存は `76fa1d50a3c188082ceef723ea018a9d8769ea6e`（`@kubohiroya/turbowarp-extension-data-editor` 0.2.0）へGitの完全SHAで固定しています。manifest・lock・build許可・fresh実解決を揃え、直接・AJV経由のfast-uriを3.1.8へ統一しています。古い共有aliasの実解決を安定版の検証として流用していません。

`react-dom@18.3.1` は実際のRJSF registration回帰テストに必要なdev依存として追加しました。拡張のruntimeコードはGUIのoptional APIを使い、ReactDOMを拡張bundleへ追加しません。

Node v22.23.3 / pnpm 11.11.0で、空の専用storeからscripts有効の `pnpm install --frozen-lockfile` を実施しました。Git prepareから得た共通packageにはsrcが含まれず、build-infoは上記SHAと一致します。

- 全テスト 40件、型検査、全lint、build、文書/リポジトリ検査、pack検査が成功しました。
- production auditはcritical/high/moderate/lowすべて0件です。
- dist 2件は2回のbuildでSHA-256が一致し、異なるcheckout pathのfresh fixtureと作業cloneでも全件のbytesが一致しました。
- Vite8を使う場合の生成region行にはpackage storeのpathが入るため、そのマーカー行だけを省きます。licenseコメントと実行コードは保持します。Vite7のrepoにはこの追加処理を適用しません。

過去の段階2ローカル全体659件・実GUI5ケース（各8手順）は別の保存済み記録です。今回の数は当該repoのfresh full結果であり、繰り返し実行を合算していません。GitHub CIの結果はPRで別途確認します。

GUIの起動時固定・既定OFFの `blockEditorSourceForms` と `blockEditorDialogs` の両方、および信頼した拡張のunsandboxed読込を必要とします。旧API、ブロックのopcode/入力、raw保存形式を保持し、無変更・Cancelでは元の入力を維持します。検査した候補だけを保存し、複数入力はatomicに保存します。Schema自体の編集・動的Schema・既存候補への新規項目追加はこの段階に含みません。

ロールバックはflagをOFFにして再読込します。コードを戻す場合はconsumer→producer→共通の逆順でrevertし、manifest・lock・実解決を一体で戻します。以前の公開版 `@kubohiroya/turbowarp-structured-data@0.5.1` へ固定できます。保存形式を自動移行しません。
