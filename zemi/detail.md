# detail.md — ファイル構成リファレンス

教育用サイバーセキュリティ通信シミュレーターのファイル構成ドキュメント。各ファイルの役割・型・依存関係を記載する。

---

## `src/types/index.ts`

**役割**: プロジェクト全体で共有する型定義。後続のすべてのエージェント(エンジン/コンポーネント担当)が依存する契約であり、変更不可。

**主要な型**:
- `NodeType` — `'internet' | 'router' | 'firewall' | 'server' | 'dns' | 'host' | 'attacker'`
- `NetworkNode` — ネットワークノード(id, type, label, x, y, fx?, fy?, infected, health)
- `TrafficType` — `'normal' | 'attack' | 'dns' | 'http' | 'ssh'`
- `NetworkLink` — ノード間リンク(id, source, target, trafficType, intensity, blocked)
- `AttackType` — `'ping' | 'port_scan' | 'ssh_bruteforce' | 'sql_injection' | 'ddos' | 'ransomware'`
- `AttackState` — 進行中の攻撃の状態(id, type, sourceId, targetId, startedAt, progress, blocked)
- `SshAuthMethod` — `'password' | 'publickey'`。SSHブルートフォース攻撃の認証方式指定に使用(`triggerAttack`の任意第4引数)。
- `LogLevel` — `'info' | 'warning' | 'critical' | 'success' | 'trivia'`(`trivia`=攻撃完了時に表示する教育的な豆知識ログ用に追加)
- `LogEntry` — イベントログ1件(id, timestamp, level, type, message)
- `TimelineEventKind` — `'attack_start' | 'attack_blocked' | 'attack_success' | 'infection' | 'system'`
- `TimelineEvent` — タイムライン上の1イベント(id, timestamp, label, kind)
- `SimStats` — 統計値(cpu, memory, network, attackScore)
- `Particle` — 粒子1個の状態(id, linkId, t, speed, trafficType, size)。zustandストアには含めない(60fps維持のためReact外で管理)

**依存しているファイル**: なし(最下層の型定義)

**このファイルを参照しているファイル**: `src/store/simulationStore.ts`, `src/data/topology.ts`, `src/engine/particleSystem.ts`, `src/engine/simulationEngine.ts`, および全コンポーネント(`NetworkMap.tsx`, `EventLog.tsx`, `Timeline.tsx`, `StatsPanel.tsx`)。Phase3で実装される全エンジン/描画コードもこれに依存する想定。

---

## `src/store/simulationStore.ts`

**役割**: zustandによるグローバル状態管理。ノード/リンク/ログ/タイムライン/統計/進行中攻撃を一元管理する。公開インターフェース(プロパティ名・関数シグネチャ)は変更不可の契約。粒子(Particle)は意図的に含まない。

**主要な型・メソッド**:
- `SimulationStore` インターフェース — state: `nodes`, `links`, `logs`, `timeline`, `stats`, `activeAttacks`
- `setNodes(nodes)` / `setLinks(links)` — 全体差し替え
- `updateNode(id, patch)` / `updateLink(id, patch)` — id指定で部分更新(イミュータブルmap)
- `addLog(entry)` — `id`/`timestamp`を自動付与してlogsに追加
- `addTimelineEvent(event)` — 同様にtimelineへ追加
- `setStats(patch)` — statsを部分更新
- `addAttack(attack)` — `id`(crypto.randomUUID()) / `startedAt` / `progress:0` / `blocked:false` を付与してactiveAttacksに追加し、生成したidを返す
- `updateAttack(id, patch)` / `removeAttack(id)` — 進行中攻撃の更新・削除
- `reset()` — `getInitialTopology()`を再取得し、logs/timeline/activeAttacksをクリアして初期状態に戻す
- 初期値: `stats = { cpu: 12, memory: 18, network: 8, attackScore: 0 }`、`nodes`/`links`は`getInitialTopology()`の戻り値

**依存しているファイル**: `src/types/index.ts`, `src/data/topology.ts`, `zustand`

**このファイルを参照しているファイル**: `src/components/NetworkMap/NetworkMap.tsx`, `src/components/EventLog/EventLog.tsx`, `src/components/Timeline/Timeline.tsx`, `src/components/StatsPanel/StatsPanel.tsx`。Phase3で`src/engine/simulationEngine.ts`からも`useSimulationStore.getState()`経由で参照される想定。

---

## `src/engine/particleSystem.ts`

**役割**: リンク上を流れる通信を表現する粒子(Particle)の生成・更新・取得を担当するシングルトン。React外で状態を持つことで、数百個規模の粒子を毎フレーム更新してもzustand経由の再レンダリングを発生させない。NetworkMap側の描画レイヤー(`ParticleCanvas`)はこの`getParticles()`を参照してアニメーションする。**Phase3で実装完了**。

**主要な型・メソッド**:
- `class ParticleSystem`(非export、内部実装)
  - `spawnForLink(link: NetworkLink, count: number): void` — 指定リンク用に`Particle`を`count`個生成。`t`は0〜0.1のランダム初期値、`speed`はリンクの`intensity`に比例(0.0006〜0.0035/ms程度)、`trafficType`はリンクから継承、`size`は1.5〜3pxのランダム値。生成後、粒子総数が`MAX_PARTICLES`(1500)を超えたら古いものから`splice`で間引く。
  - `tick(dtMs: number): void` — 全粒子の`t`を`speed * dtMs`分進め、`t >= 1`になった粒子を除去。
  - `getParticles(): readonly Particle[]` — 現在の粒子配列を返す。
  - `clear(): void` — particlesを空配列にリセット。
- `export const particleSystem: ParticleSystem` — シングルトンインスタンス。

**依存しているファイル**: `src/types/index.ts`(`Particle`, `NetworkLink`型)

**このファイルを参照しているファイル**: `src/engine/simulationEngine.ts`(`tick`呼び出し)、`src/engine/attackScripts.ts`/`src/engine/backgroundTraffic.ts`(`spawnForLink`呼び出し)、`src/components/NetworkMap/ParticleCanvas.tsx`(`getParticles()`を毎フレーム呼んでCanvas描画。tick自体は呼ばない)。

---

## `src/engine/backgroundTraffic.ts`

**役割**: 攻撃が発生していない平常時のバックグラウンド処理(背景トラフィック生成・statsの緩やかなランダムウォーク・attackScoreの自然減衰・攻撃中のstats底上げ)を担当するヘルパーモジュール。`simulationEngine.ts`のメインループから呼ばれる。

