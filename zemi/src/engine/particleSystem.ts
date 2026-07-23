import type { Particle, NetworkLink } from '../types';

const MAX_PARTICLES = 1500;

class ParticleSystem {
  private particles: Particle[] = [];

  spawnForLink(link: NetworkLink, count: number): void {
    for (let i = 0; i < count; i++) {
      // intensityが高いほど速い (0-1 -> おおよそ 0.0006 - 0.0035 / ms)
      const baseSpeed = 0.0006 + link.intensity * 0.0028;
      // 個体差を持たせる
      const speed = baseSpeed * (0.8 + Math.random() * 0.4);

      const particle: Particle = {
        id: crypto.randomUUID(),
        linkId: link.id,
        t: Math.random() * 0.1,
        speed,
        trafficType: link.trafficType,
        size: 1.5 + Math.random() * 1.5,
      };

      this.particles.push(particle);
    }

    // パフォーマンス保護: 上限を超えたら古いものから間引く
    if (this.particles.length > MAX_PARTICLES) {
      this.particles.splice(0, this.particles.length - MAX_PARTICLES);
    }
  }

  tick(dtMs: number): void {
    if (this.particles.length === 0) return;

    const next: Particle[] = [];
    for (const particle of this.particles) {
      const t = particle.t + particle.speed * dtMs;
      if (t >= 1) {
        // 到達・消滅
        continue;
      }
      next.push({ ...particle, t });
    }
    this.particles = next;
  }

  getParticles(): readonly Particle[] {
    return this.particles;
  }

  clear(): void {
    this.particles = [];
  }
}

export const particleSystem = new ParticleSystem();
