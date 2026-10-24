# 編集metadataとruntimeの境界

追跡: [共通data-editor #72](https://github.com/kubohiroya/turbowarp-extension-data-editor/issues/72)。
Camera Source #52と同じ責務分担を適用する。

| 担当 | 責務 |
| --- | --- |
| Structured Data | JSON/YAMLの既存parser、名前付きデータ、path/反復、正本Schema、原文decoder、pure owner検証、編集binding |
| 共通data-editor／GUI | 編集時のSchema compile、Schema制約の診断、フォーム描画、保存／Cancel、transaction |

`sourceBinding.validateSource` は原文を保持して既存ownerのreader/checkerを実行し、Schemaをcompileしない。
共通GUIは宣言されたSchemaBundleを検証してから保存する。独自consumerがSchema keyword別診断を必要とする場合は、
consumer自身が共通data-editorのSchema検証を組み合わせる。owner callbackの診断はSchema診断の代わりにはしない。

`@kubohiroya/turbowarp-structured-data/editor-metadata` はSource/Formの3定義と固定MAX入力の1定義を公開する。
この入口はGUI/DOM/VMを参照せず、実行時importは既存production依存の`yaml`だけである。
共通のJSON値SchemaBundleと新数値入力parserは開発依存の正本をビルド時に取り込み、手書きの複製を作らない。
型宣言で共通型を利用するTypeScript consumerは、自身の開発依存にdata-editorを追加する。

data-editorの直接依存をdevDependenciesへ移す。standalone JSとmetadataにはAjv、ajv-formats、Schema compiler、
React/RJSFを含めない。Viteのmodule graph guardと隔離importテストで再流入を検出する。
通常のYAML解析はruntime機能なので維持する。yaml本体の複数拡張間共有は[sb3-toolchain #65](https://github.com/kubohiroya/sb3-toolchain/issues/65)の後続課題である。

既存のMVP・GUI編集フラグ、Extension ID、opcode、MAXの文法・範囲、既存raw値と無変更保存、Undo transactionを維持する。
問題時はGUI編集フラグをOFFにして再読込し、必要なら検証済みのexact pin・lock・生成物へ一組で戻す。
保存済みデータを自動移行しない。

開発時は`pnpm run build`でstandaloneと公開metadataを生成してから対象テストを実行する。
ローカルの対象テストは実GUIや実機の代替であり、ブラウザ上の表示確認を実施した意味にはしない。

## ローカル検証記録（2026-10-24）

- 基準: 公開main `4ae44bd6ee1d`。standalone JSは560,962 Bから256,729 Bへ変更。
- gzip level 9（参考値）は119,711 Bから58,861 B。SB3削減量や実行時RAMの測定値ではない。
- 対象テスト82件、型検査、変更したTypeScriptのESLint、standalone／metadata build、package export・repo policy確認が成功。
- GUIなしVMで通常登録1回、Ajv生成0回、編集用SchemaBundle compile 0回。2拡張をsb3-toolchain 0.16.0で束ねても同じ結果。
- 共通サービス経由のSchema制約拒否、owner受理条件、raw no-op／変更時commit、旧GUIでの非登録、隔離metadata importを確認。
- 実ブラウザ・3D描画・実カメラの確認、push、PR、merge、npm公開はこのローカル検証に含めない。