**主要な関数**:
- `spawnBackgroundTraffic(): void` — `useSimulationStore`の全`links`をループし、各リンクの`intensity`に応じた確率(`intensity * 0.12`)で`particleSystem.spawnForLink`を呼び、1〜3個の粒子を低頻度生成する。
- `driftStatsIdle(): void` — cpu(5-25%)/memory(10-30%)/network(5-20%)を`randomWalk`で緩やかに揺らし`setStats`する。`activeAttacks`が空の場合のみ`attackScore`を0未満にならない範囲で減衰させる。
- `bumpAttackScore(amount: number): void` — `attackScore`を`amount`分加算する(攻撃中に`simulationEngine.ts`から毎フレーム呼ばれる)。
- `elevateStats(patch): void` — cpu/memory/networkの「底上げ(floor)」を指定し、現在値がfloor未満ならfloor〜100の範囲でランダムウォークさせて引き上げる。DDoS攻撃中など、攻撃側ロジックがstatsを強制的に高止まりさせたい場合に利用。
- 内部関数 `randomWalk(value, min, max, step)` — 値を範囲内でランダムウォークさせる小さなユーティリティ(非export)。

**依存しているファイル**: `src/store/simulationStore.ts`(`useSimulationStore`)、`src/engine/particleSystem.ts`(`particleSystem`)

**このファイルを参照しているファイル**: `src/engine/simulationEngine.ts`(`spawnBackgroundTraffic`, `driftStatsIdle`, `bumpAttackScore`)、`src/engine/attackScripts.ts`(`elevateStats`、DDoS攻撃でのstats底上げに使用)

---

## `src/engine/attackScripts.ts`

**役割**: 6種類の攻撃(`ping`, `port_scan`, `ssh_bruteforce`, `sql_injection`, `ddos`, `ransomware`)それぞれの進行ロジック(タイムライン・ログ・ノード/リンク状態・粒子生成)を実装する。`setTimeout`ベースで段階的に`AttackState`を更新し、最後に`removeAttack`で終了する。

**主要な関数**:
- `export function runAttackScript(attackType, attackId, sourceId, targetId, authMethod?: SshAuthMethod): void` — 攻撃種別に応じて以下の内部関数にディスパッチするエントリポイント。任意第5引数`authMethod`は`runSshBruteforce`にのみ渡される(既定値は呼び出し元の`triggerAttack`側で`'password'`)。
  - `runPing` — 約2秒。対象リンクのintensityを一時的に上げ、4ステップで粒子を往復させ、終了時に`info`ログ「応答あり」＋`trivia`ログ(現実の`ping`/ICMPとの対比を示す豆知識)。
  - `runPortScan` — 約4〜6秒。`internet`/`attacker`以外の内部ノードを順番に`updateAttack(id, { targetId, progress })`で切り替えながら低強度スキャン。終了時「N個のポートをスキャンされました」ログ＋`trivia`ログ。
  - `runSshBruteforce(..., authMethod: SshAuthMethod = 'password')` — 約6〜8秒、10回の試行。各試行で`ssh`トラフィックのリンクに粒子を集中生成。約70%でブロック(`updateAttack(blocked:true)`を一瞬trueにしてから戻す。対応する`link`にも一時的に`blocked:true`を反映)、成功確率は`authMethod === 'publickey' ? 0.005 : 0.15`で分岐(10試行中1回だけ成功候補とする既存の制御は維持しつつ、リテラルだった0.15を可変化)。成功時は対象ノードの`health`を15に下げ`infected:true`、`critical`ログ＋`addTimelineEvent(kind:'attack_success')`。失敗で終わった場合は`addTimelineEvent(kind:'attack_blocked')`。終了時に`trivia`ログ。
  - `runSqlInjection` — 約3〜5秒、5回試行で`http`リンクに粒子生成。終了時に50%の確率で成功(`health`を40に下げ`infected:true`、`critical`ログ＋`attack_success`イベント)/50%でブロック(`blocked:true`、`info`ログ＋`attack_blocked`イベント)。いずれの場合も`trivia`ログを追加。
  - `runDdos` — 約8〜10秒。250ms間隔のバーストで、`attacker`発の全リンクおよび対象ノードに関わる全リンクに対し`spawnForLink`をn=10〜30で連続生成。各バーストで80%の確率でリンクを一時的に`blocked:true`にする。`elevateStats({ networkFloor: 80, cpuFloor: 70 })`でstatsを高止まりさせる。開始時`critical`ログ、終了時`info`ログ「DDoS終息」＋`trivia`ログ。
  - `runRansomware` — 起点ノードを`infected:true, health:25`にし`critical`ログ＋`infection`イベント。1.5秒間隔で、現在感染しているノードに隣接する未感染の内部ノードを`links`から探索し、60%の確率で感染を拡大(`infected:true, health:30`、`critical`ログ＋`infection`イベントを各新規感染ごとに発行)。内部ノード数の半数程度、または6〜8秒で停止。終了時に`trivia`ログ。
- `export function clearAllAttackTimers(): void` — `activeTimers`(`Set<ReturnType<typeof setTimeout>>`)に登録された全タイマーを`clearTimeout`し、`stopEngine()`からのリーク防止に使う。
- 内部ヘルパー(非export): `schedule`(タイマー登録+`activeTimers`管理), `findLink`, `findLinkByTrafficType`, `findAnyLinkInvolving`, `getInternalNodeIds`, `flashLinkIntensity`, `flashLinkBlocked`。
- 各`runXxx`の完了処理(`removeAttack`直前の単一終端)に、現実との対比を示す教育的注釈として`addLog({ level: 'trivia', ... })`を1件追加済み(二重発火しない終端に配置)。

**依存しているファイル**: `src/store/simulationStore.ts`(`useSimulationStore`: `addAttack`/`updateAttack`/`removeAttack`/`addLog`/`addTimelineEvent`/`updateNode`/`updateLink`/`nodes`/`links`)、`src/types/index.ts`(`AttackType`, `NetworkLink`)、`src/engine/particleSystem.ts`(`particleSystem.spawnForLink`)、`src/engine/backgroundTraffic.ts`(`elevateStats`)

**このファイルを参照しているファイル**: `src/engine/simulationEngine.ts`(`runAttackScript`, `clearAllAttackTimers`)

---

## `src/engine/simulationEngine.ts`

**役割**: requestAnimationFrameループによるシミュレーション全体の進行を担うエンジン本体。粒子更新・バックグラウンドトラフィック生成・stats更新・攻撃トリガーの起点となる。外部(UIコンポーネント/Appなど)からは`startEngine`/`stopEngine`/`triggerAttack`の3関数のみを呼ぶ想定。**Phase3で実装完了、Phase4で`src/App.tsx`から`startEngine`/`stopEngine`の呼び出しを結線済み**。

