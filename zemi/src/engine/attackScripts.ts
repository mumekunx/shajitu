import { useSimulationStore } from '../store/simulationStore';
import type { AttackType, NetworkLink, SshAuthMethod } from '../types';
import { particleSystem } from './particleSystem';
import { elevateStats } from './backgroundTraffic';

/**
 * setTimeoutで管理しているタイマーIDの集合。stopEngine()からまとめてクリアできるようにする。
 */
const activeTimers = new Set<ReturnType<typeof setTimeout>>();

function schedule(fn: () => void, delayMs: number): ReturnType<typeof setTimeout> {
  const timer = setTimeout(() => {
    activeTimers.delete(timer);
    fn();
  }, delayMs);
  activeTimers.add(timer);
  return timer;
}

export function clearAllAttackTimers(): void {
  for (const timer of activeTimers) {
    clearTimeout(timer);
  }
  activeTimers.clear();
}

/** sourceId -> targetId のリンクを探す(双方向どちらの組み合わせでもよい)。 */
function findLink(sourceId: string, targetId: string): NetworkLink | undefined {
  const { links } = useSimulationStore.getState();
  return links.find(
    (l) =>
      (l.source === sourceId && l.target === targetId) ||
      (l.source === targetId && l.target === sourceId)
  );
}

function findLinkByTrafficType(trafficType: NetworkLink['trafficType']): NetworkLink | undefined {
  const { links } = useSimulationStore.getState();
  return links.find((l) => l.trafficType === trafficType);
}

function findAnyLinkInvolving(nodeId: string): NetworkLink | undefined {
  const { links } = useSimulationStore.getState();
  return links.find((l) => l.source === nodeId || l.target === nodeId);
}

function getInternalNodeIds(): string[] {
  const { nodes } = useSimulationStore.getState();
  return nodes
    .filter((n) => n.type !== 'attacker' && n.type !== 'internet')
    .map((n) => n.id);
}

function flashLinkIntensity(link: NetworkLink, intensity: number, durationMs: number): void {
  const { updateLink, links } = useSimulationStore.getState();
  const original = links.find((l) => l.id === link.id)?.intensity ?? link.intensity;
  updateLink(link.id, { intensity });
  schedule(() => {
    updateLink(link.id, { intensity: original });
  }, durationMs);
}

function flashLinkBlocked(link: NetworkLink, durationMs: number): void {
  const { updateLink } = useSimulationStore.getState();
  updateLink(link.id, { blocked: true });
  schedule(() => {
    updateLink(link.id, { blocked: false });
  }, durationMs);
}

// ---------------------------------------------------------------------------
// 1. ping
// ---------------------------------------------------------------------------
function runPing(attackId: string, sourceId: string, targetId: string): void {
  const { updateAttack, removeAttack, addLog } = useSimulationStore.getState();
  const link = findLink(sourceId, targetId) ?? findAnyLinkInvolving(sourceId);

  const totalDurationMs = 2000;
  const steps = 4;
  const stepMs = totalDurationMs / steps;

  if (link) {
    flashLinkIntensity(link, Math.min(1, link.intensity + 0.3), totalDurationMs);
  }

  for (let i = 0; i < steps; i++) {
    schedule(() => {
      if (link) {
        particleSystem.spawnForLink({ ...link, trafficType: 'attack' }, 2);
      }
      updateAttack(attackId, { progress: (i + 1) / steps });
    }, i * stepMs);
  }

  schedule(() => {
    addLog({ level: 'info', type: 'ping', message: `Ping応答あり (${sourceId} -> ${targetId})` });
    addLog({
      level: 'trivia',
      type: 'ping',
      message:
        '豆知識: 実際のpingは応答の有無や遅延(ms)を測る正常な診断コマンドで、攻撃前の「生存確認」に悪用されることがあります。',
    });
    removeAttack(attackId);
  }, totalDurationMs);
}

