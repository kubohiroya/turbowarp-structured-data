# Structured Dataの最小デモ

- 配布: [`edit-json-profile.sb3`](https://kubohiroya.github.io/turbowarp-structured-data/samples/edit-json-profile.sb3)
- 起動: [TurboWarp Editor](https://turbowarp.org/editor?project_url=https%3A%2F%2Fkubohiroya.github.io%2Fturbowarp-structured-data%2Fsamples%2Fedit-json-profile.sb3)
- 操作: **Run without sandbox**を選んで**Allow**し、緑の旗を押します。
- 内容: `parseJson`で名前と点数を登録し、`setJsonAtPath`で点数を更新、`getJsonAtPath`で表示
- 期待結果: 更新した点数が8になり、名前TurboWarpを保持したJSONが表示されます。

このサンプルは拡張生成時だけ`STRUCTURED_DATA_MVP`を有効にし、直後にホストの設定を元に戻します。拡張本体の既定OFFは変更しません。

`manifest.json`に拡張ID・JSパス・sandbox条件・期待結果を記録しています。
`edit-json-profile/project.json`と自作SVGを編集し、次のコマンドで再生成します。

```bash
pnpm run samples:build
pnpm run samples:check
pnpm run pages:build
```

Node.jsは`.nvmrc`指定版を使います。サンプル生成に追加依存はありません。
生成したSB3もコミットし、`_site/`のdocs・dist・SB3をPagesへ公開します。
unsandboxed拡張は検証対象JSをSB3へ同梱し、利用者が通常の同意画面で許可します。
sandbox互換の拡張はPages上のJSを参照します。

緑の旗で毎回入力から結果を生成します。停止してから再実行できます。

切戻しはサンプル・READMEリンク・Pages配信設定の追加をrevertします。
