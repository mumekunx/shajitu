export type NodeType = 'internet' | 'router' | 'firewall' | 'server' | 'dns' | 'host' | 'attacker';

export interface NetworkNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
  infected: boolean;
  health: number; // 0-100
}

export type TrafficType = 'normal' | 'attack' | 'dns' | 'http' | 'ssh';

export interface NetworkLink {
  id: string;
  source: string; // NetworkNode.id
  target: string; // NetworkNode.id
  trafficType: TrafficType;
  intensity: number; // 0-1, 通信量。粒子数・速度に反映
  blocked: boolean; // このtickでFirewallに遮断されたか
}

export type AttackType = 'ping' | 'port_scan' | 'ssh_bruteforce' | 'sql_injection' | 'ddos' | 'ransomware';

export type SshAuthMethod = 'password' | 'publickey';

export interface AttackState {
  id: string;
  type: AttackType;
  sourceId: string;
  targetId: string;
  startedAt: number;
  progress: number; // 0-1
  blocked: boolean;
}

export type LogLevel = 'info' | 'warning' | 'critical' | 'success' | 'trivia';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  type: TrafficType | AttackType | 'system';
  message: string;
}

export type TimelineEventKind = 'attack_start' | 'attack_blocked' | 'attack_success' | 'infection' | 'system';

export interface TimelineEvent {
  id: string;
  timestamp: number;
  label: string;
  kind: TimelineEventKind;
}

export interface SimStats {
  cpu: number; // 0-100
  memory: number; // 0-100
  network: number; // 0-100
  attackScore: number; // 0以上、累積
}

export interface Particle {
  id: string;
  linkId: string;
  t: number; // 0-1, リンク上の進行度
  speed: number; // tあたりの増分/フレーム
  trafficType: TrafficType;
  size: number;
}