// ---------------------------------------------------------------------------
// 2. port_scan
// ---------------------------------------------------------------------------
function runPortScan(attackId: string, sourceId: string): void {
  const { updateAttack, removeAttack, addLog } = useSimulationStore.getState();
  const targets = getInternalNodeIds();
  const totalDurationMs = 4000 + Math.random() * 2000; // 4-6秒
  const stepCount = Math.max(targets.length, 4);
  const stepMs = totalDurationMs / stepCount;
  let scanned = 0;

  for (let i = 0; i < stepCount; i++) {
    schedule(() => {
      const targetId = targets[i % targets.length];
      const link = findAnyLinkInvolving(targetId) ?? findAnyLinkInvolving(sourceId);
      if (link) {
        particleSystem.spawnForLink({ ...link, trafficType: 'attack' }, 2);
      }
      scanned += 1;
      updateAttack(attackId, { targetId, progress: (i + 1) / stepCount });
    }, i * stepMs);
  }

  schedule(() => {
    addLog({
      level: 'warning',
      type: 'port_scan',
      message: `${scanned}個のポートをスキャンされました`,
    });
    addLog({
      level: 'trivia',
      type: 'port_scan',
      message:
        '豆知識: 現実のポートスキャンは検知を避けるため数時間〜数日かけて行われることもあります(Nmapには低速スキャンモードがあります)。',
    });
    removeAttack(attackId);
  }, totalDurationMs);
}

// ---------------------------------------------------------------------------
// 3. ssh_bruteforce
// ---------------------------------------------------------------------------
function runSshBruteforce(
  attackId: string,
  sourceId: string,
  targetId: string,
  authMethod: SshAuthMethod = 'password'
): void {
  const { updateAttack, removeAttack, addLog, addTimelineEvent, updateNode } =
    useSimulationStore.getState();
  const link =
    findLinkByTrafficType('ssh') ?? findLink(sourceId, targetId) ?? findAnyLinkInvolving(targetId);

  const totalDurationMs = 6000 + Math.random() * 2000; // 6-8秒
  const attemptCount = 10;
  const stepMs = totalDurationMs / attemptCount;
  const successAttemptIndex = Math.floor(Math.random() * attemptCount); // 1回だけ低確率で成功させる候補
  const successChance = authMethod === 'publickey' ? 0.005 : 0.15;
  let succeeded = false;

  for (let i = 0; i < attemptCount; i++) {
    schedule(() => {
      if (link) {
        particleSystem.spawnForLink({ ...link, trafficType: 'attack' }, 6);
      }

      // 約70%の確率でブロック、低確率(認証方式に応じて可変)で成功
      const isSuccessAttempt = i === successAttemptIndex && Math.random() < successChance && !succeeded;
      if (isSuccessAttempt) {
        succeeded = true;
        updateAttack(attackId, { blocked: false, progress: (i + 1) / attemptCount });
        updateNode(targetId, { infected: true, health: 15 });
        addLog({
          level: 'critical',
          type: 'ssh_bruteforce',
          message: `SSHブルートフォース攻撃が成功しました (${targetId})`,
        });
        addTimelineEvent({ label: `SSH侵入成功: ${targetId}`, kind: 'attack_success' });
      } else {
        const isBlocked = Math.random() < 0.7;
        updateAttack(attackId, { blocked: isBlocked, progress: (i + 1) / attemptCount });
        if (link && isBlocked) {
          flashLinkBlocked(link, stepMs * 0.8);
        }
        schedule(() => {
          updateAttack(attackId, { blocked: false });
        }, stepMs * 0.5);
      }
    }, i * stepMs);
  }

  schedule(() => {
    if (!succeeded) {
      addLog({
        level: 'info',
        type: 'ssh_bruteforce',
        message: 'SSHブルートフォース攻撃はファイアウォールにより阻止されました',
      });
      addTimelineEvent({ label: 'SSHブルートフォース阻止', kind: 'attack_blocked' });
    }
    addLog({
      level: 'trivia',
      type: 'ssh_bruteforce',
      message:
        '豆知識: 現実のブルートフォースは成功まで数千〜数百万回の試行が必要な場合もあり、多くは失敗し続けます。公開鍵認証ならほぼ不可能です。',
    });
    removeAttack(attackId);
  }, totalDurationMs);
}

