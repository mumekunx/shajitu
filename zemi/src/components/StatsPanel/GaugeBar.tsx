import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface GaugeBarProps {
  label: string;
  value: number; // 0-100
}

/**
 * 値に応じて緑(低)→黄/橙(中)→赤(高)に変化するバーゲージ。
 * 0-40%=緑系, 40-75%=黄/橙系, 75-100%=赤系。
 */
function colorForValue(value: number): { bar: string; text: string; glow: string } {
  if (value < 40) {
    return { bar: 'bg-emerald-500', text: 'text-emerald-400', glow: 'shadow-emerald-500/50' };
  }
  if (value < 75) {
    return { bar: 'bg-amber-500', text: 'text-amber-400', glow: 'shadow-amber-500/50' };
  }
  return { bar: 'bg-red-500', text: 'text-red-400', glow: 'shadow-red-500/50' };
}

export default function GaugeBar({ label, value }: GaugeBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const springValue = useSpring(clamped, { stiffness: 120, damping: 20, mass: 0.5 });
  const width = useTransform(springValue, (v) => `${v}%`);
  const { bar, text, glow } = colorForValue(clamped);

  useEffect(() => {
    springValue.set(clamped);
  }, [clamped, springValue]);

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <span className={`text-sm font-semibold tabular-nums ${text}`}>
          {Math.round(clamped)}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
        <motion.div
          className={`h-full rounded-full ${bar} shadow-sm ${glow}`}
          style={{ width }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
