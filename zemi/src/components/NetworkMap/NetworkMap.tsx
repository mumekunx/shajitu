import { useEffect, useRef, useState } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { useNetworkLayout } from './useNetworkLayout';
import ParticleCanvas from './ParticleCanvas';
import NodeView from './NodeView';
import AttackEffectsLayer from './AttackEffectsLayer';
import BotnetLayer from './BotnetLayer';
import AttackToolbar from './AttackToolbar';
import AttackExplanation from './AttackExplanation';
import StatsPanel from '../StatsPanel/StatsPanel';
import { TRAFFIC_COLORS, computeVisualScale } from './constants';
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
  // Phase2: 狭い画面向けにノード半径・ラベルを縮小するスケール(lg以上=1024px幅以上では常に1)
  const nodeVisualScale = computeVisualScale(size.width, size.height);

  // port_scan の現在のターゲットノードIDを集める(走査線エフェクト用)
  const scanTargetIds = new Set(
    activeAttacks.filter((a) => a.type === 'port_scan').map((a) => a.targetId)
  );

  // ddos が進行中かどうか(背景に強い赤グローを追加する)
  const hasDdos = activeAttacks.some((a) => a.type === 'ddos');

  // ddos の AttackState のみ抽出(BotnetLayer 用。ボットノードは store/topology に追加しない純粋な描画オーバーレイ)
  const ddosAttacks = activeAttacks.filter((a) => a.type === 'ddos');

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* マップ本体エリア: ResizeObserverの測定対象。
          lg未満は下のコントロール領域が実フロー(shrink-0)で高さを取るため、このエリアは
          flex-1で残り全部を確保する(コントロールがマップを覆わない)。
          lg以上はコントロール領域がabsoluteで浮くため、このエリアが事実上100%を占め、現状維持。 */}
      <div ref={containerRef} className="network-grid-bg relative min-h-0 flex-1 overflow-hidden">
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
                      scale={nodeVisualScale}
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
      </div>

      {/* 下部コントロール領域: 攻撃ツールバーと統計パネルを同じ親(この行)の中で並べる。
          両者が別々の親から絶対配置されていた旧構成では互いのサイズを知らず重なっていたため、
          構造的に重なり得ない形にした。
          lg以上: 従来どおりabsoluteでマップ上に浮かせる(inset-x-4 bottom-4 z-20、Phase1のz階層を踏襲、変更なし)。
            この時マップ本体エリアはflex-1の唯一の子になるため実質100%を占め、見た目は完全に現状維持。
          lg未満: 通常フロー(shrink-0)でマップの下に実配置する。これによりマップの上に何も重ならず、
            マップ本体エリアがflex-1で残り高さを丸ごと確保できる。中の2要素だけpointer-events-auto。 */}
      <div className="shrink-0 border-t border-slate-800/60 bg-slate-950/60 p-3 lg:absolute lg:inset-x-4 lg:bottom-4 lg:z-20 lg:border-none lg:bg-transparent lg:p-0 lg:pointer-events-none">
        <div className="flex flex-col-reverse items-start gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="pointer-events-auto w-full min-w-0 lg:w-auto">
            <AttackToolbar nodes={nodes} />
          </div>
          <div className="pointer-events-auto w-full lg:w-auto lg:shrink-0">
            <StatsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
