import { useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSimulationStore } from '../../store/simulationStore';
import type { TimelineEvent } from '../../types';
import { getKindStyle, formatClockTime } from './timelineStyles';

/** 1秒あたりのトラック上のピクセル幅(経過時間の表示スケール) */
const PIXELS_PER_SECOND = 40;
/** トラックの最低幅(イベントが少ない/直後でも一定の横スクロール領域を確保) */
const MIN_TRACK_WIDTH = 600;
/** マーカー同士が重ならないための左右余白 */
const TRACK_PADDING = 24;

interface MarkerPosition {
  event: TimelineEvent;
  leftPx: number;
  elapsedSec: number;
}

function buildMarkerPositions(timeline: TimelineEvent[]): MarkerPosition[] {
  if (timeline.length === 0) return [];
  const baseTimestamp = timeline[0].timestamp;
  return timeline.map((event) => {
    const elapsedSec = Math.max(0, (event.timestamp - baseTimestamp) / 1000);
    return {
      event,
      leftPx: TRACK_PADDING + elapsedSec * PIXELS_PER_SECOND,
      elapsedSec,
    };
  });
}

function TimelineMarker({ position }: { position: MarkerPosition }) {
  const { event, leftPx, elapsedSec } = position;
  const style = getKindStyle(event.kind);
  const tooltip = `${formatClockTime(event.timestamp)} (+${elapsedSec.toFixed(1)}s) ${event.label}`;

  return (
    <motion.div
      key={event.id}
      className="group absolute top-1/2 -translate-y-1/2"
      style={{ left: `${leftPx}px` }}
      initial={{ opacity: 0, x: 24, scale: 0.6 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      title={tooltip}
    >
      <div className="relative flex flex-col items-center">
        {/* h-4 w-4(16px)の見た目は維持しつつ、before疑似要素で当たり判定のみ44px相当に拡張する
            (16px + 14px*2 = 44px)。レイアウトには寄与しないabsolute配置なので周囲のマーカー間隔は変わらない */}
        <span
          className={`relative flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold leading-none text-slate-950 before:absolute before:-inset-[14px] before:content-[''] ${style.dotClass} ${style.glowClass}`}
        >
          {style.icon}
        </span>
        <div
          className={`pointer-events-none absolute bottom-6 hidden whitespace-nowrap rounded-md border border-slate-700 bg-slate-900/95 px-2 py-1 text-[10px] shadow-lg group-hover:block ${style.textClass}`}
        >
          <span className="font-semibold">{style.label}</span>
          <span className="ml-1 text-slate-400">{formatClockTime(event.timestamp)}</span>
          <div className="mt-0.5 max-w-[180px] truncate text-slate-200">{event.label}</div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Timeline() {
  const timeline = useSimulationStore((state) => state.timeline);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const positions = useMemo(() => buildMarkerPositions(timeline), [timeline]);

  const trackWidth = useMemo(() => {
    if (positions.length === 0) return MIN_TRACK_WIDTH;
    const last = positions[positions.length - 1];
    return Math.max(MIN_TRACK_WIDTH, last.leftPx + TRACK_PADDING * 2);
  }, [positions]);

  useEffect(() => {
    if (timeline.length !== prevCountRef.current && scrollRef.current) {
      const el = scrollRef.current;
      el.scrollLeft = el.scrollWidth;
    }
    prevCountRef.current = timeline.length;
  }, [timeline.length]);

  return (
    <div className="flex h-full w-full flex-col rounded-lg border border-slate-800 bg-slate-900/60">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-800 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-sky-400 shadow-glow" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">タイムライン</h2>
        </div>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
          {timeline.length}
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-hidden px-2 py-2">
        {timeline.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-slate-500">
            <span className="text-xs">まだイベントはありません</span>
            <span className="text-[10px] text-slate-600">シミュレーションを開始すると表示されます</span>
          </div>
        ) : (
          <div className="relative h-full" style={{ width: `${trackWidth}px` }}>
            <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-800/60" />
            <AnimatePresence initial={false}>
              {positions.map((position) => (
                <TimelineMarker key={position.event.id} position={position} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
