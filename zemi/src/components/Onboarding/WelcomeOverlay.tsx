import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NODE_COLORS, NODE_DESCRIPTIONS } from '../NetworkMap/constants';
import type { NodeType } from '../../types';

/** 「登場する機器」節での表示順(通信の流れが分かる順) */
const NODE_TYPE_ORDER: NodeType[] = ['attacker', 'internet', 'router', 'firewall', 'dns', 'server', 'host'];

interface WelcomeOverlayProps {
  open: boolean;
  onClose: () => void;
}

/**
 * 起動時に表示するウェルカム＆操作ガイドのモーダルオーバーレイ本体。
 * 初見者向けに「これは何か/画面の見方/やってみよう/注記」を説明する。
 * store/型/エンジンには一切依存しない、純粋なUIコンポーネント。
 * open state は AppLayout 側で保持し、起動ボタン(WelcomeOverlayLauncher)とこのモーダル本体の
 * 両方に渡す(controlled化)。サイドバーと構造的に重ならない位置に起動ボタンを置くための分離。
 */
export default function WelcomeOverlay({ open, onClose }: WelcomeOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="welcome-overlay-title"
              className="max-h-[85vh] w-[90vw] max-w-2xl overflow-y-auto rounded-2xl border border-slate-700/60 bg-slate-900/90 p-6 shadow-2xl shadow-black/60 backdrop-blur-md md:p-8"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <h2
                  id="welcome-overlay-title"
                  className="text-lg font-bold text-red-400 md:text-xl"
                >
                  サイバー攻撃 可視化シミュレーター
                </h2>
                <button
                  type="button"
                  aria-label="閉じる"
                  onClick={onClose}
                  className="shrink-0 rounded-full border border-slate-700/60 bg-slate-800/60 px-2.5 py-1 text-sm text-slate-300 transition-colors hover:bg-slate-700/70 hover:text-white"
                >
                  ×
                </button>
              </div>

              <p className="mb-5 text-sm leading-relaxed text-slate-300">
                これはゲームではなく、ネットワーク上でサイバー攻撃がどう起きるかを
                <span className="text-cyan-400">「目で見て」</span>
                理解するための教育用シミュレーターです。
              </p>

              <h3 className="mb-2 text-sm font-semibold text-cyan-400">画面の見方</h3>
              <ul className="mb-5 space-y-1.5 text-sm leading-relaxed text-slate-300">
                <li>
                  <span className="text-slate-100">中央</span>: ネットワーク図。光る粒子が通信、赤い粒子が攻撃。ノードが赤く波打つと「感染」。
                </li>
                <li>
                  <span className="text-slate-100">左下</span>: 攻撃ツールバー。6種の攻撃を実行できます。ボタンにマウスを乗せると実在ツール名（Nmap/Hydra 等）が出ます。
                </li>
                <li>
                  <span className="text-slate-100">右</span>: イベントログ。攻撃の検知・結果と、終了時の「豆知識（現実との違い）」が出ます。
                </li>
                <li>
                  <span className="text-slate-100">下</span>: タイムライン。イベントを発生順に並べます。
                </li>
                <li>
                  <span className="text-slate-100">右下</span>: 統計パネル（CPU / Memory / Network / Attack Score）。
                </li>
              </ul>

              <h3 className="mb-2 text-sm font-semibold text-cyan-400">登場する機器</h3>
              <ul className="mb-5 space-y-1.5 text-sm leading-relaxed text-slate-300">
                {NODE_TYPE_ORDER.map((type) => (
                  <li key={type} className="flex items-start gap-2">
                    <span
                      className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: NODE_COLORS[type] }}
                    />
                    <span>
                      <span className="font-bold text-slate-200">{NODE_DESCRIPTIONS[type].label}</span>
                      <span className="ml-1.5 text-xs text-slate-400">{NODE_DESCRIPTIONS[type].description}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <h3 className="mb-2 text-sm font-semibold text-cyan-400">やってみよう</h3>
              <ol className="mb-5 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-slate-300">
                <li>まず「Ping」を押して、粒子が往復する様子を見てみましょう。</li>
                <li>
                  「SSH Brute Force」を実行。上の「SSH認証」を"公開鍵認証"に変えると、ほぼ成功しなくなります＝対策の効果を体験できます。
                </li>
                <li>「DDoS」を押すと、複数のボットから同時に攻撃が来る様子が見えます。</li>
                <li>各攻撃のあと、ログの「豆知識」で"現実ではどうか"を確認しましょう。</li>
              </ol>

              <p className="mb-6 text-xs leading-relaxed text-slate-400">
                ※ 攻撃の成功確率や所要時間は理解しやすさを優先して調整した値で、実際のセキュリティ統計ではありません。
              </p>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-red-500/80 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-900/30 transition-colors hover:bg-red-500 md:w-auto"
              >
                始める
              </button>
            </motion.div>
          </motion.div>
        )}
    </AnimatePresence>
  );
}

/**
 * WelcomeOverlay 起動用の「?」ボタン。
 * モーダル本体とは別コンポーネントとして切り出し、AppLayout のマップ領域ラッパ内(サイドバーとは
 * 構造的に重ならないスコープ)に配置する。モーダル本体は引き続き AppLayout ルート直下の
 * fixed inset-0 z-50 のまま(こちらの isolate スコープに入れると z-index が閉じ込められ壊れるため)。
 */
export function WelcomeOverlayLauncher({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      aria-label="操作ガイドを表示"
      title="操作ガイドを表示"
      onClick={onOpen}
      className="absolute right-4 top-4 z-40 flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/60 bg-slate-900/70 text-sm font-semibold text-slate-300 shadow-lg shadow-black/40 backdrop-blur-md transition-colors hover:bg-slate-800/80 hover:text-cyan-400"
    >
      ?
    </button>
  );
}
