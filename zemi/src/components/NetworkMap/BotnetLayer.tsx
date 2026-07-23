import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AttackState } from '../../types';
import { ATTACK_COLORS, NODE_COLORS } from './constants';
import type { NodePosition } from './useNetworkLayout';

interface BotnetLayerProps {
  /** ddos タイプのみに絞り込んだ AttackState 配列(NetworkMap 側でフィルタ済み) */
  attacks: AttackState[];
  positions: Record<string, NodePosition>;
  width: number;
  height: number;
}

const BOT_COLOR = NODE_COLORS.attacker;
const STREAM_COLOR = ATTACK_COLORS.ddos;

/** 文字列から決定的な32bit整数ハッシュを作る(djb2 系の簡易実装) */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

interface BotSpec {
  id: string;
  angle: number; // radian
  radius: number; // 攻撃者ノードからのオフセット距離(px)
  botRadius: number; // 描画半径
  delay: number; // アニメーション開始遅延(秒)
  duration: number; // ストリーム粒子の1周期(秒)
}

/** attackId を種に、決定的な2〜4体のボット配置を1回だけ算出する */
function buildBots(attackId: string): BotSpec[] {
  const seed = hashString(attackId);
  const count = 2 + (seed % 3); // 2..4
  const bots: BotSpec[] = [];
  for (let i = 0; i < count; i++) {
    const h = hashString(`${attackId}:${i}`);
    const angle = ((h % 360) / 360) * Math.PI * 2;
    const radius = 60 + (Math.floor(h / 360) % 51); // 60..110px
    const botRadius = 6 + (h % 4); // 6..9
    const delay = ((h % 100) / 100) * 0.6; // 0..0.6s
    const duration = 0.8 + (Math.floor(h / 100) % 60) / 100; // 0.8..1.39s
    bots.push({ id: `${attackId}-bot-${i}`, angle, radius, botRadius, delay, duration });
  }
  return bots;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/**
 * DDoS 攻撃が進行中の間だけ、攻撃者ノード周辺に一時的なボットノードと
 * 各ボット→標的への攻撃ストリーム(流れる粒子)を重畳描画するオーバーレイ。
 * store/topology/useNetworkLayout には一切触れない、純粋な描画専用レイヤ。
 * attacks が空になれば(= ddos が removeAttack で消えれば) AnimatePresence の
 * exit アニメーションとともに自動的に消える。
 */
export default function BotnetLayer({ attacks, positions, width, height }: BotnetLayerProps) {
  return (
    <g>
      <AnimatePresence>
        {attacks.map((attack) => (
          <BotnetGroup key={attack.id} attack={attack} positions={positions} width={width} height={height} />
        ))}
      </AnimatePresence>
    </g>
  );
}

interface BotnetGroupProps {
  attack: AttackState;
  positions: Record<string, NodePosition>;
  width: number;
  height: number;
}

function BotnetGroup({ attack, positions, width, height }: BotnetGroupProps) {
  // フックはアーリーリターンより前で無条件に呼ぶ(bots の算出は attack.id が変わらない限り再計算しない)
  const bots = useMemo(() => buildBots(attack.id), [attack.id]);

  const sourcePos = positions[attack.sourceId];
  const targetPos = positions[attack.targetId];
  if (!sourcePos || !targetPos || width <= 0 || height <= 0) return null;

  return (
    <g>
      {bots.map((bot) => {
        const bx = clamp(sourcePos.x + Math.cos(bot.angle) * bot.radius, 8, width - 8);
        const by = clamp(sourcePos.y + Math.sin(bot.angle) * bot.radius, 8, height - 8);

        return (
          <motion.g
            key={bot.id}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.3 }}
          >
            {/* ボット→標的への薄いライン(常設・低opacity) */}
            <line x1={bx} y1={by} x2={targetPos.x} y2={targetPos.y} stroke={STREAM_COLOR} strokeWidth={1} strokeOpacity={0.15} />

            {/* ボットノード本体: 常時ゆるいパルス */}
            <motion.circle
              cx={bx}
              cy={by}
              r={bot.botRadius}
              fill={BOT_COLOR}
              animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.15, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: bot.delay }}
            />

            {/* 攻撃ストリーム粒子: ボット→標的へ繰り返し流れる */}
            <motion.circle
              r={3}
              fill={STREAM_COLOR}
              initial={{ cx: bx, cy: by, opacity: 0 }}
              animate={{
                cx: [bx, targetPos.x],
                cy: [by, targetPos.y],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: bot.duration,
                repeat: Infinity,
                ease: 'linear',
                delay: bot.delay,
              }}
            />
          </motion.g>
        );
      })}
    </g>
  );
}
