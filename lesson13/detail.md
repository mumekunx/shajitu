# detail.md — lesson13 ファイル構成ドキュメント

## プロジェクト概要

lesson13 は、実在するAPT(Advanced Persistent Threat)グループ「Metador」を題材にした脱出ゲーム形式の教育用Webアプリケーション「METADOR FILE」である。プレイヤーは捜査官の視点でパスワードロックの解除、証拠資料の閲覧、証拠同士を赤い糸で結ぶマッチングパズル、シーザー暗号の解読を経て、最後に攻撃者の正体について3つの仮説(国家関与説・高級傭兵説・単独ハッカー集団説)から1つを選び、その仮説に基づくエンディングを迎える。実在するMetadorの正体は2026年現在も未解明であり、ゲーム内の結論はいずれも創作上の仮説であることをエンディングで明示する。単一の `index.html` ファイルのみで完結する構成で、外部ライブラリは使用せず(Google Fonts の CDN 読み込みのみ例外)、GitHub Pages での静的公開を想定している。

## ファイル一覧

### index.html
1. **パス**: `lesson13/index.html`
2. **役割**: アプリ本体。HTML構造・CSS・JavaScriptをすべて1ファイルに内包する、依存を持たない単一ページアプリケーション。
3. **主要な構成要素**: 後述の「index.html 内部構造」を参照。
4. **依存**: Google Fonts CDN(`Special Elite`・`Yomogi` フォント読み込みのみ。外部JSライブラリ・外部CSSフレームワークへの依存なし)
5. **参照元**: ブラウザから直接開かれる、または GitHub Pages 経由で配信される。他ファイルからの参照はない。

### update.md
1. **パス**: `lesson13/update.md`
2. **役割**: 本プロジェクトの進捗ログ(追記型)。依頼内容・実装計画・進捗・完了を時系列で記録する。
3. **主要な構成要素**: `## 2026-07-03 17:14 — METADOR FILE 脱出ゲーム 立案` の1エントリに、依頼内容/実装計画/影響範囲/進捗/完了/ステータスの各セクションを持つ。
4. **依存**: なし(独立したMarkdownドキュメント)
5. **参照元**: 開発者・Claude Codeセッションが進捗確認のために参照する。

### detail.md
1. **パス**: `lesson13/detail.md`
2. **役割**: 本ファイル自身。プロジェクトのファイル構成・`index.html` の内部構造(API・CSSクラス・正解データ)を記録するリファレンスドキュメント。
3. **主要な構成要素**: プロジェクト概要 / ファイル一覧 / index.html 内部構造。
4. **依存**: `index.html` の実装内容を記述の根拠とする。
5. **参照元**: 開発者・Claude Codeセッションが `index.html` を変更する際に参照する。

### tasks/todo.md
1. **パス**: `lesson13/tasks/todo.md`
2. **役割**: 本プロジェクトのタスクチェックリスト。
3. **主要な構成要素**: 「共有仕様書作成」から「detail.md作成・update.md完了記録」までの8項目のチェックボックス(全完了)。
4. **依存**: なし
5. **参照元**: 開発者・Claude Codeセッションが進捗確認のために参照する。

## index.html 内部構造

### セクション構成
`<body>` は上から順に以下の要素で構成される。

- `<header>`: タイトル(`METADOR FILE`)とサブタイトル
- `#progress`: ステージ進行状況バー(`data-stage` 属性で `0`〜`4`・`ending` に対応する `.progress-step` を並べる)
- `<main id="app">` 配下に以下の `<section class="stage" id="stage-X">` が並ぶ(すべて `display:none` がデフォルトで、`.active` クラスが付いたものだけ表示される)
  - `#stage-0`: パスワードロック画面
  - `#stage-1`: コルクボード証拠閲覧画面
  - `#stage-2`: 赤い糸マッチングパズル画面
  - `#stage-3`: シーザー暗号解読画面
  - `#stage-4`: 仮説選択画面
  - `#stage-ending`: エンディング画面
- `<footer>`: フッター(クレジット等)

### コアJS API
コアJS(SHELL担当パート、1096行目付近〜1214行目付近)が全ステージ共通の状態管理・画面遷移基盤を提供する。各ステージのJSはこれらを再定義せず利用する。

- **`G`**: グローバル状態オブジェクト。`startTime`(ゲーム開始時刻)、`opened`(STAGE1で開いた証拠idのSet)、`memos`(STAGE2で完成した推理メモの文字列配列)、`choice`(STAGE4で選んだ仮説キー)を保持する。
- **`EVIDENCE`**: 証拠データの配列(全ステージ共有)。各要素は `{ id, tag, title, body }`。6件。
- **`STAGE_INIT`**: ステージキー(`'0'`〜`'4'`・`'ending'`)から初期化関数へのマップ。
- **`registerStage(key, fn)`**: `STAGE_INIT[key] = fn` を登録する。`showStage()` によるステージ表示のたびに `fn` が呼び出される(STAGE3のみ静的DOMで完結するため `registerStage` を使わず即時実行IIFEで直接初期化している)。
- **`showStage(key)`**: 全 `.stage` から `.active` を外し、`#stage-{key}` に `.active` を付与して表示を切り替える。進行状況バーの `current`/`done` クラスも更新し、対応する `STAGE_INIT[key]` があれば実行、最後に画面トップへスクロールする。
- **`flashScreen()`**: `body` に `.flash` クラスを付け外しし、画面全体を赤くフラッシュさせる演出(誤答時などに使用)。
- **`typewrite(el, text, speed)`**: 指定要素にテキストを1文字ずつタイプライター表示する。Promiseを返す非同期関数。
- **`elapsedString()`**: `G.startTime` からの経過時間を `"MM:SS"` 形式の文字列で返す(エンディングのクリアタイム表示に使用)。
- **`setupHints(btnId, areaId, hints)`**: 段階式ヒントの共通ヘルパー(2026-07-04追加)。`btnId` のボタンを押すたびに `hints` 配列から次の1件を `areaId` 内に `.hint-line` 要素として追加していく。全件出し切るとボタンのラベルを「💡 ヒントは以上」に変えて `disabled` にする。`btn.dataset.bound` で二重バインドを防止しているため、同じステージが再表示されても安全に呼び出せる。STAGE0・STAGE2・STAGE3の各初期化処理内で呼び出している。

