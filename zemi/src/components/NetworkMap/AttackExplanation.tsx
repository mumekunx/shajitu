import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSimulationStore } from '../../store/simulationStore';
import type { AttackType } from '../../types';
import { ATTACK_LABELS, ATTACK_DESCRIPTIONS } from './constants';

/** 攻撃終了後もカードを読める時間だけ残してからフェードアウトさせる猶予(ms) */
const LINGER_MS = 4000;

/**
 * AttackExplanation: 攻撃実行中に「今何が起きているか」を示すリアルタイム解説パネル。
 * - activeAttacks を購読し、最後(最新)に開始された攻撃の種別を表示する
 * - activeAttacks が空になっても即座には消さず、LINGER_MS 経過後にフェードアウトする
 * - 既存の攻撃終了時「豆知識」ログ(trivia)とは別物。こちらは実行中の解説。
 */
export default function AttackExplanation() {
  const activeAttacks = useSimulationStore((state) => state.activeAttacks);
  const [displayedType, setDisplayedType] = useState<AttackType | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const latestType = activeAttacks.length > 0 ? activeAttacks[activeAttacks.length - 1].type : null;

  useEffect(() => {
    if (latestType !== null) {
      // 新しい攻撃が来た(または継続中) : 消去タイマーがあれば解除し、即座に表示を更新
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setDisplayedType(latestType);
    } else {
      // 全ての攻撃が終了 : 数秒読める余裕を持たせてから消す
      timerRef.current = setTimeout(() => {
        setDisplayedType(null);
        timerRef.current = null;
      }, LINGER_MS);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [latestType]);

  const description = displayedType ? ATTACK_DESCRIPTIONS[displayedType] : null;

  return (
    // z-30: 下部オーバーレイ行(z-20)より前面、モーダル本体(z-50)より背面に位置づける
    <div className="pointer-events-none absolute top-4 left-1/2 z-30 w-[min(90%,28rem)] max-w-md -translate-x-1/2">
      <AnimatePresence>
        {displayedType && description && (
          <motion.div
            key={displayedType}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-3 shadow-lg backdrop-blur"
          >
            <p className="text-sm font-bold text-red-300">{ATTACK_LABELS[displayedType]}</p>
            <p className="mt-1 text-sm text-slate-200">{description.summary}</p>
            <p className="mt-2 text-xs text-slate-400">画面で見えているもの</p>
            <p className="text-xs text-slate-300">{description.whatYouSee}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
