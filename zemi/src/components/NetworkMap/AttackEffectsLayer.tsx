import { AnimatePresence, motion } from 'framer-motion';
import type { AttackState, NetworkNode } from '../../types';
import { ATTACK_COLORS } from './constants';
import type { NodePosition } from './useNetworkLayout';

interface AttackEffectsLayerProps {
  attacks: AttackState[];
  nodes: NetworkNode[];
  positions: Record<string, NodePosition>;
}

/**
 * activeAttacks をループし、攻撃種別ごとに演出を分岐する SVG オーバーレイ。
 * - ping: source-target 間に薄い青白の単発リング
 * - port_scan: NodeView 側の走査枠で表現するため、ここでは何もしない
 *   (NetworkMap が isScanTarget を NodeView に渡す)
 * - ssh_bruteforce: target直近のリンク付近に緑の高密度パルス
 * - sql_injection: target に赤紫の注入風シンボルを一瞬表示
 * - ddos: target 背後に強い赤グロー
 * - ransomware: NodeView 側の感染ビジュアル(波紋)で表現するため、ここでは赤フラッシュのみ追加
 * - blocked: true の場合、target/source に近い firewall ノード位置で衝突エフェクト・火花・衝撃波
 */
export default function AttackEffectsLayer({ attacks, nodes, positions }: AttackEffectsLayerProps) {
  const firewallNode = nodes.find((n) => n.type === 'firewall');
  const firewallPos = firewallNode ? positions[firewallNode.id] : undefined;

  return (
    <g>
      <AnimatePresence>
        {attacks.map((attack) => {
          const sourcePos = positions[attack.sourceId];
          const targetPos = positions[attack.targetId];
          if (!sourcePos || !targetPos) return null;
          const color = ATTACK_COLORS[attack.type];

          return (
            <g key={attack.id}>
              {attack.type === 'ping' && (
                <motion.circle
                  cx={targetPos.x}
                  cy={targetPos.y}
                  r={10}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  initial={{ scale: 0.3, opacity: 0.9 }}
                  animate={{ scale: 3, opacity: 0 }}
                  transition={{ duration: 1 }}
                />
              )}

              {attack.type === 'ssh_bruteforce' && (
                <motion.line
                  x1={sourcePos.x}
                  y1={sourcePos.y}
                  x2={targetPos.x}
                  y2={targetPos.y}
                  stroke={color}
                  strokeWidth={3}
                  initial={{ opacity: 0.2 }}
                  animate={{ opacity: [0.2, 0.9, 0.2] }}
                  transition={{ duration: 0.4, repeat: Infinity }}
                />
              )}

              {attack.type === 'sql_injection' && (
                <motion.g
                  initial={{ opacity: 0, y: targetPos.y - 10 }}
                  animate={{ opacity: [0, 1, 0], y: targetPos.y - 30 }}
                  transition={{ duration: 1.2 }}
                >
                  <text
                    x={targetPos.x}
                    y={targetPos.y - 26}
                    textAnchor="middle"
                    fontSize={11}
                    fontFamily="monospace"
                    fill={color}
                  >
                    {"' OR 1=1;--"}
                  </text>
                  <circle cx={targetPos.x} cy={targetPos.y} r={26} fill={color} opacity={0.15} />
                </motion.g>
              )}

              {attack.type === 'ddos' && (
                <motion.circle
                  cx={targetPos.x}
                  cy={targetPos.y}
                  r={40}
                  fill={color}
                  initial={{ opacity: 0.05 }}
                  animate={{ opacity: [0.05, 0.22, 0.05] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                />
              )}

              {attack.type === 'ransomware' && (
                <motion.circle
                  cx={targetPos.x}
                  cy={targetPos.y}
                  r={18}
                  fill={color}
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: [0.3, 0.05, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}

              {/* 遮断エフェクト: blocked === true のとき firewall ノード位置に表示 */}
              {attack.blocked && firewallPos && (
                <BlockEffect key={`${attack.id}-block`} x={firewallPos.x} y={firewallPos.y} />
              )}
            </g>
          );
        })}
      </AnimatePresence>
    </g>
  );
}

function BlockEffect({ x, y }: { x: number; y: number }) {
  const sparkAngles = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <motion.g
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 衝撃波リング */}
      <motion.circle
        cx={x}
        cy={y}
        r={10}
        fill="none"
        stroke="#ef4444"
        strokeWidth={3}
        initial={{ scale: 0.5, opacity: 1 }}
        animate={{ scale: 3.5, opacity: 0 }}
        transition={{ duration: 0.5 }}
      />
      {/* 火花(小さな線が複数方向に飛ぶ) */}
      {sparkAngles.map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const dx = Math.cos(rad);
        const dy = Math.sin(rad);
        return (
          <motion.line
            key={angle}
            x1={x}
            y1={y}
            x2={x}
            y2={y}
            stroke="#fde047"
            strokeWidth={2}
            initial={{ x2: x, y2: y, opacity: 1 }}
            animate={{ x2: x + dx * 26, y2: y + dy * 26, opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        );
      })}
    </motion.g>
  );
}
