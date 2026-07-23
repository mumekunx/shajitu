import type { NodeType, TrafficType, AttackType } from '../../types';

/** tailwind.config.js の `traffic` カラーと一致させる */
export const TRAFFIC_COLORS: Record<TrafficType, string> = {
  normal: '#3b82f6',
  attack: '#ef4444',
  dns: '#a855f7',
  http: '#22d3ee',
  ssh: '#22c55e',
};

export const INFECTED_COLOR = '#ef4444';

/** ノードタイプごとの基調色 */
export const NODE_COLORS: Record<NodeType, string> = {
  internet: '#94a3b8', // slate
  router: '#3b82f6', // blue
  firewall: '#22d3ee', // cyan
  dns: '#a855f7', // purple
  server: '#3b82f6', // blue系
  host: '#cbd5e1', // neutral
  attacker: '#ef4444', // red
};

/** ノードの描画半径 */
export const NODE_RADIUS: Record<NodeType, number> = {
  internet: 22,
  router: 18,
  firewall: 20,
  dns: 16,
  server: 17,
  host: 14,
  attacker: 16,
};

/** ノードtypeごとの説明(初見者向け。ホバーツールチップとウェルカム画面の機器一覧で使用) */
export const NODE_DESCRIPTIONS: Record<NodeType, { label: string; description: string }> = {
  attacker: {
    label: '攻撃者',
    description: '攻撃を仕掛ける外部の端末。ここから攻撃が始まります。',
  },
  internet: {
    label: 'インターネット',
    description: '外部の世界。正常な通信も攻撃もここを経由します。',
  },
  router: {
    label: 'ルーター',
    description: 'ネットワーク間で通信を中継・振り分ける機器です。',
  },
  firewall: {
    label: 'ファイアウォール',
    description: '不正な通信を検査して遮断する「防火壁」。多くの攻撃をここで止めます。',
  },
  dns: {
    label: 'DNSサーバー',
    description: 'ドメイン名(例: example.com)をIPアドレスに変換する「電話帳」の役割です。',
  },
  server: {
    label: 'サーバー',
    description: 'Webサイトやアプリを提供するコンピュータ。攻撃の主な標的になります。',
  },
  host: {
    label: 'ホスト(PC)',
    description: '社員のPCなど末端の端末。感染の起点になりやすい存在です。',
  },
};

export const ATTACK_LABELS: Record<AttackType, string> = {
  ping: 'Ping',
  port_scan: 'Port Scan',
  ssh_bruteforce: 'SSH Brute Force',
  sql_injection: 'SQL Injection',
  ddos: 'DDoS',
  ransomware: 'Ransomware',
};

/** 攻撃種別ごとに現実で使われる代表的なツール/技術用語(教育目的の補足表示) */
export const ATTACK_TOOLS: Record<AttackType, string> = {
  ping: 'hping3 / ICMP Echo',
  port_scan: 'Nmap / Masscan',
  ssh_bruteforce: 'Hydra / Medusa',
  sql_injection: 'sqlmap',
  ddos: 'Mirai(ボットネット) / LOIC',
  ransomware: 'WannaCry / LockBit',
};

/** 攻撃種別ごとの「何をする攻撃か/画面で見えるもの」(実行中のリアルタイム解説パネル用) */
export const ATTACK_DESCRIPTIONS: Record<AttackType, { summary: string; whatYouSee: string }> = {
  ping: {
    summary: '対象が生きているか(応答するか)を確認する最も基本的な通信。攻撃前の下調べに使われます。',
    whatYouSee: '攻撃者と対象の間を粒子が往復します。',
  },
  port_scan: {
    summary: 'どのポート(サービスの入口)が開いているかを1つずつ調べ、侵入口を探す偵察です。',
    whatYouSee: '対象ノードを走査枠が順に移動しながら、低強度の粒子が流れます。',
  },
  ssh_bruteforce: {
    summary: 'SSHログインのパスワードを何度も試して突破を狙う総当たり攻撃です。',
    whatYouSee: '緑のSSH経路に粒子が集中。多くはファイアウォールに遮断され火花が散ります。',
  },
  sql_injection: {
    summary: '入力欄に不正なSQL文を混ぜて、データベースを不正に操作しようとする攻撃です。',
    whatYouSee: "対象に ' OR 1=1;-- の注入テキストが現れ、赤紫の粒子が流れます。",
  },
  ddos: {
    summary: '大量の通信を一斉に送りつけ、サービスを麻痺させる攻撃です。',
    whatYouSee: '複数のボットから同時に赤い粒子が殺到し、統計のNetwork/CPUが跳ね上がります。',
  },
  ransomware: {
    summary: '侵入後にファイルを暗号化し、隣接するノードへ感染を広げるマルウェアです。',
    whatYouSee: '感染ノードが赤く波打ち、隣のノードへ次々と感染が拡大します。',
  },
};

/** 攻撃種別ごとの代表色(演出の差別化に使う) */
export const ATTACK_COLORS: Record<AttackType, string> = {
  ping: '#bfdbfe', // 薄い青白
  port_scan: '#facc15', // 黄色
  ssh_bruteforce: '#22c55e', // 緑(ssh)
  sql_injection: '#c026d3', // 赤紫
  ddos: '#ef4444', // 赤
  ransomware: '#ef4444', // 赤
};
