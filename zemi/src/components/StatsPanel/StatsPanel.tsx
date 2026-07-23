import { motion } from 'framer-motion';
import { useSimulationStore } from '../../store/simulationStore';
import GaugeBar from './GaugeBar';
import AttackScoreCounter from './AttackScoreCounter';

/**
 * 統計HUDパネル。
 * CPU/Memory/Networkをバーゲージ、Attack Scoreをカウンターで表示する。
 * NetworkMap側の下部オーバーレイ行(AttackToolbarと左右に並ぶ)内に配置されるため、
 * 本コンポーネント自身は配置指定を持たない。
 */
export default function StatsPanel() {
  const stats = useSimulationStore((state) => state.stats);

  return (
    <motion.div
      className="w-64 rounded-xl border border-slate-700/60 bg-slate-900/70 p-4 shadow-lg shadow-black/40 backdrop-blur-md"
      animate={{ opacity: [0.96, 1, 0.96] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
        </span>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-200">
          System Stats
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        <GaugeBar label="CPU" value={stats.cpu} />
        <GaugeBar label="Memory" value={stats.memory} />
        <GaugeBar label="Network" value={stats.network} />

        <div className="my-1 h-px bg-slate-700/50" />

        <AttackScoreCounter value={stats.attackScore} />
      </div>
    </motion.div>
  );
}
