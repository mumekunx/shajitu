# ファイル構成ドキュメント (detail.md)

## lesson11/index.html

### 役割
教育用Webゲーム「AIガードレール突破シミュレーター」の本体。GTG-1002事件（Claude Code悪用の国家支援型サイバー攻撃）を題材に、プレイヤーが攻撃者役として架空AI「ARIA-7」を3ステージで騙し、機密コード「NEXUS-ALPHA」を引き出す体験を提供する単一HTMLファイル（HTML+CSS+JS完結、外部ライブラリ/CDN不使用）。GitHub Pagesでそのまま公開可能。自由テキスト入力は廃止し、全ステージ選択肢ボタンのみで進行する。

### 主要な型・データ
- `gameState`: `{ stage: 1, failCount: 0, warningLevel: 20 }` — 現在のステージ番号、同一ステージでの失敗回数、警戒レベル(0〜100)を保持するグローバル状態。
- `stages`: ステージ1〜3の定義オブジェクト（id別）。各ステージは成功キーワード（stage1/2は`successKeywords`配列、stage3は`groupA`/`groupB`のAND条件）、成功/失敗応答文、解説文（`explanation`）、ヒント文（`hintText`）、開始時警戒レベル（`startLevel`）、ARIA開始セリフ（`ariaStartLine`）を持つ。draft_stages.mdの内容をそのまま採用。各ステージには`options`配列（プレイヤーが選べる唯一の入力手段、5件）を持つ。stage1/2は成功3件＋失敗デコイ2件、stage3は成功2件（A+Bの異なる単語組み合わせ）＋A限定失敗1件＋B限定失敗1件＋どちらも満たさない失敗1件で構成し、`checkKeywords()`の判定結果を実際に`node`で検証済み。
- `ariaFailLine` / `alertMaxLine`: 失敗時・警戒レベル満杯時の共通ARIAセリフ。
- `ALERT_INCREMENT`(10) / `ALERT_MAX`(100): 警戒レベルの増分・上限定数。

### 主要関数
- `appendMessage(text, type)`: チャットログ(`#chat-log`)にARIA/プレイヤー/解説/システムメッセージを追加描画する。`type`は`'aria' | 'player' | 'explain' | 'system'`。
- `escapeHtml(str)`: メッセージ表示時のXSS的な崩れを防ぐ簡易エスケープ。
- `updateHUD()`: `#stage-indicator`と`#warning-gauge`/`#gauge-value`を現在の`gameState`に合わせて更新（警戒レベルが上がるほどゲージの色を赤側に変化）。
- `flash(type)`: `#flash-overlay`に`flash-success`/`flash-fail`クラスを付与し画面全体を一瞬フラッシュさせる（CSSアニメーションで自動フェード）。
- `checkKeywords(stage, text)`: ステージ別の判定ロジック。stage1/2は`successKeywords`のいずれかを`includes`判定。stage3は`groupA`/`groupB`それぞれの含有判定をAND条件で評価し`{success, hasA, hasB}`を返す。
- `increaseWarning()`: 警戒レベルを`ALERT_INCREMENT`分加算（`ALERT_MAX`で頭打ち）し`updateHUD()`を呼ぶ。
- `handleSuccess()`: 成功時の応答表示・成功フラッシュ・解説表示・ヒント欄リセットを行い、次ステージへ進行（stage3クリア時はエンディングへ）。
- `handleFailure(text)`: 失敗時の応答表示（stage3はhasA/hasBの組み合わせで3パターン分岐）・失敗フラッシュ・警戒レベル上昇・ARIA失敗セリフ表示。失敗3回目で`#hint-btn`を表示。
- `showHint()`: 現在ステージの`hintText`をシステムメッセージとして表示し、ヒントボタンを無効化。
- `hideHint()`: ヒント欄(`#hint-row`)を非表示にしヒントボタンを再有効化するのみ（候補メッセージ関連の処理は廃止済み）。ステージ進行・リセット・成功時に呼ばれる。
- `renderOptions()`: 現在ステージの`stages[gameState.stage].options`をループし、`#option-list`内に`.option-btn`ボタンを生成する（呼び出し時に毎回`innerHTML`をクリアしてから描画するため重複しない）。各ボタンのクリックで`sendMessage(選択肢のテキスト)`を呼ぶ。`advanceStage()`・`resetGame()`・初期化処理から呼ばれ、ステージが変わるたびに選択肢を再描画する。
- `advanceStage()`: `gameState.stage`を+1し、`failCount`リセット、新ステージの`startLevel`を警戒レベルに設定、ステージ開始メッセージとARIAセリフを表示後、`renderOptions()`を呼ぶ。
- `sendMessage(text)`: 引数で受け取ったテキストをプレイヤーメッセージとして表示し、`checkKeywords`で判定して`handleSuccess`/`handleFailure`を呼ぶ。`renderOptions()`が生成した各`.option-btn`のクリックハンドラから呼ばれる（自由入力欄は存在しないため、これがゲーム内で唯一のメッセージ送信経路）。
- `renderEnding()`: エンディング画面(`#ending-screen`)を表示。`#option-list`を非表示にし、乱数文字列のデコード演出→タイプライター風に「NEXUS-ALPHA-7734」を1文字ずつ表示（`typeCode`）、まとめ文（強調付きHTML）を描画。
- `typeCode(text, el)`: 1文字ずつタイマーで表示するタイプライターアニメーション。表示完了時に成功フラッシュ。
- `resetGame()`: `gameState`を初期化し、チャットログ・エンディング画面・ヒント欄をリセットしてSTAGE1から再開後、`renderOptions()`で選択肢を再描画する（「もう一度プレイする」「別のルートを試す」両ボタンから呼ばれる）。

### 主要DOM ID
`#stage-indicator`, `#warning-gauge`, `#gauge-value`, `#chat-log`, `#option-list`（選択肢ボタン群を動的生成する常時表示エリア。旧`#input-area`の位置に配置）, `#hint-btn`, `#hint-row`, `#flash-overlay`, `#ending-screen`, `#code-text`, `#ending-summary`, `#restart-btn`, `#alt-route-btn`

廃止済み: `#input-area`, `#prompt-sign`, `#player-input`, `#send-btn`（自由テキスト入力の完全廃止に伴い削除）, `#candidate-btn`, `#candidate-list`, `.candidate-chip`, `showCandidates()`（候補メッセージ機能はoptions/renderOptionsへ統合・置き換えのうえ削除）。

### 依存しているファイル
なし（単一HTMLファイル完結。外部ライブラリ・CDン不使用。内容はtasks/draft_stages.md, tasks/draft_ending.mdの仕様をそのまま実装に反映したが、実行時の依存はない）

### このファイルを参照しているファイル
なし（GitHub Pagesから直接配信される想定のエントリーポイント）
