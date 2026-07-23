# todo.md — 教育用サイバーセキュリティ通信シミュレーター 構築計画

対象: `zemi/` 新規プロジェクト(React + TypeScript + Vite)

## フェーズ1: ドキュメント記録(担当: Opus / メイン、本人が直接記録)
- [x] `zemi/update.md` に立案エントリを記録する
- [x] `zemi/tasks/todo.md`(本ファイル)を作成する
- [x] `zemi/tasks/lessons.md` を初期化する

## フェーズ2: スキャフォールド構築(担当: Sonnetサブエージェント 1体)
- [ ] Vite + React + TypeScript プロジェクトを `zemi/` に初期化する
- [ ] TailwindCSS を導入し、ダークテーマ(背景 `#0f172a`)を基本スタイルとして設定する
- [ ] 依存関係(D3.js, Framer Motion, zustand)をインストールする
- [ ] `src/types/` に共有型定義を作成する(NetworkNode, Connection, Particle, AttackType, TrafficType, LogEntry, SimStats 等)
- [ ] `src/store/` に zustand ストアの骨格を作成する(ノード/コネクション/ログ/統計/攻撃状態を一元管理)
- [ ] `src/components/Layout/` に全体グリッドレイアウト(左=ネットワークマップ、右=イベントログ、下=タイムライン、右下=統計パネル)のシェルを作成する
- [ ] `detail.md` を作成し、作成した各ファイルを記録する

## フェーズ3: 機能実装(担当: Sonnetサブエージェント 5体、並列実行)
- [x] エンジン担当: `src/engine/` にトラフィック生成、6種の攻撃スクリプト(Ping/PortScan/SSHBruteForce/SQLInjection/DDoS/Ransomware)、粒子生成レート計算、感染伝播、Firewall遮断ロジックを実装する
- [x] NetworkMap担当: `src/components/NetworkMap/` にD3力学レイアウト + Canvas粒子描画、ノード発光、Firewallシールド、攻撃別演出(感染時の赤い波紋・赤いオーラ・ノイズ、遮断時の衝突・火花・リング含む)を実装する
- [x] EventLog担当: `src/components/EventLog/` に色分けされたイベントログパネルを実装する(攻撃=赤/正常=青/DNS=紫/HTTP=水色/SSH=緑)
- [x] Timeline担当: `src/components/Timeline/` に下部タイムラインを実装する
- [x] StatsPanel担当: `src/components/StatsPanel/` に右下統計パネル(CPU/Memory/Network/AttackScore)を実装する
- [x] 各担当エージェントは作業完了時に `detail.md` を更新する

## フェーズ4: 統合(担当: Sonnetサブエージェント 1体)
- [x] `App.tsx` で Layout・エンジン・各コンポーネントを結線する
- [x] 型チェック(`tsc`)を通す
- [x] ビルド(`vite build`)を通す
- [x] `detail.md` を最終更新する

## フェーズ5: QA・ドキュメント整備(担当: Opus(確認) + Sonnetサブエージェント(実機確認・編集))
- [x] devサーバーを起動し、ブラウザで実機確認(60fps描画、各攻撃演出、Firewall演出を目視確認)
- [x] 不具合があれば修正(Sonnetサブエージェントが担当)
- [x] `teach.md` を新規作成し、学習用解説章を整備する
- [x] `detail.md` の最終整合性を確認する
- [x] `update.md` に完了エントリを追記する

### QA結果

Chrome DevTools Protocol経由でdevサーバーを起動し、ツールバーから6種の攻撃ボタン(Ping/PortScan/SSHBruteForce/SQLInjection/DDoS/Ransomware)を実機クリックしてすべて動作確認した。

- **発見・修正したバグ1件**: `src/engine/attackScripts.ts`の`runSshBruteforce`と`runSqlInjection`が、攻撃成功時のログ・ノード感染処理に「攻撃の実際のtargetId(関数引数)」ではなく「トポロジ内で偶然見つかったリンクから逆算したノードID」を使っていたため、「攻撃を検知: ssh_bruteforce (attacker-1 -> host-1)」の直後に「SSHブルートフォース攻撃が成功しました (server-web)」という矛盾したログが出る不具合があった。修正後、再度実機テストし「攻撃を検知: ssh_bruteforce (attacker-1 -> host-1)」→「SSHブルートフォース攻撃が成功しました (host-1)」で一致することを確認済み。
- 他の5攻撃(Ping/PortScan/SQLInjection/DDoS/Ransomware)は問題なし。Ransomwareは感染がhost-1→server-web→router→firewallへと隣接ノードに伝播することも確認したが、これは意図通りの「ラテラルムーブメント」表現。
- 最終ビルド(`npm run build`)・型チェック(`npx tsc --noEmit`)はすべて成功、コンソールエラーなし。
