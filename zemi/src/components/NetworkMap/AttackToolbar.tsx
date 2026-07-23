import { useState } from 'react';
import type { AttackType, NetworkNode, SshAuthMethod } from '../../types';
import { triggerAttack } from '../../engine/simulationEngine';
import { ATTACK_LABELS, ATTACK_TOOLS } from './constants';

interface AttackToolbarProps {
  nodes: NetworkNode[];
}

const ATTACK_TYPES: AttackType[] = ['ping', 'port_scan', 'ssh_bruteforce', 'sql_injection', 'ddos', 'ransomware'];

/** 攻撃種別ごとにふさわしいターゲットの type を優先順で指定する */
const TARGET_TYPE_PRIORITY: Record<AttackType, NetworkNode['type'][]> = {
  ping: ['router', 'server', 'host'],
  port_scan: ['router', 'server', 'firewall'],
  ssh_bruteforce: ['host', 'server'],
  sql_injection: ['server', 'router'],
  ddos: ['firewall', 'router'],
  ransomware: ['host', 'server'],
};

function findSource(nodes: NetworkNode[]): NetworkNode | undefined {
  return nodes.find((n) => n.type === 'attacker');
}

function findTarget(nodes: NetworkNode[], type: AttackType): NetworkNode | undefined {
  for (const t of TARGET_TYPE_PRIORITY[type]) {
    const found = nodes.find((n) => n.type === t);
    if (found) return found;
  }
  return nodes[0];
}

/**
 * 攻撃トリガーUI。半透明ツールバーで6種の攻撃ボタンを表示する。
 * クリックで triggerAttack(type, sourceId, targetId) を呼ぶ。
 */
export default function AttackToolbar({ nodes }: AttackToolbarProps) {
  const [sshAuthMethod, setSshAuthMethod] = useState<SshAuthMethod>('password');

  const handleClick = (type: AttackType) => {
    const source = findSource(nodes);
    const target = findTarget(nodes, type);
    if (!source || !target) return;
    if (type === 'ssh_bruteforce') {
      triggerAttack(type, source.id, target.id, sshAuthMethod);
    } else {
      triggerAttack(type, source.id, target.id);
    }
  };

  return (
    <div className="absolute bottom-4 left-4 z-10 flex flex-wrap gap-2 rounded-lg bg-slate-900/60 p-2 backdrop-blur-sm border border-slate-700/50">
      <div className="flex w-full flex-wrap items-center gap-2 pb-1">
        <span className="text-xs font-medium text-slate-400">SSH認証:</span>
        <button
          type="button"
          onClick={() => setSshAuthMethod('password')}
          className={`rounded-full border px-2.5 py-1 text-xs font-medium transition active:scale-95 ${
            sshAuthMethod === 'password'
              ? 'border-red-400/60 bg-red-500/20 text-red-200'
              : 'border-slate-600/60 bg-slate-800/70 text-slate-300 hover:border-slate-500/60'
          }`}
        >
          パスワード認証
        </button>
        <button
          type="button"
          onClick={() => setSshAuthMethod('publickey')}
          className={`rounded-full border px-2.5 py-1 text-xs font-medium transition active:scale-95 ${
            sshAuthMethod === 'publickey'
              ? 'border-red-400/60 bg-red-500/20 text-red-200'
              : 'border-slate-600/60 bg-slate-800/70 text-slate-300 hover:border-slate-500/60'
          }`}
        >
          公開鍵認証
        </button>
      </div>
      {ATTACK_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => handleClick(type)}
          title={`実在ツール: ${ATTACK_TOOLS[type]}`}
          className="rounded-md border border-slate-600/60 bg-slate-800/70 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-red-400/60 hover:bg-red-500/20 hover:text-red-200 active:scale-95"
        >
          {ATTACK_LABELS[type]}
        </button>
      ))}
    </div>
  );
}
