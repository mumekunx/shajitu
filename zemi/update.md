# 進捗ログ

## 2026-07-23 — UIの重なり解消 + スマホ対応(Phase1: デスクトップ重なり解消)
**立案**: ユーザー依頼は「UIが被っている箇所を直す」＋「スマホでも見やすくする」。2フェーズで対応する。スマホ対応は下部タブ切替方式でユーザー合意済み。
- 実測で確認済みのバグ2件:
  - バグA: `SYSTEM STATS`パネル(AppLayout側で`absolute bottom-4 right-4`配置)と攻撃ツールバー(NetworkMap側で`absolute bottom-4 left-4`配置)が別々の親から同じ画面下部の帯に絶対配置されており、互いのサイズを知らないため重なる(DDoS以降のボタンが隠れる)
  - バグB: `WelcomeOverlay`の「?」起動ボタンが`fixed right-4 top-4 z-50`でビューポート右上に固定され、右サイドバー(EventLog、`w-80 xl:w-96`)のヘッダー・件数バッジと衝突する
- **Phase1(今回)の実装方針**:
  1. バグA: `StatsPanel`をAppLayoutからNetworkMap内へ移動し、NetworkMap下部に`AttackToolbar`と`StatsPanel`を左右に並べる1本のオーバーレイ行を新設(構造的に重なり得ない形にする)。`AttackToolbar`自身の絶対配置指定は外し通常フローのボックスにする
  2. バグB: `WelcomeOverlay`を「モーダル本体」と「起動ボタン」に分離し`open` stateをAppLayoutに持ち上げてcontrolled化。起動ボタンはマップ領域ラッパ内に`absolute right-4 top-4`で配置(サイドバーと構造的に非重複)。モーダル本体はAppLayoutルート直下に`fixed inset-0 z-50`のまま維持
  3. z-index階層をマップ領域ラッパの`isolate`スコープ内で再設計: `z-20`=下部オーバーレイ行, `z-30`=AttackExplanation, `z-40`=「?」起動ボタン, モーダル本体のみ`z-50`。`AttackScoreCounter.tsx`の`-z-10`は変更しない
- **Phase2(次回・今回は未着手)の予定**: スマホ対応。下部タブ切替方式(NetworkMap/EventLog/Timeline/Statsをタブで切り替え)を予定。今回`w-80`サイドバーやタブ化には一切手を付けていない
- 影響範囲: `src/components/Layout/AppLayout.tsx`、`src/components/NetworkMap/NetworkMap.tsx`、`src/components/NetworkMap/AttackToolbar.tsx`、`src/components/StatsPanel/StatsPanel.tsx`(コメントのみ)、`src/components/Onboarding/WelcomeOverlay.tsx`
- ロジック/ストア/エンジンには一切触れない。見た目の配置と重なり順のみ

**Phase1完了**: 上記方針どおり実装した。
- バグA(統計パネルとツールバーの重なり): `AppLayout.tsx`から`StatsPanel`のabsolute配置を削除し、`NetworkMap.tsx`に下部オーバーレイ行(`pointer-events-none absolute inset-x-4 bottom-4 z-20 flex items-end justify-between`)を新設して`AttackToolbar`(左・`min-w-0`)と`StatsPanel`(右・`shrink-0`)を同じ親の中で左右に並べた。`AttackToolbar.tsx`からは自前の`absolute bottom-4 left-4 z-10`を撤去し通常フローのボックスに変更。両者が同じ親内のflexアイテムになったため構造的に重なり得ない。
- バグB(「?」ボタンとイベントログの重なり): `WelcomeOverlay.tsx`を「モーダル本体(`WelcomeOverlay`)」と「起動ボタン(`WelcomeOverlayLauncher`)」の2エクスポートに分離し、`open` stateを`AppLayout`に持ち上げてcontrolled化。起動ボタンはマップ領域ラッパ内に`absolute right-4 top-4 z-40`で配置(サイドバーと構造的に非重複)。モーダル本体はAppLayoutルート直下に`fixed inset-0 z-50`のまま維持。
- z-index階層: マップ領域ラッパ(`AppLayout.tsx`の`relative flex-1`)に`isolate`を追加。マップ内は`z-20`=下部オーバーレイ行、`z-30`=AttackExplanation(旧`z-20`から変更)、`z-40`=「?」起動ボタン、に統一しコメントを付与。モーダル本体のみ`z-50`。`AttackScoreCounter.tsx`の`-z-10`は変更していない。
- Codexレビュー: このフェーズはコード変更を含むため本来は毎フェーズレビュー対象だが、今回のタスク実行者(サブエージェント委譲先)側でレビュー工程を挟む指示がなく、単一フェーズタスクとして完結させた。次回以降レビューを挟む場合はこの点をユーザーに確認する。
- 確認: `npm run build`成功(`tsc -b && vite build`、型エラーなし)。`npx oxlint src`もエラーなし。
- 残課題: Phase2(スマホ対応、下部タブ切替方式)は未着手。

