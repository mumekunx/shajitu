import { useEffect, useRef, useState } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type Simulation,
  type SimulationNodeDatum,
} from 'd3-force';
import type { NetworkNode, NetworkLink } from '../../types';
import { NODE_RADIUS, computeLayoutScale, computeVisualScale } from './constants';

export interface LayoutNode extends SimulationNodeDatum {
  id: string;
  type: NetworkNode['type'];
}

export interface NodePosition {
  x: number;
  y: number;
}

/**
 * d3-force によるノード位置計算をローカルで保持するフック。
 * zustand ストアの node.x/y は初期配置のヒントとしてのみ使い、
 * 毎フレームのレイアウト更新はローカル state (positions) に閉じる。
 * シミュレーションは収束すると自動的に tick が止まるため負荷は限定的。
 */
export function useNetworkLayout(
  nodes: NetworkNode[],
  links: NetworkLink[],
  width: number,
  height: number,
  isDesktop: boolean
) {
  const [positions, setPositions] = useState<Record<string, NodePosition>>({});
  const simRef = useRef<Simulation<LayoutNode, undefined> | null>(null);
  // ノード集合のキー(id一覧)が変わったときだけシミュレーションを再構築する
  const nodeKeyRef = useRef<string>('');

  useEffect(() => {
    if (width <= 0 || height <= 0 || nodes.length === 0) return;

    const nodeKey = nodes.map((n) => n.id).join(',');
    const layoutNodes: LayoutNode[] = nodes.map((n) => ({
      id: n.id,
      type: n.type,
      x: n.x,
      y: n.y,
    }));

    // Phase2: 狭い画面(lg未満)向けにパラメータを縮小するスケール。
    // isDesktop(ビューポート幅1024px以上)では常に1(従来値と完全一致)。
    // width/heightはマップコンテナの実測値でありビューポート幅とは一致しないため、
    // デスクトップ判定にはcomputeLayoutScale/computeVisualScale内部の閾値ではなくisDesktopを使う。
    const layoutScale = isDesktop ? 1 : computeLayoutScale(width, height);
    const visualScale = isDesktop ? 1 : computeVisualScale(width, height);

    const linkForce = forceLink<LayoutNode, { source: string; target: string }>(
      links.map((l) => ({ source: l.source, target: l.target }))
    )
      .id((d) => d.id)
      .distance(120 * layoutScale)
      .strength(0.5);

    const sim = forceSimulation<LayoutNode>(layoutNodes)
      .force('link', linkForce)
      .force('charge', forceManyBody().strength(-260 * layoutScale))
      .force('center', forceCenter(width / 2, height / 2))
      .force(
        'collide',
        forceCollide<LayoutNode>((d) => NODE_RADIUS[d.type] * visualScale + 24 * layoutScale)
      )
      .alpha(1)
      .alphaDecay(0.04);

    sim.on('tick', () => {
      const next: Record<string, NodePosition> = {};
      for (const n of layoutNodes) {
        const margin = NODE_RADIUS[n.type] * visualScale + 30 * layoutScale;
        // 幅/高さがmargin*2に満たない狭さでは、従来のclamp式は`min`が先に効いて
        // 全ノードが同一座標(margin側)に潰れてしまうため、中央寄せにフォールバックする。
        n.x = width < margin * 2 ? width / 2 : Math.max(margin, Math.min(width - margin, n.x ?? width / 2));
        n.y = height < margin * 2 ? height / 2 : Math.max(margin, Math.min(height - margin, n.y ?? height / 2));
        next[n.id] = { x: n.x, y: n.y };
      }
      setPositions(next);
    });

    simRef.current = sim;
    nodeKeyRef.current = nodeKey;

    return () => {
      sim.stop();
    };
    // links は初期トポロジでほぼ固定の想定。nodes の id 集合が変わった時のみ再構築する。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length, width, height, isDesktop]);

  // 画面サイズが変わったら center force を更新して軽く再加熱する
  useEffect(() => {
    const sim = simRef.current;
    if (!sim || width <= 0 || height <= 0) return;
    sim.force('center', forceCenter(width / 2, height / 2));
    sim.alpha(0.3).restart();
  }, [width, height]);

  return positions;
}