**主要な関数**:
- `export function startEngine(): void` — `rafId`が既にセットされていれば何もしない(二重起動防止)。それ以外は`lastTimestamp`をリセットして`requestAnimationFrame(frame)`を開始。
- `export function stopEngine(): void` — `cancelAnimationFrame`でループを止め、`rafId`/`lastTimestamp`をリセットし、`clearAllAttackTimers()`で進行中の攻撃タイマーも全て解除する。
- `export function triggerAttack(type: AttackType, sourceId: string, targetId: string, authMethod: SshAuthMethod = 'password'): void` — `addAttack`でAttackState生成→`addLog(level:'warning')`→`addTimelineEvent(kind:'attack_start')`→`runAttackScript`(authMethodも渡す)で個別シナリオ開始。IDベース管理のため複数攻撃の同時実行が可能。任意第4引数`authMethod`は後方互換(既定`'password'`)で、SSHブルートフォース以外の攻撃では無視される。`src/components/NetworkMap/AttackToolbar.tsx`から`triggerAttack(type, sourceId, targetId)`または`triggerAttack(type, sourceId, targetId, sshAuthMethod)`(SSH攻撃時のみ)の形で呼ばれる。
- 内部関数 `frame(timestamp: number): void`(非export) — 1フレームごとに`particleSystem.tick(dt)`→`spawnBackgroundTraffic()`→(`activeAttacks`が空でなければ`bumpAttackScore`、空なら`driftStatsIdle`)→(攻撃中はcpu/memory/networkを軽くジッターさせる)を実行し、次の`requestAnimationFrame`をスケジュールする。

**依存しているファイル**: `src/store/simulationStore.ts`(`useSimulationStore`)、`src/types/index.ts`(`AttackType`)、`src/engine/particleSystem.ts`(`particleSystem.tick`)、`src/engine/backgroundTraffic.ts`(`spawnBackgroundTraffic`, `driftStatsIdle`, `bumpAttackScore`)、`src/engine/attackScripts.ts`(`runAttackScript`, `clearAllAttackTimers`)

**このファイルを参照しているファイル**: `src/App.tsx`(`useEffect`内で`startEngine()`/クリーンアップで`stopEngine()`を呼ぶ)、`src/components/NetworkMap/AttackToolbar.tsx`(`triggerAttack`)

---

## `src/data/topology.ts`

**役割**: サンプルネットワークトポロジ(初期ノード・リンク構成)を生成する。ストアの初期状態およびreset()時に使用される。

**主要な型・メソッド**:
- `getInitialTopology(): { nodes: NetworkNode[]; links: NetworkLink[] }` — 11ノード(attacker×2, internet×1, firewall×1, router×1, dns×1, server×2, host×3)、11リンク(normal/attack/dns/http/sshの全5種を含む)を返す。全ノードは`infected: false, health: 100`で初期化、リンクの`intensity`は0.2〜0.6のランダム値、`blocked: false`

**依存しているファイル**: `src/types/index.ts`(`NetworkNode`, `NetworkLink`型)

**このファイルを参照しているファイル**: `src/store/simulationStore.ts`(初期state生成および`reset()`)

---

## `src/components/Layout/AppLayout.tsx`

**役割**: 画面全体のグリッド/フレックスレイアウトシェル。左=NetworkMap、右=EventLog、下=Timeline、NetworkMap内右下にStatsPanelをHUDとして重ねる構成。

**主要な型・メソッド**:
- `export default function AppLayout()` — 唯一のexport。Propsなし

**依存しているファイル**: `src/components/NetworkMap/NetworkMap.tsx`, `src/components/EventLog/EventLog.tsx`, `src/components/Timeline/Timeline.tsx`, `src/components/StatsPanel/StatsPanel.tsx`

**このファイルを参照しているファイル**: `src/App.tsx`

---

## `src/components/NetworkMap/NetworkMap.tsx`

**役割**: メインビジュアル本体。背景グリッド、SVGによるリンク/ノード/攻撃エフェクトの描画、Canvas 2Dによる粒子描画、攻撃トリガーツールバーを統合する。`useSimulationStore`から`nodes`/`links`/`activeAttacks`を読み取り専用で参照する。**Phase3で実装完了**。

**主要な型・関数**:
- `NetworkMap()` (default export) — ルートコンポーネント。`ResizeObserver`でコンテナのピクセルサイズ(`size.width/height`)を測定し、`useNetworkLayout`にサイズと`nodes`/`links`を渡してノード位置(`positions`)を取得する。`activeAttacks`から`port_scan`の現在ターゲットID集合(`scanTargetIds`)と`ddos`進行中フラグ(`hasDdos`)を算出し、それぞれ`NodeView`の走査枠表示・背景の赤グローに反映する。加えて`ddosAttacks = activeAttacks.filter(a => a.type === 'ddos')`を算出し、SVG内の`AttackEffectsLayer`直後・`NodeView`群の直前に`<BotnetLayer attacks={ddosAttacks} positions={positions} width={size.width} height={size.height} />`を差し込む。SVG内で`<line>`によるリンク描画→`AttackEffectsLayer`→`BotnetLayer`→`NodeView`の順にレイヤリングし、その上に`ParticleCanvas`を完全重畳(`position:absolute`)で配置する。位置指定コンテナ直下・`AttackToolbar`の直前に`<AttackExplanation />`を配置し、攻撃実行中のリアルタイム解説カードをネットワーク図上部に重畳表示する(props受け渡しなし、`AttackExplanation`が自前で`activeAttacks`を購読)。既存の`hasDdos`背景グロー・`runDdos`ロジックは変更なし。
- ノード/リンクの位置計算とCanvas粒子描画は別ファイルに分離し、本ファイルはレイアウト・データ受け渡しのみを担当する。

**依存しているファイル**: `../../store/simulationStore`(`useSimulationStore`、読み取り専用で`nodes`/`links`/`activeAttacks`)、`./useNetworkLayout`、`./ParticleCanvas`、`./NodeView`、`./AttackEffectsLayer`、`./BotnetLayer`、`./AttackToolbar`、`./AttackExplanation`、`./constants`(`TRAFFIC_COLORS`)、`./networkMap.css`

**このファイルを参照しているファイル**: `src/components/Layout/AppLayout.tsx`

---

## `src/components/NetworkMap/useNetworkLayout.ts`

**役割**: `d3-force`(`forceSimulation`/`forceLink`/`forceManyBody`/`forceCenter`/`forceCollide`)によるノード位置計算をコンポーネントローカルに保持するカスタムフック。zustandストアの`node.x/y`は初期配置のヒントとしてのみ使用し、毎フレームの位置更新はローカル`state`(`positions`)に閉じることで、ストア全体の再レンダリングを発生させない設計。

