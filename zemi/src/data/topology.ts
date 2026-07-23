import type { NetworkNode, NetworkLink } from '../types';

/**
 * サンプルネットワークトポロジを生成する。
 * 座標は800x600程度のビューポートを想定した初期配置(D3力学レイアウトで後から再配置される)。
 */
export function getInitialTopology(): { nodes: NetworkNode[]; links: NetworkLink[] } {
  const nodes: NetworkNode[] = [
    { id: 'attacker-1', type: 'attacker', label: 'Attacker', x: 60, y: 120, infected: false, health: 100 },
    { id: 'attacker-2', type: 'attacker', label: 'Attacker 2', x: 60, y: 320, infected: false, health: 100 },
    { id: 'internet', type: 'internet', label: 'Internet', x: 200, y: 220, infected: false, health: 100 },
    { id: 'firewall', type: 'firewall', label: 'Firewall', x: 360, y: 220, infected: false, health: 100 },
    { id: 'router', type: 'router', label: 'Router', x: 500, y: 220, infected: false, health: 100 },
    { id: 'dns', type: 'dns', label: 'DNS Server', x: 640, y: 100, infected: false, health: 100 },
    { id: 'server-web', type: 'server', label: 'Web Server', x: 660, y: 220, infected: false, health: 100 },
    { id: 'server-db', type: 'server', label: 'DB Server', x: 660, y: 340, infected: false, health: 100 },
    { id: 'host-1', type: 'host', label: 'PC-01', x: 500, y: 420, infected: false, health: 100 },
    { id: 'host-2', type: 'host', label: 'PC-02', x: 600, y: 480, infected: false, health: 100 },
    { id: 'host-3', type: 'host', label: 'PC-03', x: 420, y: 480, infected: false, health: 100 },
  ];

  const rand = () => 0.2 + Math.random() * 0.4; // 0.2-0.6

  const links: NetworkLink[] = [
    { id: 'l-att1-internet', source: 'attacker-1', target: 'internet', trafficType: 'attack', intensity: rand(), blocked: false },
    { id: 'l-att2-internet', source: 'attacker-2', target: 'internet', trafficType: 'attack', intensity: rand(), blocked: false },
    { id: 'l-internet-firewall', source: 'internet', target: 'firewall', trafficType: 'normal', intensity: rand(), blocked: false },
    { id: 'l-firewall-router', source: 'firewall', target: 'router', trafficType: 'normal', intensity: rand(), blocked: false },
    { id: 'l-router-dns', source: 'router', target: 'dns', trafficType: 'dns', intensity: rand(), blocked: false },
    { id: 'l-router-server-web', source: 'router', target: 'server-web', trafficType: 'http', intensity: rand(), blocked: false },
    { id: 'l-router-server-db', source: 'router', target: 'server-db', trafficType: 'normal', intensity: rand(), blocked: false },
    { id: 'l-router-host-1', source: 'router', target: 'host-1', trafficType: 'normal', intensity: rand(), blocked: false },
    { id: 'l-host1-server-web', source: 'host-1', target: 'server-web', trafficType: 'ssh', intensity: rand(), blocked: false },
    { id: 'l-host2-router', source: 'host-2', target: 'router', trafficType: 'normal', intensity: rand(), blocked: false },
    { id: 'l-host3-server-db', source: 'host-3', target: 'server-db', trafficType: 'ssh', intensity: rand(), blocked: false },
  ];

  return { nodes, links };
}