### 共有CSSクラス
- **`.stage` / `.active`**: ステージセクションの表示制御。`.active` 付与時に `stageFadeIn` アニメーションでフェードイン。
- **`.paper`**: セピア色の紙カード風スタイル(証拠カード・モーダル本文などで使用)。
- **`.btn`**: 基本ボタン。
- **`.btn-next`**: 大きめのステージ送りボタン。
- **`.modal-overlay` / `.open`**: モーダルの背景オーバーレイと表示トグル用クラス(STAGE1の証拠詳細モーダル、STAGE4のヒントモーダルで使用)。
- **`.stamp`**: 「CASE CLOSED」等のスタンプ風装飾テキスト。
- **`.typewriter`**: タイプライター表示中のテキストにカーソル風の `::after` 装飾を付けるクラス。
- **`body.flash`**: `flashScreen()` 発火時に付与され、`body::after` の赤いオーバーレイをパルスさせる。
- **`.hint-box` / `.hint-btn` / `.hint-line`**(2026-07-04追加): 段階式ヒントUIの共通クラス。`.hint-box` はボタンとヒント表示エリアを縦に中央寄せするflexコンテナ。`.hint-btn`(`.btn` を継承)は控えめなサイズのヒント表示ボタンで、出し切ると `disabled` になり半透明化する。`.hint-line` は1件のヒント文をセピア紙風カードとして表示するスタイルで、追加時に `hintFadeIn` アニメーションでフェードインする。`setupHints()` ヘルパーと組み合わせて使う。

### CSS変数(`:root`)
`--bg`(背景色) / `--paper`(紙色・セピア) / `--ink`(紙上の文字色) / `--thread`(赤い糸・アクセント色) / `--thread-wrong`(誤った糸の色) / `--stamp`(スタンプの赤) / `--dim`(薄い文字色) / `--cork`(コルクボードの茶色)

### 各ステージのid プレフィックス規約
- STAGE0: `s0-`(例: `s0-password`, `s0-unlock-btn`, `s0-feedback`, `s0-hint-btn`, `s0-hint-area`)
- STAGE1: `s1-`(例: `s1-corkboard`, `s1-next`, `s1-modal`)
- STAGE2: `s2-`(例: `s2-board`, `s2-svg`, `s2-cards`, `s2-memos`, `s2-next`, `s2-hint-btn`, `s2-hint-area`)
- STAGE3: `s3-`(例: `s3-cipher`, `s3-shift`, `s3-decoded`, `s3-keyword`, `s3-submit`, `s3-hint-btn`, `s3-hint-area`)
- STAGE4: `s4-`(例: `s4-evidence-summary`, `s4-memos`, `s4-decide-btn`, `s4-modal`)
- ENDING: `end-`(例: `end-stamp`, `end-text`, `end-time`, `end-restart-btn`)

### ゲームの正解データ
- **STAGE0 パスワード**: `METADOR`。ただし `MATADOR` との1文字違い(スペルミス)、およびレーベンシュタイン距離1以内の入力も正解として許容する(`s0Levenshtein` 関数で判定)。
- **STAGE2 赤い糸の正解ペア**(`EXHIBIT` id同士の組み合わせ、5組): `1+3`(スペイン語圏との関連)/ `2+5`(高度な技術力を持つ組織的犯行)/ `4+5`(採算度外視の作戦)/ `2+3`(多文化的な痕跡)/ `4+6`(徹底した匿名性)。各ペアが成立すると対応する推理メモがSTAGE2・STAGE4に追加される。
- **STAGE3 シーザー暗号**: 暗号文 `"WKH ILQDO NHB LV EXOOILJKWHU"` をシフト量3で復号すると平文 `"THE FINAL KEY IS BULLFIGHTER"` になる。最終的な鍵(キーワード)は `BULLFIGHTER`。ヒントは(2026-07-04以降)`s3-hint-btn`/`s3-hint-area` による最初から見える段階式ヒントのみで、旧「3回失敗すると `s3-hint-btn` が出現しクリックで固定ヒント1件を表示する」仕組み(`hintText`/`s3-hint-text` および `failCount >= 3` の分岐)は撤去済み。
- **STAGE4 仮説選択キー**: `nation`(国家関与説)/ `mercenary`(高級傭兵説)/ `independent`(単独ハッカー集団説)。選択した仮説キーは `G.choice` に保存され、STAGE-endingで表示するテキストの出し分けに使われる。
