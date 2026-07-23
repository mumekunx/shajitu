import type { AttackType, LogLevel, TrafficType } from '../../types';

export interface LevelStyle {
  borderClass: string;
  bgClass: string;
  dotClass: string;
  textClass: string;
}

const LEVEL_STYLES: Record<LogLevel, LevelStyle> = {
  info: {
    borderClass: 'border-blue-500/60',
    bgClass: 'bg-slate-800/40',
    dotClass: 'bg-blue-400',
    textClass: 'text-slate-300',
  },
  warning: {
    borderClass: 'border-amber-500/70',
    bgClass: 'bg-amber-500/10',
    dotClass: 'bg-amber-400',
    textClass: 'text-amber-200',
  },
  critical: {
    borderClass: 'border-red-500/80',
    bgClass: 'bg-red-500/10',
    dotClass: 'bg-red-500',
    textClass: 'text-red-200',
  },
  success: {
    borderClass: 'border-emerald-500/70',
    bgClass: 'bg-emerald-500/10',
    dotClass: 'bg-emerald-400',
    textClass: 'text-emerald-200',
  },
  trivia: {
    borderClass: 'border-indigo-500/40',
    bgClass: 'bg-indigo-500/10',
    dotClass: 'bg-indigo-400',
    textClass: 'text-indigo-300',
  },
};

export function getLevelStyle(level: LogLevel): LevelStyle {
  return LEVEL_STYLES[level] ?? LEVEL_STYLES.info;
}

const TRAFFIC_TYPES: TrafficType[] = ['normal', 'attack', 'dns', 'http', 'ssh'];
const ATTACK_TYPES: AttackType[] = ['ping', 'port_scan', 'ssh_bruteforce', 'sql_injection', 'ddos', 'ransomware'];

const TRAFFIC_BADGE: Record<TrafficType, string> = {
  normal: 'bg-traffic-normal/20 text-traffic-normal',
  attack: 'bg-traffic-attack/20 text-traffic-attack',
  dns: 'bg-traffic-dns/20 text-traffic-dns',
  http: 'bg-traffic-http/20 text-traffic-http',
  ssh: 'bg-traffic-ssh/20 text-traffic-ssh',
};

const ATTACK_BADGE: Record<AttackType, string> = {
  ping: 'bg-orange-500/20 text-orange-300',
  port_scan: 'bg-orange-500/20 text-orange-300',
  ssh_bruteforce: 'bg-rose-600/20 text-rose-300',
  sql_injection: 'bg-rose-600/20 text-rose-300',
  ddos: 'bg-red-600/25 text-red-300',
  ransomware: 'bg-fuchsia-600/25 text-fuchsia-300',
};

const SYSTEM_BADGE = 'bg-slate-700/50 text-slate-300';

export type LogEntryType = TrafficType | AttackType | 'system';

export function getTypeBadgeStyle(type: LogEntryType): string {
  if ((TRAFFIC_TYPES as string[]).includes(type)) {
    return TRAFFIC_BADGE[type as TrafficType];
  }
  if ((ATTACK_TYPES as string[]).includes(type)) {
    return ATTACK_BADGE[type as AttackType];
  }
  return SYSTEM_BADGE;
}

export function formatTypeLabel(type: LogEntryType): string {
  if (type === 'system') return 'SYSTEM';
  return type.toUpperCase();
}