**主要な型・関数**:
- `LayoutNode` interface — `d3.SimulationNodeDatum`を拡張し`id`/`type`を持つ、d3シミュレーション内部用のノード型。
- `NodePosition` interface — `{ x: number; y: number }`。
- `useNetworkLayout(nodes, links, width, height): Record<string, NodePosition>` — `nodes.length`/`width`/`height`が変化した時のみ`forceSimulation`を再構築(`useEffect`の依存配列を意図的に絞っている)。`tick`イベントでノード座標をビューポート内にクランプしつつ`positions`の`state`を更新する。`alphaDecay(0.04)`により収束後は自動的にtickが停止し負荷が限定される。サイズのみが変わった場合は別の`useEffect`で`forceCenter`を更新し`alpha(0.3)`で軽く再加熱する。

**依存しているファイル**: `d3-force`(`node_modules/d3-force`に実体があるサブパッケージを直接import)、`../../types`(`NetworkNode`, `NetworkLink`)、`./constants`(`NODE_RADIUS`)

**このファイルを参照しているファイル**: `src/components/NetworkMap/NetworkMap.tsx`、`src/components/NetworkMap/ParticleCanvas.tsx`(`NodePosition`型のみ)

---

## `src/components/NetworkMap/ParticleCanvas.tsx`

**役割**: 粒子(数百個規模)専用のCanvas 2D描画レイヤー。SVG(ノード/リンク)とは完全に分離し、自前の`requestAnimationFrame`ループで毎フレーム`particleSystem.getParticles()`を読んで描画する。React再レンダリングを発生させず、`ref`経由で直接canvasに描画する。

**主要な型・関数**:
- `ParticleCanvas({ width, height, links, positions })` (default export) — `links`/`positions`は`ref`に同期させ、`useEffect`内で開始した単一の`rAF`ループから最新値を参照する(エフェクトの再実行は行わない＝ループの二重起動を防止)。各フレームで`devicePixelRatio`に応じてcanvasの実ピクセルサイズを調整し、`clearRect`後に各粒子の`linkId`からリンクのsource/target座標を引いて`source + (target-source)*t`で現在位置を算出、`trafficType`に応じた色(`TRAFFIC_COLORS`)で`shadowBlur`を使ったグロー付きの円を描画する。

**依存しているファイル**: `../../engine/particleSystem`(`particleSystem.getParticles()`を毎フレーム呼ぶのみ。tick自体は呼ばない)、`../../types`(`NetworkLink`)、`./constants`(`TRAFFIC_COLORS`)、`./useNetworkLayout`(`NodePosition`型)

**このファイルを参照しているファイル**: `src/components/NetworkMap/NetworkMap.tsx`

---

## `src/components/NetworkMap/NodeView.tsx`

**役割**: 単一ノードのSVG描画。タイプごとの色分け、常時「鼓動」するアニメーション、感染時の波紋・オーラ・ジッター表現、Firewallの六角シールド常時表示、port_scanターゲット時の走査枠を担当する。

**主要な型・関数**:
- `NodeView({ node, x, y, isScanTarget })` (default export) — ルート`<g>`の直下(最初の子)にSVGネイティブの`<title>{`${NODE_DESCRIPTIONS[node.type].label}: ${NODE_DESCRIPTIONS[node.type].description}`}</title>`を配置し、ノードにマウスホバーするとブラウザ標準ツールチップで機器の役割を説明する(`<g>`には`style={{ cursor: 'help' }}`も付与)。`node.infected`が`true`の場合、感染オーラ(`motion.circle`の不透明度ループ)、3本の波紋リング(タイムラグ`0/0.6/1.2`秒でscale+opacityをループ)、本体の軽いジッター(x/yの微小振動)を重ねる。`node.type === 'firewall'`の場合、`hexagonPoints`で生成した六角形オーバーレイを常時薄く発光させる。`isScanTarget`が`true`の場合、黄色い走査枠を0.5秒だけフェード表示する。本体は`motion.circle`で`scale: [1, 1.06, 1]`の鼓動ループ(感染時は周期を短縮しジッター付与)。`node.health < 50`の場合は黒の半透明オーバーレイで損傷を表現。
- `hexagonPoints(r: number): string` — 正六角形の頂点座標文字列を生成するヘルパー。

**依存しているファイル**: `framer-motion`(`motion`)、`../../types`(`NetworkNode`)、`./constants`(`NODE_COLORS`, `NODE_RADIUS`, `INFECTED_COLOR`, `NODE_DESCRIPTIONS`)

**このファイルを参照しているファイル**: `src/components/NetworkMap/NetworkMap.tsx`

---

## `src/components/NetworkMap/AttackEffectsLayer.tsx`

**役割**: `activeAttacks`をループし、攻撃種別ごとに差別化したSVGオーバーレイ演出を描画する。また`blocked: true`の攻撃がある場合、firewallノード位置に衝突エフェクト(衝撃波リング+火花)を一時表示する。

**主要な型・関数**:
- `AttackEffectsLayer({ attacks, nodes, positions })` (default export) — `nodes`から最初の`firewall`ノードを探し、その座標を`blocked`エフェクトの表示位置に使う。`attack.type`に応じて: `ping`=target上に単発の薄い青白リング、`ssh_bruteforce`=source-target間の緑高密度パルス線、`sql_injection`=target上に赤紫の注入風テキスト(`' OR 1=1;--`)と淡い円、`ddos`=target上の大きな赤グロー円の点滅、`ransomware`=target上の赤円点滅(ノード側の波紋と合わせて二重表現)。`AnimatePresence`で攻撃の追加/削除に応じてマウント/アンマウントする。
- `BlockEffect({ x, y })` — 遮断時の衝撃波(`motion.circle`のscaleアニメーション)と8方向の火花(`motion.line`、`x2/y2`を放射状に伸ばしてフェードアウト)を約0.4〜0.5秒表示するヘルパーコンポーネント。

**依存しているファイル**: `framer-motion`(`AnimatePresence`, `motion`)、`../../types`(`AttackState`, `NetworkNode`)、`./constants`(`ATTACK_COLORS`)、`./useNetworkLayout`(`NodePosition`型)

**このファイルを参照しているファイル**: `src/components/NetworkMap/NetworkMap.tsx`

---

## `src/components/NetworkMap/BotnetLayer.tsx`

**役割**: DDoS攻撃のボットネット風表現を描画する純粋な描画オーバーレイ(新規)。DDoSの`AttackState`が`activeAttacks`に存在する間だけ、攻撃者ノード周辺に一時的なボットノードと、各ボットから標的への攻撃ストリーム粒子をSVGで重畳描画する。`store`/`topology`/`useNetworkLayout`/`types`には一切変更を加えず、既存の`d3-force`レイアウトを揺らさない設計(ノード数を増やさずSVGオーバーレイのみで表現する)。

