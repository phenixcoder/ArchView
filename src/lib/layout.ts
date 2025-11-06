import { System, Connection } from './schema';

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutEdge {
  id: string;
  from: string;
  to: string;
  points: Array<{ x: number; y: number }>;
}

export interface LayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
}

/**
 * Simple grid layout fallback
 */
export function gridLayout(
  systems: System[],
  connections: Connection[]
): LayoutResult {
  const nodeWidth = 120;
  const nodeHeight = 60;
  const cols = Math.ceil(Math.sqrt(systems.length));
  const spacing = 150;

  const nodes: LayoutNode[] = systems.map((system, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);

    return {
      id: system.id,
      x: system.x !== undefined ? system.x : col * spacing + nodeWidth / 2,
      y: system.y !== undefined ? system.y : row * spacing + nodeHeight / 2,
      width: nodeWidth,
      height: nodeHeight,
    };
  });

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  const edges: LayoutEdge[] = connections.map(conn => {
    const from = nodeMap.get(conn.from);
    const to = nodeMap.get(conn.to);

    if (!from || !to) {
      return {
        id: conn.id,
        from: conn.from,
        to: conn.to,
        points: [],
      };
    }

    return {
      id: conn.id,
      from: conn.from,
      to: conn.to,
      points: [
        { x: from.x, y: from.y },
        { x: to.x, y: to.y },
      ],
    };
  });

  const width = cols * spacing + nodeWidth;
  const height = Math.ceil(systems.length / cols) * spacing + nodeHeight;

  return { nodes, edges, width, height };
}

/**
 * Try to use dagre for layout, fall back to grid
 */
export async function autoLayout(
  systems: System[],
  connections: Connection[]
): Promise<LayoutResult> {
  try {
    const dagre = await import('dagre');
    const g = new dagre.graphlib.Graph();

    g.setGraph({ rankdir: 'LR', nodesep: 100, ranksep: 150 });
    g.setDefaultEdgeLabel(() => ({}));

    const nodeWidth = 120;
    const nodeHeight = 60;

    // Add nodes
    systems.forEach(system => {
      g.setNode(system.id, {
        width: nodeWidth,
        height: nodeHeight,
      });
    });

    // Add edges
    connections.forEach(conn => {
      g.setEdge(conn.from, conn.to);
    });

    dagre.layout(g);

    const nodes: LayoutNode[] = systems.map(system => {
      const node = g.node(system.id);
      return {
        id: system.id,
        x: node.x,
        y: node.y,
        width: nodeWidth,
        height: nodeHeight,
      };
    });

    const edges: LayoutEdge[] = connections.map(conn => {
      const edge = g.edge(conn.from, conn.to);
      return {
        id: conn.id,
        from: conn.from,
        to: conn.to,
        points: edge.points || [],
      };
    });

    const graph = g.graph();

    return {
      nodes,
      edges,
      width: (graph.width || 800) + 100,
      height: (graph.height || 600) + 100,
    };
  } catch (error) {
    console.warn('Dagre layout failed, using grid layout:', error);
    return gridLayout(systems, connections);
  }
}