// ---------------------------------------------------------------------------
// 4. sql_injection
// ---------------------------------------------------------------------------
function runSqlInjection(attackId: string, sourceId: string, targetId: string): void {
  const { updateAttack, removeAttack, addLog, addTimelineEvent, updateNode } =
    useSimulationStore.getState();
  const link = findLinkByTrafficType('http') ?? findLink(sourceId, targetId);

  const totalDurationMs = 3000 + Math.random() * 2000; // 3-5秒
  const attemptCount = 5;
  const stepMs = totalDurationMs / attemptCount;

  for (let i = 0; i < attemptCount; i++) {
    schedule(() => {
      if (link) {
        particleSystem.spawnForLink({ ...link, trafficType: 'attack' }, 3);
      }
      updateAttack(attackId, { progress: (i + 1) / attemptCount });
    }, i * stepMs);
  }

  schedule(() => {
    const success = Math.random() < 0.5;

    if (success) {
      updateAttack(attackId, { blocked: false });
      updateNode(targetId, { infected: true, health: 40 });
      addLog({
        level: 'critical',
        type: 'sql_injection',
        message: `SQLインジェクション攻撃が成功しました (${targetId})`,
      });
      addTimelineEvent({ label: `SQLインジェクション成功: ${targetId}`, kind: 'attack_success' });
    } else {
      updateAttack(attackId, { blocked: true });
      if (link) flashLinkBlocked(link, 600);
      addLog({
        level: 'info',
        type: 'sql_injection',
        message: '入力値検証/ファイアウォールによりSQLインジェクションを阻止しました',
      });
      addTimelineEvent({ label: 'SQLインジェクション阻止', kind: 'attack_blocked' });
    }

    addLog({
      level: 'trivia',
      type: 'sql_injection',
      message:
        '豆知識: SQLインジェクションはパラメータ化クエリ(プレースホルダ)で完全に防げます。sqlmap等は脆弱な入力箇所を自動探索します。',
    });
    removeAttack(attackId);
  }, totalDurationMs);
}

// ---------------------------------------------------------------------------
// 5. ddos
// ---------------------------------------------------------------------------
function runDdos(attackId: string, targetId: string): void {
  const { updateAttack, removeAttack, addLog, links, updateLink } = useSimulationStore.getState();
  const totalDurationMs = 8000 + Math.random() * 2000; // 8-10秒
  const burstIntervalMs = 250;
  const burstCount = Math.floor(totalDurationMs / burstIntervalMs);

  // attackerからfirewall/internetへの全リンク、もしくはtargetに繋がる全リンク
  const attackLinks = links.filter(
    (l) =>
      l.source.startsWith('attacker') ||
      l.target === targetId ||
      l.source === targetId
  );
  const sourceLinks = attackLinks.length > 0 ? attackLinks : links;

  for (let i = 0; i < burstCount; i++) {
    schedule(() => {
      for (const link of sourceLinks) {
        const count = 10 + Math.floor(Math.random() * 21); // 10-30
        particleSystem.spawnForLink({ ...link, trafficType: 'attack' }, count);
        // 大半はfirewallでブロックされる
        if (Math.random() < 0.8) {
          updateLink(link.id, { blocked: true });
          schedule(() => updateLink(link.id, { blocked: false }), burstIntervalMs * 0.8);
        }
      }
      elevateStats({ networkFloor: 80, cpuFloor: 70 });
      updateAttack(attackId, { progress: Math.min(1, (i + 1) / burstCount) });
    }, i * burstIntervalMs);
  }

  addLog({ level: 'critical', type: 'ddos', message: `DDoS攻撃開始: ${targetId} への大量通信を検知` });

  schedule(() => {
    addLog({ level: 'info', type: 'ddos', message: 'DDoS終息' });
    addLog({
      level: 'trivia',
      type: 'ddos',
      message:
        '豆知識: 現実のDDoSは単一ではなく世界中に分散した数万台規模のボットネットから同時に行われ、攻撃元の特定と遮断が困難です。',
    });
    removeAttack(attackId);
  }, totalDurationMs);
}