**主要な型・関数**:
- `BotSpec` interface — 1個のボットノードの仕様(角度・半径・delay・durationなど、`attack.id`から決定的に導出される値)。
- `hashString(s: string): number` — `attack.id`を種にしたdjb2系の決定的ハッシュ関数。同じ攻撃であれば毎回同じボット配置になることを保証する(非export)。
- `buildBots(attack: AttackState): BotSpec[]` — `hashString`の結果をもとに2〜4個の`BotSpec`(数・角度・半径・delay・duration)を算出する。
- `clamp(value, min, max): number` — 算出した座標をビューポート内に収めるための小さなユーティリティ(非export)。
- `BotnetGroup({ attack, positions, width, height })` — 1件のDDoS `AttackState`に対応するボット群を描画する内部コンポーネント。`useMemo`で`buildBots(attack)`を攻撃ごとに1回だけ計算し、再レンダーでボット配置が揺れないようにする。各ボット→標的への攻撃ストリーム粒子は`motion.circle`で`cx`/`cy`をbotから標的へ`Infinity`ループさせて表現。
- `BotnetLayer({ attacks, positions, width, height })` (default export) — `attacks`(呼び出し側で`ddos`のみにフィルタ済みの`AttackState[]`)をループし`BotnetGroup`を描画する。`AnimatePresence`でラップしており、対応する`ddos`攻撃が`removeAttack`で`activeAttacks`から消えると、ボット群が自動的にfade+scale outでアンマウントされる。

**依存しているファイル**: `framer-motion`(`AnimatePresence`, `motion`)、`../../types`(`AttackState`)、`./useNetworkLayout`(`NodePosition`型)

**このファイルを参照しているファイル**: `src/components/NetworkMap/NetworkMap.tsx`

---

## `src/components/NetworkMap/AttackToolbar.tsx`

**役割**: 攻撃トリガーUI。半透明ツールバーに6種(Ping/Port Scan/SSH Brute Force/SQL Injection/DDoS/Ransomware)のボタンを表示し、クリックで`triggerAttack(type, sourceId, targetId)`を呼ぶ。

**主要な型・関数**:
- `ATTACK_TYPES: AttackType[]` — ツールバーに表示する6種別の配列。
- `TARGET_TYPE_PRIORITY: Record<AttackType, NodeType[]>` — 攻撃種別ごとに「ふさわしいターゲットtype」の優先順リストを定義(例: `ssh_bruteforce`→`['host','server']`、`ddos`→`['firewall','router']`)。
- `findSource(nodes): NetworkNode | undefined` — `type === 'attacker'`の最初のノードを返す。
- `findTarget(nodes, type): NetworkNode | undefined` — `TARGET_TYPE_PRIORITY`の優先順で該当typeのノードを探し、見つからなければ`nodes[0]`をfallbackとする。
- `AttackToolbar({ nodes })` (default export) — `useState<SshAuthMethod>('password')`で`sshAuthMethod`を保持し、攻撃ボタン群の上に「SSH認証:」ラベル＋ピル型トグル(パスワード認証/公開鍵認証)を表示する。各攻撃ボタンには`title={`実在ツール: ${ATTACK_TOOLS[type]}`}`をネイティブツールチップとして付与。ボタンクリック時に`findSource`/`findTarget`で`sourceId`/`targetId`を解決し、`ssh_bruteforce`の場合のみ`triggerAttack(type, source.id, target.id, sshAuthMethod)`(それ以外は`triggerAttack(type, source.id, target.id)`)を呼ぶ。

**依存しているファイル**: `../../engine/simulationEngine`(`triggerAttack`。任意第4引数`authMethod`にも対応)、`../../types`(`AttackType`, `NetworkNode`, `SshAuthMethod`)、`./constants`(`ATTACK_LABELS`, `ATTACK_TOOLS`)

**このファイルを参照しているファイル**: `src/components/NetworkMap/NetworkMap.tsx`

---

## `src/components/NetworkMap/AttackExplanation.tsx`

**役割**: 攻撃実行中に「今何が起きているか」を示すリアルタイム解説パネル(新規)。ネットワーク図上部に、実行中の攻撃の「何をする攻撃か」(`summary`)と「今画面で見えているもの」(`whatYouSee`)をカードで表示する。既存の攻撃終了時「豆知識」ログ(`trivia`ログレベル)とは別物で、こちらは実行中の解説に特化する。`store`/`types`/`engine`には一切変更を加えない純粋なUI追加。

**主要な型・関数**:
- `LINGER_MS = 4000` — 攻撃が全て終了してからカードを消すまでの猶予時間(ms)。読み終える余裕を作るための定数。
- `AttackExplanation()` (default export) — `useSimulationStore`から`activeAttacks`を読み取り専用で購読する。`activeAttacks`が空でなければ最後の要素(最新に開始された攻撃)の`type`を`latestType`として算出し、ローカル`state`の`displayedType`に反映する。`activeAttacks`が空になった場合は即座に消さず、`useEffect`+`setTimeout`で`LINGER_MS`後に`displayedType`を`null`にする(次の攻撃が来たら`clearTimeout`でタイマーを解除し表示を差し替える、クリーンアップ関数付き)。`AnimatePresence`+`motion.div`(`key={displayedType}`)でカードのマウント/アンマウント・種別切り替え時のアニメーションを行う。カードは`ATTACK_LABELS[displayedType]`(見出し)、`ATTACK_DESCRIPTIONS[displayedType].summary`(本文)、`ATTACK_DESCRIPTIONS[displayedType].whatYouSee`(画面で見えているもの)を表示する。

**依存しているファイル**: `framer-motion`(`AnimatePresence`, `motion`)、`../../store/simulationStore`(`useSimulationStore`、読み取り専用で`activeAttacks`)、`../../types`(`AttackType`)、`./constants`(`ATTACK_LABELS`, `ATTACK_DESCRIPTIONS`)

**このファイルを参照しているファイル**: `src/components/NetworkMap/NetworkMap.tsx`

---

## `src/components/NetworkMap/constants.ts`

**役割**: NetworkMap配下で共有する色・サイズ定数を集約する。

