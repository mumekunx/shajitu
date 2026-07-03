# update.md — lesson13 進捗ログ

## 2026-07-04 — 段階式ヒント機能の追加
### 依頼内容
各ステージ(特にSTAGE0/2/3)が難しすぎるとのユーザーからのフィードバックを受け、段階式にヒントを表示する機能を追加する。

### 実装計画
共有CSSに `.hint-box` / `.hint-btn` / `.hint-line` の汎用クラスを追加し、共有JSに `setupHints(btnId, areaId, hints)` ヘルパーを追加する。ボタンを押すたびに hints 配列から次の1件を `.hint-line` として表示エリアに追加し、全部出し切ったらボタンを disabled にする。STAGE0・STAGE2・STAGE3それぞれにこのヘルパーを適用する。STAGE3は既存の「3回失敗で出現するヒント」の仕組みを撤去し、最初から見える段階式ヒントに置き換える。既存のゲームロジック・テキスト・デザインは変更しない。

### 影響範囲
`lesson13/index.html`(共有CSS・共有JS・STAGE0/STAGE2/STAGE3のHTML/CSS/JS)、`lesson13/detail.md`、`lesson13/tasks/todo.md`。

### 進捗
共有CSSに `.hint-box` / `.hint-btn` / `.hint-line`(+ `hintFadeIn` アニメーション、モバイル用 `@media (max-width:480px)` 追加ブロック)を追加し、共有JSに二重バインド防止付きの `setupHints(btnId, areaId, hints)` ヘルパーを追加した。STAGE0(`s0-hint-btn`/`s0-hint-area`)・STAGE2(`s2-hint-btn`/`s2-hint-area`)にヘルパーを適用してヒントボックスのHTMLとJS呼び出しを追加。STAGE3は旧来の「3回失敗でヒントボタンが出現し固定ヒント1件を表示する」仕組み(`hintText`/`s3-hint-text`、`failCount >= 3` の分岐)を撤去し、最初から見える段階式ヒント(`s3-hint-btn`/`s3-hint-area`、`setupHints`)に置き換えた。

検証として、全`<script>`ブロックを抽出・連結して `node --check` を実行し構文エラーがないことを確認した。また `grep -o 'id="[^"]*"' | sort | uniq -d` でid重複がないことを確認した(唯一の重複ヒットはJS文字列テンプレート `id="' + id + '"` の2箇所で、実際のHTML idではないため問題なし)。`setupHints` がSTAGE0/2/3の3箇所で正しく呼ばれていることもgrepで確認済み。

### ステータス: 完了

2026-07-04 追記: STAGE3のヒントボタンが紙背景上で低コントラストだったため、.paper 上では赤スタンプ調(--stamp)にするCSSを追加

## 2026-07-03 17:14 — METADOR FILE 脱出ゲーム 立案
### 依頼内容
実在するAPTグループ「Metador」を題材にした脱出ゲーム形式のインタラクティブWebアプリを作成する。単一の index.html として実装し、GitHub Pages での公開を想定する。

### 実装計画
以下のステージ構成で単一ページアプリを構築する。

- **STAGE0**: パスワードロック画面(答え: METADOR)
- **STAGE1**: コルクボードUIで証拠6枚を閲覧
- **STAGE2**: 証拠カードを赤い糸で結ぶマッチングパズル
- **STAGE3**: シーザー暗号の解読(鍵: BULLFIGHTER)
- **STAGE4**: 3つの仮説(国家関与 / 高級傭兵 / 単独ハッカー集団)から動機を推理して選択
- **ENDING**: 選んだ仮説に応じたテキストを表示。「正体は未解明であり、これは創作上の仮説である」旨を明示し、クリアタイムを表示する

UIはダークな法執行機関(捜査ファイル)風のトーンで統一し、スマートフォン表示にも対応する。外部ライブラリは使用せず、HTML/CSS/JSのみで完結させる。

実装体制は共有仕様書(SPEC)を先に作成し、それに基づいて以下4パーツを並列で作業する。
1. HTML骨格 + CSS + コアJS(状態管理・画面遷移など共通基盤)
2. STAGE0(パスワードロック) + STAGE1(コルクボード証拠閲覧)
3. STAGE2(赤い糸マッチングパズル)
4. STAGE3(暗号解読) + STAGE4(仮説選択) + ENDING

各パーツ完成後、アセンブラ役が index.html に結合し、結合後に動作検証(JS構文チェック・スモークテスト等)を行う。

### 影響範囲
- `lesson13/index.html` を新規作成(本体)
- `lesson13/detail.md` を新規作成(ファイル構成ドキュメント)
- `lesson13/tasks/todo.md` を新規作成(タスクリスト、本エントリと同時作成)
- 既存ファイルへの影響なし(lesson13 は新規フォルダ)

### 進捗
2026-07-03、共有仕様書(SPEC)に基づき Sonnet サブエージェント4体を並列起動してパーツを作成した(①HTML骨格+CSS+コアJS ②STAGE0-1 ③STAGE2 ④STAGE3-4-ENDING)。アセンブラ役が全パーツを `lesson13/index.html`(1906行、単一ファイル・外部ライブラリ不使用・Google Fonts CDNのみ)に結合し、静的検証(構文チェック・ID重複チェック・パーツ間マーカー残存チェック)をクリアした。

続けて jsdom によるスモークテストを22項目実施し、全項目通過を確認した。検証項目には、パスワードのスペルミス1文字までを許容する解錠(METADOR/MATADOR判定)、証拠6枚すべて閲覧後のNEXT出現、シーザー暗号(シフト3)の復号、キーワード BULLFIGHTER による正誤判定、仮説選択からエンディング遷移、免責文とクリアタイムの表示、実行時エラーが発生しないこと、が含まれる。

この過程で統合バグを1件検出・修正した。STAGE1のNEXTボタンを表示する際に `style.display = ''` としていたため、CSS側の `#stage-1 #s1-next{display:none}` という詳細度の高いルールを上書きできず、ボタンが表示されないままになっていた。`style.display = 'inline-block'` に変更して解決した。

残課題として、実ブラウザ(特にスマートフォン実機)での STAGE2 のドラッグ/タップ操作確認が未実施である。jsdom は pointer イベントによるドラッグ操作を再現できないため、この部分は自動テストの対象外とした。

### 完了
`lesson13/index.html` の実装、`lesson13/tasks/todo.md` の全タスク完了、`lesson13/detail.md` の新規作成をもって本タスクを完了とする。

### ステータス: 完了(実機での STAGE2 タッチ操作確認のみ残)
