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
 * 攻撃トリガーUI。
 * クリックで triggerAttack(type, sourceId, targetId) を呼ぶ。
 * lg以上: 従来どおり半透明ツールバーに折り返し表示(変更なし)。
 * lg未満(モバイルタブ切替UI): マップの高さを圧迫しないよう、SSH認証切替行・攻撃ボタン行を
 * それぞれ横スクロール1行に圧縮する。同一コンポーネントインスタンス内に両方のマークアップを持ち、
 * `sshAuthMethod`のstateと`handleClick`を共有する(表示だけTailwindの`lg:`で切り替える)。
 * どちらの表示でもボタンは`min-h-11`(lg未満のみ)でタップ領域44pxを確保する。
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
    <>
      {/* lg未満: SSH認証行(横スクロール) + 攻撃ボタン行(横スクロール)。マップを覆わない実フロー配置の
          コントロール領域に置かれる前提で、高さを最小限(目安: 合計100px前後)に抑える */}
      <div className="w-full rounded-lg border border-slate-700/50 bg-slate-900/60 p-2 backdrop-blur-sm lg:hidden">
        <div className="mb-1.5 flex items-center gap-2 overflow-x-auto">
          <span className="shrink-0 text-[10px] font-medium text-slate-400">SSH:</span>
          <button
            type="button"
            onClick={() => setSshAuthMethod('password')}
            className={`flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full border px-2.5 text-[11px] font-medium transition active:scale-95 ${
              sshAuthMethod === 'password'
                ? 'border-red-400/60 bg-red-500/20 text-red-200'
                : 'border-slate-600/60 bg-slate-800/70 text-slate-300'
            }`}
          >
            パスワード認証
          </button>
          <button
            type="button"
            onClick={() => setSshAuthMethod('publickey')}
            className={`flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full border px-2.5 text-[11px] font-medium transition active:scale-95 ${
              sshAuthMethod === 'publickey'
                ? 'border-red-400/60 bg-red-500/20 text-red-200'
                : 'border-slate-600/60 bg-slate-800/70 text-slate-300'
            }`}
          >
            公開鍵認証
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {ATTACK_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleClick(type)}
              title={`実在ツール: ${ATTACK_TOOLS[type]}`}
              className="flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-slate-600/60 bg-slate-800/70 px-2.5 text-xs font-medium text-slate-200 transition active:scale-95"
            >
              {ATTACK_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* lg以上: 従来の折り返しレイアウト(変更なし) */}
      <div className="hidden max-w-full flex-wrap gap-2 rounded-lg border border-slate-700/50 bg-slate-900/60 p-2 backdrop-blur-sm lg:flex">
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
    </>
  );
}