**主要な型・関数**:
- `TRAFFIC_COLORS: Record<TrafficType, string>` — `tailwind.config.js`の`traffic.*`カラーと一致するhex値(normal=`#3b82f6`, attack=`#ef4444`, dns=`#a855f7`, http=`#22d3ee`, ssh=`#22c55e`)。
- `INFECTED_COLOR` — 感染表現の赤(`#ef4444`)。
- `NODE_COLORS: Record<NodeType, string>` — ノードtypeごとの基調色(internet=slate, router=blue, firewall=cyan, dns=purple, server=blue系, host=neutral, attacker=red)。
- `NODE_RADIUS: Record<NodeType, number>` — ノードtypeごとの描画半径(14〜22)。
- `NODE_DESCRIPTIONS: Record<NodeType, { label: string; description: string }>` — ノードtypeごとの初見者向け説明(`label`＋`description`)。`NodeView.tsx`のホバーツールチップ(SVG `<title>`)と、`Onboarding/WelcomeOverlay.tsx`の「登場する機器」一覧の両方で使用。
- `ATTACK_LABELS: Record<AttackType, string>` — ツールバーボタンの表示ラベル。
- `ATTACK_COLORS: Record<AttackType, string>` — 攻撃種別ごとの演出色。
- `ATTACK_TOOLS: Record<AttackType, string>` — 各攻撃に対応する実在ツール名(現実との接続用)。`ping`='hping3 / ICMP Echo', `port_scan`='Nmap / Masscan', `ssh_bruteforce`='Hydra / Medusa', `sql_injection`='sqlmap', `ddos`='Mirai(ボットネット) / LOIC', `ransomware`='WannaCry / LockBit'。`AttackToolbar.tsx`のボタンツールチップ(`title`属性)に使用。
- `ATTACK_DESCRIPTIONS: Record<AttackType, { summary: string; whatYouSee: string }>` — 攻撃実行中のリアルタイム解説パネル(`AttackExplanation.tsx`)用。各攻撃種別の「何をする攻撃か」(`summary`)と「今画面で見えているもの」(`whatYouSee`)を日本語で保持する。

**依存しているファイル**: `../../types`(`NodeType`, `TrafficType`, `AttackType`)

**このファイルを参照しているファイル**: `src/components/NetworkMap/NetworkMap.tsx`, `NodeView.tsx`, `ParticleCanvas.tsx`, `AttackEffectsLayer.tsx`, `AttackToolbar.tsx`, `useNetworkLayout.ts`

---

## `src/components/NetworkMap/networkMap.css`

**役割**: 背景グリッドのCSSアニメーションのみを定義する専用スタイルシート。`NetworkMap.tsx`からimportし、`.network-grid-bg`クラスをコンテナに付与して使用する。ダーク背景(`#0f172a`)上に`linear-gradient`の格子パターンを敷き、`background-position`のドリフトと`opacity`のパルスを無限ループさせる。グローバルな`index.css`は変更していない。

**依存しているファイル**: なし(純粋CSS)

**このファイルを参照しているファイル**: `src/components/NetworkMap/NetworkMap.tsx`(`import './networkMap.css'`)

---

## `src/components/EventLog/EventLog.tsx`

**役割**: 右カラムに表示するイベントログパネル本体。`useSimulationStore`から`logs`を読み取り、新しい順(直近100件まで)でスクロール可能なリストとして表示する。ログ追加時にFramer Motionでフェード+スライドイン、`critical`レベルは背景フラッシュで強調する。

**主要な型・関数**:
- `formatTime(timestamp: number): string` — `toLocaleTimeString('ja-JP', ...)`でタイムスタンプを`HH:MM:SS`形式に整形。
- `LogRow({ log }: { log: LogEntry })` — 1件分のログ行。`motion.div`で`initial={{opacity:0,x:20}} → animate={{opacity:1,x:0}}`のアニメーション。`level === 'critical'`の場合、赤背景がフェードアウトするオーバーレイ`motion.div`を重ねてフラッシュ効果を出す。左端の丸ドット(`getLevelStyle`の`dotClass`)、`type`バッジ(`getTypeBadgeStyle`/`formatTypeLabel`)、タイムスタンプ、メッセージ本文を表示。
- `levelBadgeCount(logs: LogEntry[], level: LogLevel): number` — 指定レベルのログ件数を集計(ヘッダーのcriticalバッジ件数表示に使用)。
- `EventLog()` (default export) — ルートコンポーネント。`logs.slice(-100).reverse()`で表示対象を生成。`listRef`+`useEffect`で`logs.length`変化時に`listRef.current.scrollTop = 0`を実行し、新規ログ追加時に常に最新(リスト先頭)が見えるようにする。ヘッダーに「イベントログ」タイトル、ログ総数バッジ、critical件数バッジを表示。0件時は空状態メッセージ(「イベントはまだありません」)を表示。

**依存しているファイル**: `../../store/simulationStore`(`useSimulationStore`、読み取り専用で`logs`のみ参照)、`../../types`(`LogEntry`, `LogLevel`の型インポート)、`./logStyles`(`getLevelStyle`, `getTypeBadgeStyle`, `formatTypeLabel`)、`framer-motion`(`AnimatePresence`, `motion`)

**このファイルを参照しているファイル**: `src/components/Layout/AppLayout.tsx`

---

## `src/components/EventLog/logStyles.ts`

**役割**: ログの`level`(info/warning/critical/success)と`type`(TrafficType | AttackType | 'system')から、Tailwindクラス文字列を導出するための純粋関数群。EventLog.tsxの表示ロジックから色分けルールを分離している。

**主要な型・関数**:
- `LevelStyle` interface — `{ borderClass, bgClass, dotClass, textClass }`。レベルごとの装飾クラスをまとめた型。
- `getLevelStyle(level: LogLevel): LevelStyle` — `info`=blue/slate, `warning`=amber, `critical`=red, `success`=emerald, `trivia`=indigo(border-indigo-500/40, bg-indigo-500/10, dot=bg-indigo-400, text=text-indigo-300) のスタイルセットを返す(内部の`LEVEL_STYLES: Record<LogLevel, LevelStyle>`で網羅的に定義)。
- `LogEntryType` type alias — `TrafficType | AttackType | 'system'`(`LogEntry['type']`と同じ形)。
- `getTypeBadgeStyle(type: LogEntryType): string` — `type`がどのカテゴリか(TRAFFIC_TYPES配列/ATTACK_TYPES配列に含まれるか)を文字列比較で判定し、対応するバッジ背景色+文字色のTailwindクラスを返す。トラフィック種別は`tailwind.config.js`の`traffic.*`カラー(normal/attack/dns/http/ssh)を使用。攻撃種別は独自のオレンジ/赤系/紫系配色(ping・port_scan=orange, ssh_bruteforce・sql_injection=rose, ddos=red, ransomware=fuchsia)。`system`または未知の文字列はスレートグレーのバッジにフォールバック。
- `formatTypeLabel(type: LogEntryType): string` — バッジ表示用に大文字化(`system`→`'SYSTEM'`、それ以外は`type.toUpperCase()`)。