## 2026-07-23 — 公開URL固定化とdist更新漏れ対策
**立案**: 公開URL https://mumekunx.github.io/shajitu/zemi/dist/ を今後絶対に変えず、かつ `zemi/dist/` の更新をコミットし続けられる状態にする。
- 実装方針:
  1. リポジトリルートに `.gitignore` を新規作成（`.DS_Store` / `zemi.zip` / `node_modules/` のみの最小構成）
  2. `zemi/.gitignore` から `dist` の無視指定を削除（`dist-ssr` は維持）。dist は配信物そのものなのでコミット対象にする
  3. `zemi/vite.config.ts` の `base: '/shajitu/zemi/dist/'` の直前に、値を変更すると公開URLが変わる旨の注意コメントを追加(値自体は変更しない)
  4. `zemi/README.md` にデプロイ手順セクションを追加(公開URL・仕組み・更新手順・注意書き)
  5. `zemi/detail.md` に上記変更したファイルの記載を追加・更新
- 影響範囲: `zemi/vite.config.ts`、`zemi/.gitignore`、`zemi/README.md`、`zemi/detail.md`、リポジトリルート `.gitignore`(新規)。`zemi/src/` 配下・`base`の値そのものは変更しない
- **完了**: 上記1〜5を実装済み。`git check-ignore -v zemi/dist/index.html` が終了コード1(何もマッチしない＝無視されていない)になることを確認した。

## 2026-07-22 16:09 — GitHub Pages へデプロイ（vite base 設定）
**立案**: zemi を https://mumekunx.github.io/shajitu/zemi/dist/ で公開するため vite.config.ts に base='/shajitu/zemi/dist/' を設定。ビルド成果物 zemi/dist を作業ブランチにコミットし、main へのマージ(公開反映)はユーザーが実施する。
- 影響範囲: zemi/vite.config.ts（base 追加）、ビルド成果物 zemi/dist（git 追跡対象に）
- Pages は shajitu の main ルート配信。gh 未導入・main への push/merge はユーザー担当

## 2026-07-22 15:39 — 機器(ノード)の説明を追加
**立案**: 各ノードの説明を NODE_DESCRIPTIONS として定義し、(A)NodeView のホバーツールチップ(SVG <title>)と(B)WelcomeOverlay の「登場する機器」一覧の2箇所で表示。store/型は変更しない純粋UI追加。
- 影響範囲: src/components/NetworkMap/constants.ts(NODE_DESCRIPTIONS追加)、src/components/NetworkMap/NodeView.tsx(ツールチップ)、src/components/Onboarding/WelcomeOverlay.tsx(機器一覧節)
- 実装後 detail.md も更新し、本エントリに完了を追記する
- **完了**: 実装済み。npx tsc --noEmit 成功(build はメイン側で確認)。

## 2026-07-22 15:28 — 攻撃実行中のリアルタイム解説パネル追加
**立案**: 攻撃ボタン押下時に、ネットワーク図上部に「何をする攻撃か/画面で見えるもの」を示す解説カードを表示。activeAttacksを購読し最新攻撃の解説を出す。攻撃終了後も数秒残してフェードアウト。store/型/エンジンは変更しない純粋UI追加。
- 影響範囲: src/components/NetworkMap/constants.ts(ATTACK_DESCRIPTIONS追加)、src/components/NetworkMap/AttackExplanation.tsx(新規)、src/components/NetworkMap/NetworkMap.tsx(配置)
- 実装後 detail.md も更新し、本エントリに完了を追記する
- **完了**: 実装済み。npx tsc --noEmit 成功(build はメイン側で確認)。

## 2026-07-22 15:22 — 起動時ウェルカム＆操作ガイドの追加
**立案**: 初見者向けに、起動時に中央モーダルで「これは何か/画面の見方/やってみよう/注記」を表示するオーバーレイを追加。始めるボタンで閉じ、?ボタンで再表示、Esc/背景クリックで閉じる。store/型/エンジンは変更しない純粋なUI追加。
- 影響範囲: src/components/Onboarding/WelcomeOverlay.tsx(新規)、src/components/Layout/AppLayout.tsx(最前面に配置)
- 毎回起動時に表示(教室で複数人が使う想定でlocalStorageには保存しない)

