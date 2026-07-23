import { useSimulationStore } from '../store/simulationStore';
import { particleSystem } from './particleSystem';

/**
 * 値を [min, max] の範囲にクランプしつつ、ランダムウォークで1ステップ進める。
 */
function randomWalk(value: number, min: number, max: number, step: number): number {
  const next = value + (Math.random() * 2 - 1) * step;
  return Math.min(max, Math.max(min, next));
}

/**
 * 通常時のバックグラウンドトラフィック粒子を、各リンクのintensityに応じて
 * 低頻度・少量で生成する。攻撃が活性化しているリンクは攻撃側ロジックで別途
 * 大量に粒子を生成するため、ここでは「平常時の地肌」程度の密度に留める。
 */
export function spawnBackgroundTraffic(): void {
  const { links } = useSimulationStore.getState();
  for (const link of links) {
    // intensity 0.2-0.6 程度 -> 1フレームあたり数%の確率で1-3個生成
    const spawnChance = link.intensity * 0.12;
    if (Math.random() < spawnChance) {
      const count = 1 + Math.floor(Math.random() * 3); // 1-3
      particleSystem.spawnForLink(link, count);
    }
  }
}

/**
 * cpu/memory/network statsを定常状態(攻撃なし)に向けて緩やかに揺らす。
 * 攻撃が活性化していない間に毎フレーム呼ぶ。
 */
export function driftStatsIdle(): void {
  const { stats, setStats, activeAttacks } = useSimulationStore.getState();

  const targetCpuRange: [number, number] = [5, 25];
  const targetMemRange: [number, number] = [10, 30];
  const targetNetRange: [number, number] = [5, 20];

  const cpu = randomWalk(stats.cpu, targetCpuRange[0], targetCpuRange[1], 1.2);
  const memory = randomWalk(stats.memory, targetMemRange[0], targetMemRange[1], 0.8);
  const network = randomWalk(stats.network, targetNetRange[0], targetNetRange[1], 1.0);

  // attackScoreの自然減衰(0未満にはしない)。攻撃中は別途増加させる。
  const attackScore =
    activeAttacks.length === 0
      ? Math.max(0, stats.attackScore - 0.05)
      : stats.attackScore;

  setStats({ cpu, memory, network, attackScore });
}

/**
 * 攻撃中に攻撃スコアを微増させる(activeAttacksが空でない場合に毎フレーム呼ぶ)。
 */
export function bumpAttackScore(amount: number): void {
  const { stats, setStats } = useSimulationStore.getState();
  setStats({ attackScore: stats.attackScore + amount });
}

/**
 * statsを一時的に持ち上げる(攻撃の影響)。現在値とターゲット範囲の間でランダムウォークしつつ、
 * 最低保証値(floor)を設けることで「高止まり」を表現する。
 */
export function elevateStats(
  patch: Partial<{ cpuFloor: number; memoryFloor: number; networkFloor: number }>
): void {
  const { stats, setStats } = useSimulationStore.getState();
  const next: { cpu?: number; memory?: number; network?: number } = {};

  if (patch.cpuFloor !== undefined && stats.cpu < patch.cpuFloor) {
    next.cpu = randomWalk(stats.cpu, patch.cpuFloor, 100, 6);
  }
  if (patch.memoryFloor !== undefined && stats.memory < patch.memoryFloor) {
    next.memory = randomWalk(stats.memory, patch.memoryFloor, 100, 4);
  }
  if (patch.networkFloor !== undefined && stats.network < patch.networkFloor) {
    next.network = randomWalk(stats.network, patch.networkFloor, 100, 6);
  }

  if (Object.keys(next).length > 0) {
    setStats(next);
  }
}