**依存しているファイル**: `../../types`(`AttackType`, `LogLevel`, `TrafficType`の型インポートのみ、値は使わない)

**このファイルを参照しているファイル**: `src/components/EventLog/EventLog.tsx`

---

## `src/components/Timeline/Timeline.tsx`

**役割**: 画面下部に全幅で配置される横スクロール式のイベントタイムライン本体。`useSimulationStore`から`timeline`を読み取り、最初に記録されたイベントの`timestamp`を基準時刻として、各イベントを経過時間に応じたX座標に配置したマーカーとして描画する。新規イベント追加時はFramer Motionでスライドイン+フェードインし、コンテナを右端まで自動スクロールする。

**主要な型・関数**:
- `MarkerPosition` interface — `{ event: TimelineEvent, leftPx: number, elapsedSec: number }`。1イベントの描画位置情報。
- `buildMarkerPositions(timeline: TimelineEvent[]): MarkerPosition[]` — `timeline`配列の先頭要素の`timestamp`を基準(0秒)とし、各イベントの経過秒数(`elapsedSec`)と、それに`PIXELS_PER_SECOND`(40px/秒)を掛けて左パディング(`TRACK_PADDING`=24px)を加えたピクセル位置(`leftPx`)を算出。配列が空の場合は空配列を返す。
- `TimelineMarker({ position }: { position: MarkerPosition })` — 1イベント分のマーカー。`kind`ごとの色・グロー・アイコンは`getKindStyle`から取得。`motion.div`で`initial={{opacity:0,x:24,scale:0.6}} → animate={{opacity:1,x:0,scale:1}}`のスライドイン+フェードイン+スケールアニメーション。`title`属性に加え、`group-hover`で表示される独自ツールチップ(発生時刻・経過秒・種別ラベル・本文)をCSSのみで実装。
- `Timeline()` (default export) — ルートコンポーネント。`useMemo`で`positions`(`buildMarkerPositions`の結果)と`trackWidth`(最後のマーカー位置+両端パディング、最低`MIN_TRACK_WIDTH`=600pxを保証)を算出。`scrollRef`+`useEffect`で`timeline.length`変化時に`el.scrollLeft = el.scrollWidth`を実行し、新規イベント追加時に常に最新(右端)が見えるようにする。ヘッダーに「タイムライン」タイトルとイベント総数バッジを表示。0件時は空状態メッセージ(「まだイベントはありません」)を表示。トラック本体は`absolute`配置された横長バー(`bg-slate-800/60`)の上に、`AnimatePresence`でラップした`TimelineMarker`群を重ねる構成。

**定数**: `PIXELS_PER_SECOND = 40`(経過時間→ピクセル変換係数)、`MIN_TRACK_WIDTH = 600`(トラックの最低幅)、`TRACK_PADDING = 24`(トラック左右の余白)

**依存しているファイル**: `../../store/simulationStore`(`useSimulationStore`、読み取り専用で`timeline`のみ参照)、`../../types`(`TimelineEvent`の型インポートのみ)、`./timelineStyles`(`getKindStyle`, `formatClockTime`)、`framer-motion`(`AnimatePresence`, `motion`)

**このファイルを参照しているファイル**: `src/components/Layout/AppLayout.tsx`(画面下部・全幅の帯として配置。高さは親側で`h-32 md:h-40`に固定)

---

## `src/components/Timeline/timelineStyles.ts`

**役割**: `TimelineEvent`の`kind`(`TimelineEventKind`)から、マーカーの色・グロー・アイコン・日本語ラベルを導出するための純粋関数群。Timeline.tsxの表示ロジックから種別ごとの配色ルールを分離している。また、タイムスタンプの時刻文字列フォーマットも提供する。

**主要な型・関数**:
- `TimelineKindStyle` interface — `{ dotClass, glowClass, textClass, icon, label }`。種別ごとの装飾クラス・アイコン文字・日本語ラベルをまとめた型。
- `getKindStyle(kind: TimelineEventKind): TimelineKindStyle` — `switch`文で`TimelineEventKind`の全5種(`attack_start`=赤系、`attack_blocked`=橙系、`attack_success`=濃赤+強めグロー、`infection`=赤紫系、`system`=スレート系)を網羅的に分岐。`default`ケースで`const _exhaustive: never = kind`によるexhaustiveチェックを行い、将来`TimelineEventKind`に新種別が追加された場合はコンパイルエラーで検出できるようにしている。
- `formatClockTime(timestamp: number): string` — `toLocaleTimeString('ja-JP', ...)`でタイムスタンプを`HH:MM:SS`形式に整形(EventLogの`formatTime`と同等の実装方針)。

**依存しているファイル**: `../../types`(`TimelineEventKind`の型インポートのみ)

**このファイルを参照しているファイル**: `src/components/Timeline/Timeline.tsx`

---

## `src/components/StatsPanel/StatsPanel.tsx`

**役割**: 右下に浮かぶ統計HUDパネル本体。`useSimulationStore`から`stats`(読み取り専用)を取得し、CPU/Memory/Networkをバーゲージ(`GaugeBar`)、Attack Scoreをカウンター(`AttackScoreCounter`)として表示する。AppLayout側で`absolute bottom-4 right-4`配置される前提のため、本コンポーネント自身は位置指定を持たず、カードの見た目(サイズ・ガラスモーフィズム背景・枠線・shadow)のみを担う。

**主要な型・関数**:
- `StatsPanel()` (default export) — ルートコンポーネント。`w-64`のガラスモーフィズムカード(`bg-slate-900/70 backdrop-blur-md border border-slate-700/60 rounded-xl shadow-lg shadow-black/40`)。`motion.div`の`opacity`を`[0.96, 1, 0.96]`の範囲で4秒周期にゆるく往復させ、常時稼働している印象(breathe効果)を出す。ヘッダーに`animate-ping`を使ったライブ表示ドット+「System Stats」見出し。内部に`<GaugeBar label="CPU" value={stats.cpu} />`/`Memory`/`Network`の3本と、区切り線、`<AttackScoreCounter value={stats.attackScore} />`を縦に並べる。

**依存しているファイル**: `../../store/simulationStore`(`useSimulationStore`、`stats`のみ読み取り)、`./GaugeBar`、`./AttackScoreCounter`、`framer-motion`(`motion`)

**このファイルを参照しているファイル**: `src/components/Layout/AppLayout.tsx`(NetworkMap領域内に`absolute bottom-4 right-4`で重ねて配置)

---

## `src/components/StatsPanel/GaugeBar.tsx`

