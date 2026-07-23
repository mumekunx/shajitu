import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSimulationStore } from '../../store/simulationStore';
import type { LogEntry, LogLevel } from '../../types';
import { getLevelStyle, getTypeBadgeStyle, formatTypeLabel } from './logStyles';

const MAX_VISIBLE_LOGS = 100;

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function LogRow({ log }: { log: LogEntry }) {
  const levelStyle = getLevelStyle(log.level);
  const badgeStyle = getTypeBadgeStyle(log.type);
  const isCritical = log.level === 'critical';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`relative mb-1.5 overflow-hidden rounded-md border-l-2 ${levelStyle.borderClass} ${levelStyle.bgClass} px-2 py-1.5`}
    >
      {isCritical && (
        <motion.div
          className="absolute inset-0 bg-red-500"
          initial={{ opacity: 0.55 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      )}
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${levelStyle.dotClass}`} />
          <span className={`truncate rounded px-1 py-0.5 text-[10px] font-semibold leading-none ${badgeStyle}`}>
            {formatTypeLabel(log.type)}
          </span>
        </div>
        <span className="flex-shrink-0 text-[10px] tabular-nums text-slate-500">
          {formatTime(log.timestamp)}
        </span>
      </div>
      <p className={`relative mt-1 break-words text-xs leading-snug ${levelStyle.textClass}`}>{log.message}</p>
    </motion.div>
  );
}

function levelBadgeCount(logs: LogEntry[], level: LogLevel): number {
  return logs.filter((log) => log.level === level).length;
}

export default function EventLog() {
  const logs = useSimulationStore((state) => state.logs);
  const listRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const visibleLogs = logs.slice(-MAX_VISIBLE_LOGS).reverse();
  const criticalCount = levelBadgeCount(logs, 'critical');

  useEffect(() => {
    if (logs.length !== prevCountRef.current && listRef.current) {
      listRef.current.scrollTop = 0;
    }
    prevCountRef.current = logs.length;
  }, [logs.length]);

  return (
    <div className="flex h-full w-full flex-col rounded-lg border border-slate-800 bg-slate-900/60">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-800 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-glow" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            イベントログ
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {criticalCount > 0 && (
            <span className="rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
              critical {criticalCount}
            </span>
          )}
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
            {logs.length}
          </span>
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-2 py-2">
        {visibleLogs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-slate-500">
            <span className="text-xs">イベントはまだありません</span>
            <span className="text-[10px] text-slate-600">シミュレーションを開始すると表示されます</span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {visibleLogs.map((log) => (
              <LogRow key={log.id} log={log} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
