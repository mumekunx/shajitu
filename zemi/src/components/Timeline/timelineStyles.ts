import type { TimelineEventKind } from '../../types';

export interface TimelineKindStyle {
  /** マーカードットの背景色クラス */
  dotClass: string;
  /** マーカーのグロー(box-shadow任意値)クラス */
  glowClass: string;
  /** ラベルバッジの文字色クラス */
  textClass: string;
  /** 凡例・アイコン表示用の絵文字風記号 */
  icon: string;
  /** 日本語の種別ラベル */
  label: string;
}

const TIMELINE_KIND_STYLES: Record<TimelineEventKind, TimelineKindStyle> = {
  attack_start: {
    dotClass: 'bg-red-500',
    glowClass: 'shadow-[0_0_8px_2px_rgba(239,68,68,0.7)]',
    textClass: 'text-red-300',
    icon: '!',
    label: '攻撃開始',
  },
  attack_blocked: {
    dotClass: 'bg-amber-400',
    glowClass: 'shadow-[0_0_8px_2px_rgba(251,191,36,0.6)]',
    textClass: 'text-amber-300',
    icon: '#',
    label: 'ブロック',
  },
  attack_success: {
    dotClass: 'bg-red-700',
    glowClass: 'shadow-[0_0_12px_4px_rgba(185,28,28,0.9)]',
    textClass: 'text-red-400',
    icon: '*',
    label: '侵害成功',
  },
  infection: {
    dotClass: 'bg-fuchsia-600',
    glowClass: 'shadow-[0_0_10px_3px_rgba(192,38,211,0.8)]',
    textClass: 'text-fuchsia-300',
    icon: '@',
    label: '感染',
  },
  system: {
    dotClass: 'bg-slate-400',
    glowClass: 'shadow-[0_0_6px_2px_rgba(148,163,184,0.5)]',
    textClass: 'text-slate-300',
    icon: 'i',
    label: 'システム',
  },
};

/**
 * TimelineEventKind に応じたマーカースタイルを返す。
 * 全種別を switch で網羅し、未知の kind が来た場合はコンパイル時に検出する。
 */
export function getKindStyle(kind: TimelineEventKind): TimelineKindStyle {
  switch (kind) {
    case 'attack_start':
      return TIMELINE_KIND_STYLES.attack_start;
    case 'attack_blocked':
      return TIMELINE_KIND_STYLES.attack_blocked;
    case 'attack_success':
      return TIMELINE_KIND_STYLES.attack_success;
    case 'infection':
      return TIMELINE_KIND_STYLES.infection;
    case 'system':
      return TIMELINE_KIND_STYLES.system;
    default: {
      // exhaustive check: 新しい TimelineEventKind が追加されたらここで型エラーになる
      const _exhaustive: never = kind;
      throw new Error(`Unhandled TimelineEventKind: ${_exhaustive}`);
    }
  }
}

export function formatClockTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
