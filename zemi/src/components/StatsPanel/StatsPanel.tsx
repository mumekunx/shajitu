import { motion } from 'framer-motion';
import { useSimulationStore } from '../../store/simulationStore';
import GaugeBar from './GaugeBar';
import AttackScoreCounter from './AttackScoreCounter';

/** コンパクト表示(lg未満)でAttack Scoreを警告色にする閾値。AttackScoreCounterのWARNING_THRESHOLDと同値 */
const COMPACT_WARNING_THRESHOLD = 50;

function CompactStat({
  label,
  value,
  highlight,
  unit,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  unit?: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
      <span className="text-[9px] font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <span className={`text-sm font-bold tabular-nums ${highlight ? 'text-red-400' : 'text-slate-100'}`}>
        {Math.round(value)}
        {unit && <span className="ml-px text-[10px] font-medium text-slate-400">{unit}</span>}
      </span>
    </div>
  );
}

/**
 * 統計HUDパネル。
 * NetworkMap側の下部コントロール領域(AttackToolbarと並ぶ)内に配置されるため、
 * 本コンポーネント自身は絶対配置を持たない。
 * lg以上: 従来どおりCPU/Memory/Networkをバーゲージ、Attack Scoreをカウンターで縦積み表示。
 * lg未満(モバイルタブ切替UI): マップの高さを大きく奪わないよう、横1行のコンパクト指標列
 * (ラベル+数値のみ、高さ目安60px)に切り替える。同一コンポーネントインスタンス内に両方の
 * マークアップを持ち、Tailwindの`lg:`プレフィックスで表示を切り替える(状態共有の問題は無い)。
 */
export default function StatsPanel() {
  const stats = useSimulationStore((state) => state.stats);

  return (
    <>
      {/* lg未満: 横1行のコンパクト表示(マップを圧迫しないための簡略版) */}
      <div className="flex w-full items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/70 px-3 py-2 shadow-lg shadow-black/40 backdrop-blur-md lg:hidden">
        <CompactStat label="CPU" value={stats.cpu} unit="%" />
        <CompactStat label="MEM" value={stats.memory} unit="%" />
        <CompactStat label="NET" value={stats.network} unit="%" />
        <div className="h-6 w-px shrink-0 bg-slate-700/50" />
        <CompactStat
          label="SCORE"
          value={stats.attackScore}
          highlight={stats.attackScore >= COMPACT_WARNING_THRESHOLD}
        />
      </div>

      {/* lg以上: 従来のカード表示(変更なし) */}
      <motion.div
        className="hidden w-64 rounded-xl border border-slate-700/60 bg-slate-900/70 p-4 shadow-lg shadow-black/40 backdrop-blur-md lg:block"
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
    </>
  );
}
