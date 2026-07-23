import { useSimulationStore } from '../store/simulationStore';
import type { AttackType, SshAuthMethod } from '../types';
import { particleSystem } from './particleSystem';
import { spawnBackgroundTraffic, driftStatsIdle, bumpAttackScore } from './backgroundTraffic';
import { runAttackScript, clearAllAttackTimers } from './attackScripts';

let rafId: number | null = null;
let lastTimestamp: number | null = null;

const ATTACK_SCORE_INCREMENT_PER_SEC = 0.6;

function frame(timestamp: number): void {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }
  const dtMs = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  // 粒子の更新
  particleSystem.tick(dtMs);

  // 通常時のバックグラウンドトラフィック
  spawnBackgroundTraffic();

  const { activeAttacks } = useSimulationStore.getState();

  if (activeAttacks.length > 0) {
    bumpAttackScore((ATTACK_SCORE_INCREMENT_PER_SEC * dtMs) / 1000);
  } else {
    driftStatsIdle();
  }

  // statsの定常ドリフトは攻撃中でも下限を保つために常時呼んでおく
  // (driftStatsIdle内でattackScoreは攻撃中はスキップされるためcpu/memory/networkのみ緩く動く)
  if (activeAttacks.length > 0) {
    // 攻撃中はcpu/memory/networkも軽く揺らす(大きな跳ね上げは各攻撃スクリプト側が担当)
    const { stats, setStats } = useSimulationStore.getState();
    const jitter = (v: number) => Math.min(100, Math.max(0, v + (Math.random() * 2 - 1) * 1.5));
    setStats({
      cpu: jitter(stats.cpu),
      memory: jitter(stats.memory),
      network: jitter(stats.network),
    });
  }

  rafId = requestAnimationFrame(frame);
}

export function startEngine(): void {
  if (rafId !== null) return; // 二重起動防止
  lastTimestamp = null;
  rafId = requestAnimationFrame(frame);
}

export function stopEngine(): void {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = null;
  lastTimestamp = null;
  clearAllAttackTimers();
}

export function triggerAttack(
  type: AttackType,
  sourceId: string,
  targetId: string,
  authMethod: SshAuthMethod = 'password'
): void {
  const { addAttack, addLog, addTimelineEvent } = useSimulationStore.getState();

  const attackId = addAttack({ type, sourceId, targetId });

  addLog({
    level: 'warning',
    type,
    message: `攻撃を検知: ${type} (${sourceId} -> ${targetId})`,
  });
  addTimelineEvent({ label: `攻撃開始: ${type}`, kind: 'attack_start' });

  runAttackScript(type, attackId, sourceId, targetId, authMethod);
}
