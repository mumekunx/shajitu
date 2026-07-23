import { useEffect, useRef, useState } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { useNetworkLayout } from './useNetworkLayout';
import ParticleCanvas from './ParticleCanvas';
import NodeView from './NodeView';
import AttackEffectsLayer from './AttackEffectsLayer';
import BotnetLayer from './BotnetLayer';
import AttackToolbar from './AttackToolbar';
import AttackExplanation from './AttackExplanation';
import { TRAFFIC_COLORS } from './constants';
import './networkMap.css';

/**
 * NetworkMap: メインビジュアル。
 * - ノード/リンクは SVG + Framer Motion(d3-force でローカルにレイアウト計算)
 * - 粒子(数百個規模)は Canvas 2D(ParticleCanvas)で独立に描画
 * - 攻撃トリガーUIと攻撃別エフェクトのオーバーレイを重畳する
 */
export default function NetworkMap() {
  const nodes = useSimulationStore((state) => state.nodes);
  const links = useSimulationStore((state) => state.links);
  const activeAttacks = useSimulationStore((state) => state.activeAttacks);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const positions = useNetworkLayout(nodes, links, size.width, size.height);

  // port_scan の現在のターゲットノードIDを集める(走査線エフェクト用)
  const scanTargetIds = new Set(
    activeAttacks.filter((a) => a.type === 'port_scan').map((a) => a.targetId)
  );

  // ddos が進行中かどうか(背景に強い赤グローを追加する)
  const hasDdos = activeAttacks.some((a) => a.type === 'ddos');

  // ddos の AttackState のみ抽出(BotnetLayer 用。ボットノードは store/topology に追加しない純粋な描画オーバーレイ)
  const ddosAttacks = activeAttacks.filter((a) => a.type === 'ddos');

  return (
    <div ref={containerRef} className="network-grid-bg relative h-full w-full overflow-hidden">
      {/* ddos 進行中は背景全体に薄い赤グローを重ねる */}
      {hasDdos && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(circle at 50% 50%, rgba(239,68,68,0.18), transparent 70%)' }}
        />
      )}

      {size.width > 0 && size.height > 0 && (
        <>
          {/* リンク + ノード + 攻撃エフェクト(SVG) */}
          <svg className="absolute left-0 top-0" width={size.width} height={size.height}>
            <g>
              {links.map((link) => {
                const sourcePos = positions[link.source];
                const targetPos = positions[link.target];
                if (!sourcePos || !targetPos) return null;
                const color = TRAFFIC_COLORS[link.trafficType];
                return (
                  <line
                    key={link.id}
                    x1={sourcePos.x}
                    y1={sourcePos.y}
                    x2={targetPos.x}
                    y2={targetPos.y}
                    stroke={color}
                    strokeOpacity={0.35 + link.intensity * 0.3}
                    strokeWidth={1 + link.intensity * 1.5}
                  />
                );
              })}
            </g>

            <AttackEffectsLayer attacks={activeAttacks} nodes={nodes} positions={positions} />

            <BotnetLayer attacks={ddosAttacks} positions={positions} width={size.width} height={size.height} />

            <g>
              {nodes.map((node) => {
                const pos = positions[node.id];
                if (!pos) return null;
                return (
                  <NodeView
                    key={node.id}
                    node={node}
                    x={pos.x}
                    y={pos.y}
                    isScanTarget={scanTargetIds.has(node.id)}
                  />
                );
              })}
            </g>
          </svg>

          {/* 粒子(Canvas 2D、SVGと完全に重畳配置) */}
          <ParticleCanvas width={size.width} height={size.height} links={links} positions={positions} />
        </>
      )}

      <AttackExplanation />

      <AttackToolbar nodes={nodes} />
    </div>
  );
}
