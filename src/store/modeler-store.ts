import { create } from 'zustand';

export interface BpmnNode {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties: Record<string, unknown>;
}

export interface BpmnConnection {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'sequenceFlow' | 'messageFlow' | 'association';
  label?: string;
  waypoints: { x: number; y: number }[];
  condition?: string;
}

interface HistoryEntry {
  nodes: BpmnNode[];
  connections: BpmnConnection[];
}

interface ModelerState {
  nodes: BpmnNode[];
  connections: BpmnConnection[];
  selectedNodeId: string | null;
  selectedConnectionId: string | null;
  zoom: number;
  panX: number;
  panY: number;
  isDirty: boolean;
  isConnecting: boolean;
  connectingFrom: string | null;
  gridVisible: boolean;
  snapToGrid: boolean;
  processName: string;

  // History
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];

  // Actions
  addNode: (node: BpmnNode) => void;
  updateNode: (id: string, updates: Partial<BpmnNode>) => void;
  removeNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  addConnection: (conn: BpmnConnection) => void;
  removeConnection: (id: string) => void;
  selectConnection: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  startConnecting: (fromId: string) => void;
  finishConnecting: (toId: string) => void;
  cancelConnecting: () => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  clearCanvas: () => void;
  loadFromNodes: (nodes: BpmnNode[], connections: BpmnConnection[]) => void;
  setDirty: (dirty: boolean) => void;
  setProcessName: (name: string) => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
}

export const useModelerStore = create<ModelerState>((set, get) => ({
  nodes: [],
  connections: [],
  selectedNodeId: null,
  selectedConnectionId: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  isDirty: false,
  isConnecting: false,
  connectingFrom: null,
  gridVisible: true,
  snapToGrid: true,
  processName: 'New Process',
  undoStack: [],
  redoStack: [],

  pushHistory: () => {
    const { nodes, connections, undoStack } = get();
    set({
      undoStack: [
        ...undoStack.slice(-49),
        {
          nodes: JSON.parse(JSON.stringify(nodes)),
          connections: JSON.parse(JSON.stringify(connections)),
        },
      ],
      redoStack: [],
    });
  },

  addNode: (node: BpmnNode) => {
    const state = get();
    state.pushHistory();
    set({
      nodes: [...state.nodes, node],
      isDirty: true,
    });
  },

  updateNode: (id: string, updates: Partial<BpmnNode>) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, ...updates } : n
      ),
      isDirty: true,
    }));
  },

  removeNode: (id: string) => {
    const state = get();
    state.pushHistory();
    set({
      nodes: state.nodes.filter((n) => n.id !== id),
      connections: state.connections.filter(
        (c) => c.sourceId !== id && c.targetId !== id
      ),
      selectedNodeId:
        state.selectedNodeId === id ? null : state.selectedNodeId,
      isDirty: true,
    });
  },

  selectNode: (id: string | null) => {
    set({
      selectedNodeId: id,
      selectedConnectionId: id ? null : get().selectedConnectionId,
    });
  },

  addConnection: (conn: BpmnConnection) => {
    const state = get();
    state.pushHistory();
    set({
      connections: [...state.connections, conn],
      isDirty: true,
    });
  },

  removeConnection: (id: string) => {
    const state = get();
    state.pushHistory();
    set({
      connections: state.connections.filter((c) => c.id !== id),
      selectedConnectionId:
        state.selectedConnectionId === id
          ? null
          : state.selectedConnectionId,
      isDirty: true,
    });
  },

  selectConnection: (id: string | null) => {
    set({
      selectedConnectionId: id,
      selectedNodeId: id ? null : get().selectedNodeId,
    });
  },

  setZoom: (zoom: number) => {
    set({ zoom: Math.max(0.1, Math.min(3, zoom)) });
  },

  setPan: (x: number, y: number) => {
    set({ panX: x, panY: y });
  },

  startConnecting: (fromId: string) => {
    set({ isConnecting: true, connectingFrom: fromId });
  },

  finishConnecting: (toId: string) => {
    const state = get();
    if (!state.connectingFrom || state.connectingFrom === toId) {
      set({ isConnecting: false, connectingFrom: null });
      return;
    }

    const sourceNode = state.nodes.find((n) => n.id === state.connectingFrom);
    const targetNode = state.nodes.find((n) => n.id === toId);

    if (!sourceNode || !targetNode) {
      set({ isConnecting: false, connectingFrom: null });
      return;
    }

    const existingConn = state.connections.find(
      (c) => c.sourceId === state.connectingFrom && c.targetId === toId
    );
    if (existingConn) {
      set({ isConnecting: false, connectingFrom: null });
      return;
    }

    const newConnection: BpmnConnection = {
      id: crypto.randomUUID(),
      sourceId: state.connectingFrom,
      targetId: toId,
      type: 'sequenceFlow',
      waypoints: [
        {
          x: sourceNode.x + sourceNode.width / 2,
          y: sourceNode.y + sourceNode.height / 2,
        },
        {
          x: targetNode.x + targetNode.width / 2,
          y: targetNode.y + targetNode.height / 2,
        },
      ],
    };

    state.pushHistory();
    set({
      connections: [...state.connections, newConnection],
      isConnecting: false,
      connectingFrom: null,
      isDirty: true,
    });
  },

  cancelConnecting: () => {
    set({ isConnecting: false, connectingFrom: null });
  },

  toggleGrid: () => {
    set((state) => ({ gridVisible: !state.gridVisible }));
  },

  toggleSnap: () => {
    set((state) => ({ snapToGrid: !state.snapToGrid }));
  },

  clearCanvas: () => {
    const state = get();
    state.pushHistory();
    set({
      nodes: [],
      connections: [],
      selectedNodeId: null,
      selectedConnectionId: null,
      isDirty: true,
    });
  },

  loadFromNodes: (nodes: BpmnNode[], connections: BpmnConnection[]) => {
    set({
      nodes,
      connections,
      selectedNodeId: null,
      selectedConnectionId: null,
      isDirty: false,
    });
  },

  setDirty: (dirty: boolean) => {
    set({ isDirty: dirty });
  },

  setProcessName: (name: string) => {
    set({ processName: name, isDirty: true });
  },

  undo: () => {
    const { undoStack, nodes, connections } = get();
    if (undoStack.length === 0) return;

    const previous = undoStack[undoStack.length - 1];
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [
        ...get().redoStack,
        {
          nodes: JSON.parse(JSON.stringify(nodes)),
          connections: JSON.parse(JSON.stringify(connections)),
        },
      ],
      nodes: previous.nodes,
      connections: previous.connections,
      selectedNodeId: null,
      selectedConnectionId: null,
      isDirty: true,
    });
  },

  redo: () => {
    const { redoStack, nodes, connections } = get();
    if (redoStack.length === 0) return;

    const next = redoStack[redoStack.length - 1];
    set({
      redoStack: redoStack.slice(0, -1),
      undoStack: [
        ...get().undoStack,
        {
          nodes: JSON.parse(JSON.stringify(nodes)),
          connections: JSON.parse(JSON.stringify(connections)),
        },
      ],
      nodes: next.nodes,
      connections: next.connections,
      selectedNodeId: null,
      selectedConnectionId: null,
      isDirty: true,
    });
  },
}));
