import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface AttackScoreCounterProps {
  value: number; // 0以上、累積値
}

/** Attack Scoreがこの値以上になると警告色(赤)で表示する */
const WARNING_THRESHOLD = 50;

/**
 * 累積攻撃スコアを表示するカウンター。
 * 値が上昇した瞬間にスケールアップ + 赤みのパルスを一瞬見せる。
 */
export default function AttackScoreCounter({ value }: AttackScoreCounterProps) {
  const [pulseKey, setPulseKey] = useState(0);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value > prevValue.current) {
      setPulseKey((key) => key + 1);
    }
    prevValue.current = value;
  }, [value]);

  const isWarning = value >= WARNING_THRESHOLD;

  return (
    <div className="relative w-full">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
          Attack Score
        </span>
        {isWarning && (
          <motion.span
            className="rounded-full bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-400"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            warning
          </motion.span>
        )}
      </div>
      <div className="relative">
        <motion.span
          key={pulseKey}
          className={`text-2xl font-bold tabular-nums ${
            isWarning ? 'text-red-400' : 'text-sky-300'
          }`}
          initial={pulseKey === 0 ? false : { scale: 1.35 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {Math.max(0, Math.round(value))}
        </motion.span>
        <AnimatePresence>
          {pulseKey > 0 && (
            <motion.span
              key={`pulse-${pulseKey}`}
              className="pointer-events-none absolute -inset-2 -z-10 rounded-lg bg-red-500/30"
              initial={{ opacity: 0.7, scale: 0.9 }}
              animate={{ opacity: 0, scale: 1.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