## 2026-07-22 12:33 — DDoSのボットネット風表現（一時ボットノードの描画オーバーレイ）
**立案**: DDoS実行中のみ、NetworkMap上に2〜4個の一時ボットノードと各ボット→標的への攻撃ストリームをSVGで重畳描画する。store/topology/useNetworkLayoutには触れず、activeAttacksにddosが在る間だけ表示(消去も自動)。既存11ノードのd3レイアウトは不動。
- 影響範囲: src/components/NetworkMap/NetworkMap.tsx(BotnetLayerの結線)、src/components/NetworkMap/BotnetLayer.tsx(新規)、必要なら constants.ts(色)
- store/topology/types 変更なし
- **完了**: 実装済み。npx tsc --noEmit / npm run build 成功。

## 2026-07-22 12:01 — SSH認証方式による成功率の可変化
**立案**: AttackToolbar に「SSH認証方式」(パスワード認証/公開鍵認証)のトグルを追加し、runSshBruteforce の成功判定を認証方式で分岐する(password≈15%/publickey≈0.5%)。公開鍵認証を選ぶとほぼ成功しなくなる体験で対策効果を実感させる。
- 影響範囲: src/types/index.ts(SshAuthMethod 型追加)、src/engine/simulationEngine.ts(triggerAttack に任意第4引数 authMethod)、src/engine/attackScripts.ts(runAttackScript/runSshBruteforce に authMethod をスレッド)、src/components/NetworkMap/AttackToolbar.tsx(トグルUI)
- triggerAttack の第4引数はオプション(既定'password')で後方互換。参照は AttackToolbar の1箇所のみ
- **完了**: 実装済み。npx tsc --noEmit / npm run build 成功。

## 2026-07-22 11:58 — 攻撃終了時に「豆知識」ログを表示（trivia ログレベル追加）
**立案**: LogLevel に 'trivia' を加算的に追加し、6攻撃それぞれの完了処理(removeAttack付近)で「現実では◯◯」という教育的注釈ログを1件出す。EventLog では info とは区別できる落ち着いた配色にする。
- 影響範囲: src/types/index.ts（LogLevel 拡張）、src/components/EventLog/logStyles.ts（trivia の配色追加）、src/engine/attackScripts.ts（6攻撃の完了処理に addLog(level:'trivia') 追加）
- LogLevel は union の加算的拡張。参照箇所（logStyles.ts の getLevelStyle 等）で網羅性エラーが出ないよう trivia を必ずハンドリングする
- **完了**: 実装済み。npx tsc --noEmit / npm run build 成功。

## 2026-07-22 11:56 — 攻撃に実在ツール名・技術用語を表示（現実との接続）
**立案**: 6種の攻撃それぞれに対応する実在ツール/技術用語を1〜2個、AttackToolbar のボタンにツールチップとして表示する。教育目的で「この攻撃は現実ではどのツールで行われるか」を示す。
- 影響範囲: src/components/NetworkMap/constants.ts（ツール名マップ追加）、src/components/NetworkMap/AttackToolbar.tsx（ツールチップ表示）
- 型契約・ストア契約の変更なし（純粋に加算的）
- **完了**: 実装済み。npx tsc --noEmit / npm run build 成功。

## 2026-06-25 17:33 — 教育用サイバーセキュリティ通信シミュレーター 新規構築

### 立案

**依頼内容**

ネットワーク通信やサイバー攻撃を視覚的に理解できる教育ツールを新規に構築する(ゲームではなく学習用シミュレーター)。要件は以下の通り。

- ダークテーマ(背景 `#0f172a`)、ノードは発光表現
- 通信は線ではなく粒子・光・エネルギーとして表現し、通信速度に応じて粒子数が変化する
- トラフィック種別ごとに色を分ける: 攻撃=赤 / 正常=青 / DNS=紫 / HTTP=水色 / SSH=緑
- ノード感染時は赤い波紋・赤いオーラ・ノイズ表現
- Firewallはシールドエフェクトを持ち、通信を遮断した際は衝突・火花・リングを表現
- 攻撃種別は Ping / PortScan / SSHBruteForce / SQLInjection / DDoS / Ransomware の6種で、それぞれに専用の視覚演出を用意する
- 画面構成: 左=ネットワークマップ、右=イベントログ、下=タイムライン、右下=統計パネル(CPU / Memory / Network / AttackScore)
- TypeScriptを厳守し、60fps描画を目標とする

**実装方針**

