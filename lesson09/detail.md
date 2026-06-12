# detail.md — lesson09 ファイル構成リファレンス

本プロジェクトは「DoS/DDoSとは何か」を歴史的事件5件で体感するインタラクティブWebサイト。
外部ライブラリ・CDN不使用の単一HTMLファイルで完結しており、GitHub PagesにそのままURLを公開できる。
作成日: 2026-06-05 / 授業: 社会情報学実習 グループ発表資料

---

## index.html

### 1. ファイルパス
`/Users/mumekun/Documents/GitHub/shajitu/lesson09/index.html`
（1,834行）

### 2. 役割
DoS/DDoS事件5件をCanvasアニメーション付きタイムラインで可視化するインタラクティブWebページ。
単一HTMLファイル内にCSS・JavaScriptをインラインで格納し、外部依存ゼロで動作する。

### 3. 主要な型・メソッド一覧

#### CSS変数（`:root` / `<style>` ブロック、行15〜28）
| 変数名 | 値 | 用途 |
|---|---|---|
| `--bg` | `#0a0a0f` | ページ背景色 |
| `--bg-card` | `#12121a` | カード背景色 |
| `--bg-card-hover` | `#1a1a26` | カードホバー色 |
| `--green` | `#00ff88` | 正常・緑アクセント |
| `--red` | `#ff4444` | 攻撃・赤アクセント |
| `--orange` | `#ff9500` | エストニア事件アクセント |
| `--purple` | `#a855f7` | Mirai Botnetアクセント |
| `--yellow` | `#ffd60a` | 社会的DoSアクセント |
| `--text` | `#e0e0e0` | 本文テキスト色 |
| `--text-muted` | `#888` | サブテキスト色 |
| `--border` | `#2a2a3a` | ボーダー色 |
| `--accent-color` | （カードごとに動的設定） | 各事件のテーマカラー |

#### HTML静的構造（`<body>` ブロック、行494〜549）
| 要素 | id/class | 役割 |
|---|---|---|
| `<section id="hero">` | hero | 全画面ヒーローセクション |
| `<canvas id="hero-canvas">` | hero-canvas | ヒーロー背景アニメ用Canvas（静的配置） |
| `.hero-content` | — | タイトル・サブタイトル・統計数値 |
| `.scroll-hint` | — | スクロール誘導矢印 |
| `<section id="timeline">` | timeline | 事件タイムラインセクション |
| `<div id="timeline-container">` | timeline-container | JSでカードを動的生成するコンテナ |
| `<footer>` | — | 「社会情報学実習 グループ発表資料 / 作成日2026-06-05」 |

#### JavaScriptモジュール（`<script>` ブロック、行551〜1832）

| 関数/IIFE | 行番号目安 | 説明 |
|---|---|---|
| `initHeroCanvas()` IIFE | 556〜654 | ヒーロー背景Canvas。パーティクル（緑/赤の光点+軌跡線）をrAFで描画。DPR対応・リサイズ対応 |
| `createParticle(randomStart)` | 585〜599 | パーティクルオブジェクトを生成。35%確率で赤、残り緑 |
| `initParticles()` | 576〜582 | 画面面積に応じてパーティクル数を決定（面積/8000個） |
| `resize()` | 565〜573 | canvasのdpr対応リサイズ＋initParticles呼び出し |
| `draw()` (hero) | 602〜643 | パーティクルの毎フレーム描画・移動・画面外再生成 |
| `incidents` 配列 | 661〜784 | 事件5件のデータオブジェクト配列。各オブジェクトが id/year/category/accent/title/summary/details/animFn などを持つ |
| `buildTimeline()` IIFE | 790〜928 | `incidents` をループしてDOMカード群を生成。アコーディオン開閉・タブUI・再生ボタンのイベントリスナーをここで登録 |
| `toggleCard()` | 892〜910 | カードの展開/折りたたみ切り替え。初回展開時のみ `init_<id>()` を遅延呼び出し。折りたたみ時は `stop_<id>()` を呼び出してrAFを停止 |
| `setupCanvas(canvas)` | 935〜944 | dpr対応canvasセットアップのユーティリティ。`{ctx, w, h}` を返す |
| DNS IIFE（`animDNS`） | 952〜1108 | 事件1アニメ。13台のサーバーを円状配置、四方からパケットが殺到し順次ダウン、影響ゲージ上昇 |
| Estonia IIFE（`animEstonia`） | 1116〜1262 | 事件2アニメ。エストニア地図輪郭に右方向（ロシア）中心からパケット殺到。22日間タイムバー+5/9スパイク+政府/銀行/メディアアイコンがDOWN |
| Mirai IIFE（`animMirai`） | 1270〜1424 | 事件3アニメ。60個のIoTデバイス（C/R/L）が緑→紫に感染し、50台超で攻撃フェーズへ移行。DynサーバーがDOWN。感染台数カウンター（最大150,000台） |
| Maps IIFE（`animMaps`） | 1432〜1652 | 事件4アニメ。7×5グリッドのベルリン道路を荷台車(Simon Weckert)が移動。通過セルが緑→黄→赤に染まり、周囲の青い車が迂回。完走後にメッセージフェードイン |
| Social IIFE（`animSocial`） | 1660〜1798 | 事件5アニメ。3タブ（明石/電話輻輳/梨泰院）対応。キャパシティバーが100%到達でOVERLOAD、流入アイコン（▲/☎/●）が殺到し続ける |
| `initScrollReveal()` IIFE | 1804〜1831 | IntersectionObserverでカードのスクロール入場アニメーション（opacity+translateY）を制御 |

#### アニメーションAPIの命名規則
各事件IIFE は `window` に以下3関数を登録する:
- `window.init_<id>()` — Canvas初期化＋自動再生開始
- `window.stop_<id>()` — rAFキャンセル
- `window.restart_<id>(tabIdx?)` — stop→init の再生

事件5（social）のみ `tabIdx` 引数を受け取りタブに応じて描画内容を切り替える。

#### incidents 配列の各オブジェクト構造
```
{
  id:       string,   // アニメ関数・canvas IDのサフィックス
  year:     string,   // 表示用年号
  category: string,   // カテゴリバッジテキスト
  accent:   string,   // テーマカラー（CSS color string）
  title:    string,   // カードタイトル
  summary:  string,   // カード概要1行
  details:  string[], // 詳細箇条書き（isTabs=falseのとき使用）
  animLabel:string,   // アニメエリアの説明ラベル
  animFn:   string,   // アニメ関数名（参考）
  isTabs?:  boolean,  // trueのとき詳細をタブUIで表示（事件5のみ）
  tabs?:    Tab[],    // タブ情報配列（isTabs=trueのとき）
}
```

### 4. 依存しているファイル（import/参照）
- **なし**。外部ライブラリ・CDN・別ファイルへの依存は一切ない。
- `<style>` ブロック・`<script>` ブロックはすべてインライン。
- `prefers-reduced-motion` メディアクエリに対応（アニメ抑制）。

### 5. このファイルを参照しているファイル
- **なし**。GitHub PagesのエントリポイントとなるURLのため、他ファイルからimport・参照されない。
- ブラウザが直接このHTMLを読み込む形で動作する。