**役割**: 0-100の数値を横長バーゲージとして表示する再利用コンポーネント。CPU/Memory/Networkの3項目で共通利用する。値の変化を`useSpring`でばね物理アニメーション補間し、滑らかに伸縮させる。

**主要な型・関数**:
- `GaugeBarProps` interface — `{ label: string; value: number }`。`value`は0-100想定(範囲外は内部で`Math.max(0, Math.min(100, value))`によりクランプ)。
- `colorForValue(value: number): { bar: string; text: string; glow: string }` — 値に応じた配色を返す純粋関数。`0-40%`=緑系(`emerald`), `40-75%`=橙系(`amber`), `75-100%`=赤系(`red`)。
- `GaugeBar({ label, value }: GaugeBarProps)` (default export) — `useSpring(clamped, { stiffness: 120, damping: 20, mass: 0.5 })`で値をばね補間し、`useTransform`でパーセント幅文字列に変換して`motion.div`の`style.width`に適用。`useEffect`で`value`変化時に`springValue.set(clamped)`を呼び追従させる。上部にラベル(小文字・グレー)と現在値(色付き・太字)、下部に背景トラック+カラーバーのゲージ本体を表示。

**依存しているファイル**: `framer-motion`(`motion`, `useSpring`, `useTransform`)、`react`(`useEffect`)

**このファイルを参照しているファイル**: `src/components/StatsPanel/StatsPanel.tsx`

---

## `src/components/StatsPanel/AttackScoreCounter.tsx`

**役割**: 累積攻撃スコア(`SimStats.attackScore`、0以上・上限なし)を数値カウンターとして表示するコンポーネント。値が上昇した瞬間にスケールアップ+赤みのパルス強調アニメーションを一瞬見せ、閾値超過時は警告色・警告バッジに切り替える。

**主要な型・関数**:
- `AttackScoreCounterProps` interface — `{ value: number }`。
- `WARNING_THRESHOLD` 定数(`= 50`) — この値以上で警告表示(赤文字+「warning」点滅バッジ)に切り替わる閾値。
- `AttackScoreCounter({ value }: AttackScoreCounterProps)` (default export) — `useRef`で前回値を保持し、`useEffect`で`value`が前回より増加した場合に`pulseKey`をインクリメントして再アニメーションをトリガーする。数値本体は`motion.span`の`key={pulseKey}`により、値上昇時に`initial={{ scale: 1.35 }} → animate={{ scale: 1 }}`でスケールダウンするポップ効果。`AnimatePresence`配下に赤い半透明オーバーレイ(`motion.span`、`opacity`/`scale`をアニメーションさせるパルス)を一瞬重ねて表示する。`isWarning`が真の場合、数値色を`text-red-400`に、ヘッダー右側に点滅する「warning」バッジを表示する。

**依存しているファイル**: `framer-motion`(`motion`, `AnimatePresence`)、`react`(`useEffect`, `useRef`, `useState`)

**このファイルを参照しているファイル**: `src/components/StatsPanel/StatsPanel.tsx`

---

## `tailwind.config.js`

**役割**: TailwindCSS設定。コンテンツスキャン対象、カスタムカラー(`cyberbg`, `traffic.{normal,attack,dns,http,ssh}`)、`boxShadow.glow`、発光・パルス・呼吸アニメーション用keyframes/animationを定義。

**主要な設定**:
- `content: ['./index.html', './src/**/*.{ts,tsx}']`
- `theme.extend.colors.cyberbg = '#0f172a'`
- `theme.extend.colors.traffic` — normal(青) / attack(赤) / dns(紫) / http(水色) / ssh(緑)
- `theme.extend.boxShadow.glow = '0 0 12px 2px currentColor'`
- `theme.extend.keyframes['pulse-glow']`, `theme.extend.keyframes.breathe`
- `theme.extend.animation['pulse-glow']`, `theme.extend.animation.breathe`

**依存しているファイル**: なし

**このファイルを参照しているファイル**: `postcss.config.js`経由でビルドパイプライン全体(`src/index.css`の`@tailwind`ディレクティブを通じて全コンポーネントのclassName)

---

## その他の主要設定ファイル(参考)

- `vite.config.ts` — Vite設定。`base: '/shajitu/zemi/dist/'`を指定しており、この値がそのまま公開URL(https://mumekunx.github.io/shajitu/zemi/dist/)になる。GitHub Pagesが`main`ブランチを直接配信する構成のため、この値を変更すると公開URLそのものが変わり既存リンクが切れる(コメントで明記済み・値は変更禁止)。
- `.gitignore` — `node_modules`/`*.local`/エディタ生成物等を無視する。`dist`(ビルド成果物)は**意図的に無視対象から外している**(GitHub Pagesの配信対象そのものであるため、通常の`git add`でコミットする)。`dist-ssr`はSSRビルド用の別ディレクトリで無視対象のまま。
- `README.md` — プロジェクトのVite+Reactテンプレート説明に加え、「デプロイ」節で公開URL・配信の仕組み(Pagesが`main`を直接配信・`dist`がそのまま公開される)・更新手順(ビルド→`dist`ごとコミット→PR→マージで反映)・`base`変更禁止の注意書きを記載。
- `src/main.tsx` — Reactアプリのエントリポイント。`<App />`を`#root`にマウント
- `src/App.tsx` — `<AppLayout />`を返すルートコンポーネント。**Phase4で結線**: `useEffect`(マウント時)で`src/engine/simulationEngine`の`startEngine()`を呼び、クリーンアップ(アンマウント時)で`stopEngine()`を呼ぶ。これによりPhase3で実装された粒子生成・バックグラウンドトラフィック・stats更新のrAFループが実際に起動するようになった(Phase3完了時点ではどこからも呼ばれておらず、エンジンが一切動作しない状態だった)。
- `src/index.css` — `@tailwind base/components/utilities` + `body { background-color: #0f172a; }`
- `tsconfig.app.json` / `tsconfig.node.json` — `strict: true`を明示的に追加済み
- `postcss.config.js` — `npx tailwindcss init -p`で生成(tailwindcss/autoprefixerプラグイン登録)

---

## Phase4 統合確認結果

- `src/App.tsx`に`startEngine()`/`stopEngine()`の結線を追加(上記参照)。これがPhase3→Phase4移行での唯一の未接続ポイントだった。
- `AttackToolbar.tsx`が呼ぶ`triggerAttack(type, sourceId, targetId)`と`simulationEngine.ts`の実装シグネチャ`triggerAttack(type: AttackType, sourceId: string, targetId: string): void`は完全一致しており、修正は不要だった。
- `npx tsc --noEmit`: エラーなし
- `npm run build`: 成功
- `npx oxlint src`: 結果は本ファイル末尾の確認結果セクション、または各エージェントのPhase3確認結果を参照