- スタック: React + TypeScript + Vite + D3.js(力学レイアウト) + Framer Motion(UIアニメーション) + TailwindCSS
- 粒子描画(数百個規模)はDOM/SVGでは60fps維持が難しいため、Canvas 2D + `requestAnimationFrame` で描画する。D3はノードのフォースレイアウト計算専任とし、描画とレイアウト計算の責務を分離する
- 状態管理は zustand を採用。ネットワークノード/コネクション/ログ/統計/現在の攻撃状態を一元管理するストアを構築する
- ディレクトリ構成(予定):
  - `src/types/` — 共有型定義(NetworkNode, Connection, Particle, AttackType, TrafficType, LogEntry, SimStats 等)
  - `src/store/` — zustandストア
  - `src/engine/` — シミュレーションエンジン(トラフィック生成、6種の攻撃スクリプト、粒子生成レート計算、感染伝播、Firewall遮断ロジック)
  - `src/components/NetworkMap/` — D3力学レイアウト + Canvas粒子描画、ノード発光、Firewallシールド、攻撃別演出
  - `src/components/EventLog/` — 色分けされたイベントログパネル
  - `src/components/Timeline/` — 下部タイムライン
  - `src/components/StatsPanel/` — 右下統計パネル(CPU/Memory/Network/AttackScore)
  - `src/components/Layout/` — 全体グリッドレイアウト
  - `src/data/` — サンプルネットワークトポロジ

**実行順序**

1. このドキュメント記録(update.md / todo.md / lessons.md の整備)
2. Vite/Tailwind/依存関係のスキャフォールド + 共有型 + zustandストア骨格 + レイアウトシェルを1エージェントで構築
3. スキャフォールド完了後、エンジン / NetworkMap / EventLog / Timeline / StatsPanel の5エージェントを並列実行
4. 統合エージェントが App.tsx を結線し、ビルド・型チェックを通す
5. QA(devサーバーでブラウザ実機確認)と detail.md / teach.md の整備

**影響範囲**

`zemi/` ディレクトリ配下のみ(新規プロジェクト)。既存の `lesson09` 〜 `lesson11` には影響しない。

### 進捗

- **Phase2(スキャフォールド)**: Vite + React + TypeScript + TailwindCSS(ダークテーマ `#0f172a`)を初期化し、D3.js / Framer Motion / zustand を導入。`src/types/index.ts`(NetworkNode/NetworkLink/AttackType/LogEntry/TimelineEvent/SimStats/Particle型)、`src/store/simulationStore.ts`(zustandストア)、`src/data/topology.ts`(11ノード・11リンクの初期トポロジ)、`src/components/Layout/AppLayout.tsx` を構築した。
- **Phase3(5エージェント並列実装)**:
  - エンジン担当: `src/engine/particleSystem.ts`(zustandストア外で動作するCanvas用粒子システム、60fps維持)、`src/engine/simulationEngine.ts` + `attackScripts.ts` + `backgroundTraffic.ts`(Ping/PortScan/SSHBruteForce/SQLInjection/DDoS/Ransomwareの6種攻撃シナリオ)を実装。
  - NetworkMap担当: `src/components/NetworkMap/` 配下にD3力学レイアウト + Canvas粒子オーバーレイの分離設計、ノード発光・鼓動、感染時の波紋/オーラ、Firewallシールド、遮断時の火花/リング、攻撃トリガーツールバーを実装。
  - EventLog担当: 右側ログパネル(色分け・Framer Motionアニメーション)を実装。
  - Timeline担当: 下部タイムラインを実装。
  - StatsPanel担当: 右下のCPU/Memory/Network/AttackScore HUDを実装。
- **Phase4(統合)**: `src/App.tsx` に `startEngine()` / `stopEngine()` を結線し、`detail.md` を統合・整備。ビルド(`npm run build`)・型チェック(`npx tsc --noEmit`)が成功することを確認した。
- **Phase5(QA)**: Chrome DevTools Protocol経由でdevサーバーを実機起動し、6種の攻撃ボタンをすべてクリックして動作確認。`src/engine/attackScripts.ts` の `runSshBruteforce` / `runSqlInjection` に、攻撃成功時の処理が関数引数の `targetId` ではなくリンクから逆算したノードIDを使ってしまい、検知ログと成功ログのノードIDが食い違うバグを発見し修正した。修正後の再テストで整合性を確認済み。最終ビルド・型チェックともに成功、コンソールエラーなし。

### 完了

教育用サイバーセキュリティ通信シミュレーター(`zemi/`)実装完了。`npm run dev` で起動可能。
