import { motion } from 'framer-motion';
import type { NetworkNode } from '../../types';
import { NODE_COLORS, NODE_RADIUS, INFECTED_COLOR, NODE_DESCRIPTIONS } from './constants';

interface NodeViewProps {
  node: NetworkNode;
  x: number;
  y: number;
  /** port_scan などで現在ターゲットになっている場合、走査線/枠を一瞬光らせる */
  isScanTarget?: boolean;
  /** 狭い画面向けにノード半径・ラベルを縮小するスケール(既定1=デスクトップと同じ)。computeVisualScaleの戻り値を想定 */
  scale?: number;
}

/**
 * 単一ノードの描画(SVG)。
 * - type ごとの色分け
 * - 常時「鼓動」するアニメーション
 * - infected の場合は赤い波紋・オーラ・ジッターを重ねる
 * - firewall の場合は六角シールドを常時表示
 */
export default function NodeView({ node, x, y, isScanTarget, scale = 1 }: NodeViewProps) {
  const baseColor = NODE_COLORS[node.type];
  const radius = NODE_RADIUS[node.type] * scale;
  const fontSize = 11 * scale;
  const isFirewall = node.type === 'firewall';

  return (
    <g transform={`translate(${x}, ${y})`} style={{ cursor: 'help' }}>
      {/* ホバーツールチップ(SVGネイティブ、初見者向けに機器の役割を説明) */}
      <title>{`${NODE_DESCRIPTIONS[node.type].label}: ${NODE_DESCRIPTIONS[node.type].description}`}</title>

      {/* 感染オーラ(発光半径を広げたグロー) */}
      {node.infected && (
        <motion.circle
          r={radius * 2.2}
          fill={INFECTED_COLOR}
          opacity={0.18}
          animate={{ opacity: [0.12, 0.3, 0.12] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* 感染リング(波紋)を複数・タイムラグでループ */}
      {node.infected &&
        [0, 0.6, 1.2].map((delay, i) => (
          <motion.circle
            key={`ripple-${i}`}
            r={radius}
            fill="none"
            stroke={INFECTED_COLOR}
            strokeWidth={2}
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: [1, 2.6], opacity: [0.7, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, delay, ease: 'easeOut' }}
          />
        ))}

      {/* port_scan ターゲット強調: 黄色い走査枠が一瞬光る */}
      {isScanTarget && (
        <motion.rect
          x={-radius - 8}
          y={-radius - 8}
          width={(radius + 8) * 2}
          height={(radius + 8) * 2}
          fill="none"
          stroke="#facc15"
          strokeWidth={2}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Firewall シールド(六角形オーバーレイ、常時薄く発光) */}
      {isFirewall && (
        <motion.polygon
          points={hexagonPoints(radius + 10)}
          fill="rgba(34,211,238,0.08)"
          stroke="#22d3ee"
          strokeWidth={1.5}
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* 本体: 常に鼓動するアニメーション */}
      <motion.circle
        r={radius}
        fill={node.infected ? INFECTED_COLOR : baseColor}
        stroke={node.infected ? '#fecaca' : 'rgba(255,255,255,0.5)'}
        strokeWidth={1.5}
        style={{ filter: `drop-shadow(0 0 6px ${node.infected ? INFECTED_COLOR : baseColor})` }}
        animate={{
          scale: [1, 1.06, 1],
          // 感染時は軽いジッター(ノイズ表現)を追加
          x: node.infected ? [0, 0.6, -0.6, 0] : 0,
          y: node.infected ? [0, -0.5, 0.5, 0] : 0,
        }}
        transition={{
          duration: node.infected ? 0.9 : 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* ヘルスが低いときの暗いオーバーレイ(簡易) */}
      {node.health < 50 && (
        <circle r={radius} fill="black" opacity={(50 - node.health) / 120} pointerEvents="none" />
      )}

      {/* ラベル */}
      <text
        x={0}
        y={radius + 16}
        textAnchor="middle"
        fontSize={fontSize}
        fill="#cbd5e1"
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {node.label}
      </text>
    </g>
  );
}

function hexagonPoints(r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    pts.push(`${(r * Math.cos(angle)).toFixed(2)},${(r * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(' ');
}