// ---------------------------------------------------------------------------
// 6. ransomware
// ---------------------------------------------------------------------------
function runRansomware(attackId: string, targetId: string): void {
  const { updateAttack, removeAttack, addLog, addTimelineEvent, updateNode, nodes, links } =
    useSimulationStore.getState();

  updateNode(targetId, { infected: true, health: 25 });
  addLog({ level: 'critical', type: 'ransomware', message: `ランサムウェア感染が検知されました (${targetId})` });
  addTimelineEvent({ label: `ランサムウェア感染開始: ${targetId}`, kind: 'infection' });

  const infected = new Set<string>([targetId]);
  const internalNodeIds = nodes
    .filter((n) => n.type !== 'attacker' && n.type !== 'internet')
    .map((n) => n.id);
  const maxInfections = Math.max(1, Math.ceil(internalNodeIds.length / 2));

  const totalDurationMs = 6000 + Math.random() * 2000; // 6-8秒
  const stepMs = 1500;
  const stepCount = Math.floor(totalDurationMs / stepMs);

  for (let i = 0; i < stepCount; i++) {
    schedule(() => {
      if (infected.size >= maxInfections) {
        updateAttack(attackId, { progress: 1 });
        return;
      }

      // 現在感染しているノードに隣接する未感染ノードを探す
      const candidates = new Set<string>();
      for (const link of links) {
        if (infected.has(link.source) && !infected.has(link.target)) {
          candidates.add(link.target);
        }
        if (infected.has(link.target) && !infected.has(link.source)) {
          candidates.add(link.source);
        }
      }

      const candidateList = Array.from(candidates).filter((id) =>
        internalNodeIds.includes(id)
      );

      for (const candidateId of candidateList) {
        if (infected.size >= maxInfections) break;
        if (Math.random() < 0.6) {
          infected.add(candidateId);
          updateNode(candidateId, { infected: true, health: 30 });
          addLog({
            level: 'critical',
            type: 'ransomware',
            message: `ランサムウェアが感染拡大しました (${candidateId})`,
          });
          addTimelineEvent({ label: `ランサムウェア感染拡大: ${candidateId}`, kind: 'infection' });
        }
      }

      updateAttack(attackId, { progress: Math.min(1, (i + 1) / stepCount) });
    }, i * stepMs);
  }

  schedule(() => {
    addLog({
      level: 'trivia',
      type: 'ransomware',
      message:
        '豆知識: 現実のランサムウェアは暗号化まで数日〜数週間潜伏して横展開することがあり、オフラインバックアップが最も有効な対策です。',
    });
    removeAttack(attackId);
  }, totalDurationMs);
}

// ---------------------------------------------------------------------------
// エントリポイント
// ---------------------------------------------------------------------------
export function runAttackScript(
  attackType: AttackType,
  attackId: string,
  sourceId: string,
  targetId: string,
  authMethod: SshAuthMethod = 'password'
): void {
  switch (attackType) {
    case 'ping':
      runPing(attackId, sourceId, targetId);
      break;
    case 'port_scan':
      runPortScan(attackId, sourceId);
      break;
    case 'ssh_bruteforce':
      runSshBruteforce(attackId, sourceId, targetId, authMethod);
      break;
    case 'sql_injection':
      runSqlInjection(attackId, sourceId, targetId);
      break;
    case 'ddos':
      runDdos(attackId, targetId);
      break;
    case 'ransomware':
      runRansomware(attackId, targetId);
      break;
  }
}
