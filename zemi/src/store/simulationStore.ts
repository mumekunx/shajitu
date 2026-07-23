import { create } from 'zustand';
import type { NetworkNode, NetworkLink, LogEntry, TimelineEvent, SimStats, AttackState, AttackType } from '../types';
import { getInitialTopology } from '../data/topology';

interface SimulationStore {
  nodes: NetworkNode[];
  links: NetworkLink[];
  logs: LogEntry[];
  timeline: TimelineEvent[];
  stats: SimStats;
  activeAttacks: AttackState[];

  setNodes: (nodes: NetworkNode[]) => void;
  setLinks: (links: NetworkLink[]) => void;
  updateNode: (id: string, patch: Partial<NetworkNode>) => void;
  updateLink: (id: string, patch: Partial<NetworkLink>) => void;
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'timestamp'>) => void;
  setStats: (patch: Partial<SimStats>) => void;
  addAttack: (attack: Omit<AttackState, 'id' | 'startedAt' | 'progress' | 'blocked'>) => string; // returns generated id
  updateAttack: (id: string, patch: Partial<AttackState>) => void;
  removeAttack: (id: string) => void;
  reset: () => void;
}

const initialTopology = getInitialTopology();

const initialStats: SimStats = { cpu: 12, memory: 18, network: 8, attackScore: 0 };

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  nodes: initialTopology.nodes,
  links: initialTopology.links,
  logs: [],
  timeline: [],
  stats: initialStats,
  activeAttacks: [],

  setNodes: (nodes) => set({ nodes }),

  setLinks: (links) => set({ links }),

  updateNode: (id, patch) =>
    set({
      nodes: get().nodes.map((node) => (node.id === id ? { ...node, ...patch } : node)),
    }),

  updateLink: (id, patch) =>
    set({
      links: get().links.map((link) => (link.id === id ? { ...link, ...patch } : link)),
    }),

  addLog: (entry) =>
    set({
      logs: [
        ...get().logs,
        { ...entry, id: crypto.randomUUID(), timestamp: Date.now() },
      ],
    }),

  addTimelineEvent: (event) =>
    set({
      timeline: [
        ...get().timeline,
        { ...event, id: crypto.randomUUID(), timestamp: Date.now() },
      ],
    }),

  setStats: (patch) => set({ stats: { ...get().stats, ...patch } }),

  addAttack: (attack) => {
    const id = crypto.randomUUID();
    const newAttack: AttackState = {
      ...attack,
      id,
      startedAt: Date.now(),
      progress: 0,
      blocked: false,
    };
    set({ activeAttacks: [...get().activeAttacks, newAttack] });
    return id;
  },

  updateAttack: (id, patch) =>
    set({
      activeAttacks: get().activeAttacks.map((attack) =>
        attack.id === id ? { ...attack, ...patch } : attack
      ),
    }),

  removeAttack: (id) =>
    set({
      activeAttacks: get().activeAttacks.filter((attack) => attack.id !== id),
    }),

  reset: () => {
    const topology = getInitialTopology();
    set({
      nodes: topology.nodes,
      links: topology.links,
      logs: [],
      timeline: [],
      stats: initialStats,
      activeAttacks: [],
    });
  },
}));

// AttackType は公開インターフェースの一部として再エクスポートし、
// 後続のエンジン担当が `import type { AttackType } from '../store/simulationStore'` でも参照できるようにする。
export type { AttackType };
