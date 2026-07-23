import { useEffect, useRef } from 'react';
import type { NetworkLink } from '../../types';
import { particleSystem } from '../../engine/particleSystem';
import { TRAFFIC_COLORS } from './constants';
import type { NodePosition } from './useNetworkLayout';

interface ParticleCanvasProps {
  width: number;
  height: number;
  links: NetworkLink[];
  positions: Record<string, NodePosition>;
  /** falseの間はrAFループを開始しない(既に走っていれば停止する)。既定はtrue。
   * 非表示ペイン(lg未満でmapタブが非選択)でのCPU/バッテリー消費を避けるために使う。
   * particleSystem自体の状態(このコンポーネント外で管理)は失われないため、再度true
   * になれば直前の粒子状態から描画を再開する。 */
  active?: boolean;
}

/**
 * 粒子(数百個規模)専用の Canvas 2D 描画レイヤー。
 * SVG(ノード/リンク)とは完全に分離し、自前の requestAnimationFrame ループで
 * 毎フレーム particleSystem.getParticles() を読んで描画するだけのコンポーネント。
 * React の再レンダリングは発生させない(ref 経由で直接 canvas に描く)。
 */
export default function ParticleCanvas({ width, height, links, positions, active = true }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // 最新の links / positions を rAF ループから参照するための ref(再レンダリング無しで読む)
  const linksRef = useRef(links);
  const positionsRef = useRef(positions);
  linksRef.current = links;
  positionsRef.current = positions;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const linkById = new Map<string, NetworkLink>();

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const cssWidth = canvas.clientWidth;
      const cssHeight = canvas.clientHeight;
      if (canvas.width !== cssWidth * dpr || canvas.height !== cssHeight * dpr) {
        canvas.width = cssWidth * dpr;
        canvas.height = cssHeight * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      linkById.clear();
      for (const l of linksRef.current) linkById.set(l.id, l);
      const positionMap = positionsRef.current;

      const particles = particleSystem.getParticles();
      for (const p of particles) {
        const link = linkById.get(p.linkId);
        if (!link) continue;
        const sourcePos = positionMap[link.source];
        const targetPos = positionMap[link.target];
        if (!sourcePos || !targetPos) continue;

        const x = sourcePos.x + (targetPos.x - sourcePos.x) * p.t;
        const y = sourcePos.y + (targetPos.y - sourcePos.y) * p.t;
        const color = TRAFFIC_COLORS[p.trafficType];

        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      rafId = requestAnimationFrame(render);
    };

    // activeがfalseの間はループを開始しない。activeがtrue→falseに変わった時は
    // このeffectが再実行され、クリーンアップで直前のrAFをキャンセルしてから
    // 新しい実行(このブロック)ではrequestAnimationFrameを呼ばないため、ループが止まる。
    if (active) {
      rafId = requestAnimationFrame(render);
    }
    return () => cancelAnimationFrame(rafId);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute left-0 top-0"
      style={{ width, height }}
    />
  );
}
