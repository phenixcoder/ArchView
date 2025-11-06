"use client"

import { useEffect, useRef, useState } from 'react';
import { System, Connection, Journey } from '@/lib/schema';
import { LayoutNode, LayoutEdge, autoLayout } from '@/lib/layout';
import { getHealthColor } from '@/lib/utils';

interface GraphCanvasProps {
  systems: System[];
  connections: Connection[];
  journey?: Journey;
  env: 'dev' | 'stage' | 'prod';
  activeLayers: Set<string>;
  selectedSystemId?: string;
  selectedConnectionId?: string;
  onSelectSystem: (id: string | undefined) => void;
  onSelectConnection: (id: string | undefined) => void;
}

export function GraphCanvas({
  systems,
  connections,
  journey,
  env,
  activeLayers,
  selectedSystemId,
  selectedConnectionId,
  onSelectSystem,
  onSelectConnection,
}: GraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [layout, setLayout] = useState<{ nodes: LayoutNode[]; edges: LayoutEdge[] } | null>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1000, height: 600 });

  // Filter connections based on layers and journey
  const visibleConnections = connections.filter(conn => {
    // Layer filter
    if (activeLayers.size > 0) {
      const hasActiveTag = conn.tags?.some(tag => activeLayers.has(tag));
      if (!hasActiveTag) return false;
    }

    // Journey filter
    if (journey) {
      return journey.connections.includes(conn.id);
    }

    return true;
  });

  // Determine visible systems (connected by visible connections or in journey)
  const visibleSystemIds = new Set<string>();

  if (journey?.systems) {
    journey.systems.forEach(id => visibleSystemIds.add(id));
  }

  visibleConnections.forEach(conn => {
    visibleSystemIds.add(conn.from);
    visibleSystemIds.add(conn.to);
  });

  const visibleSystems = systems.filter(s => visibleSystemIds.has(s.id));

  // Compute layout
  useEffect(() => {
    if (visibleSystems.length === 0) {
      setLayout(null);
      return;
    }

    autoLayout(visibleSystems, visibleConnections).then(result => {
      setLayout(result);
      // Auto-fit on initial load
      setViewBox({
        x: -50,
        y: -50,
        width: result.width + 100,
        height: result.height + 100,
      });
    });
  }, [visibleSystems.length, visibleConnections.length]);

  if (!layout || visibleSystems.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        {journey ? 'No systems in this journey' : 'Select a journey to view the graph'}
      </div>
    );
  }

  // Helper to check if entity is in journey
  const isInJourney = (id: string, type: 'system' | 'connection') => {
    if (!journey) return true;
    if (type === 'system') {
      return visibleSystemIds.has(id);
    }
    return journey.connections.includes(id);
  };

  const opacity = (id: string, type: 'system' | 'connection') => {
    return isInJourney(id, type) ? 1 : 0.3;
  };

  return (
    <div className="flex-1 relative bg-muted/20">
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="currentColor" />
          </marker>
        </defs>

        {/* Edges */}
        <g className="edges">
          {layout.edges.map(edge => {
            const conn = visibleConnections.find(c => c.id === edge.id);
            if (!conn || edge.points.length < 2) return null;

            const isSelected = selectedConnectionId === edge.id;
            const op = opacity(edge.id, 'connection');

            const pathData = edge.points
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
              .join(' ');

            return (
              <g
                key={edge.id}
                style={{ opacity: op }}
                onClick={() => onSelectConnection(edge.id)}
                className="cursor-pointer"
              >
                <path
                  d={pathData}
                  stroke={isSelected ? 'hsl(var(--primary))' : 'currentColor'}
                  strokeWidth={isSelected ? 2 : 1.5}
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  className="text-foreground/40 hover:text-foreground/80 transition-colors"
                />
                {conn.label && (
                  <text
                    x={(edge.points[0].x + edge.points[edge.points.length - 1].x) / 2}
                    y={(edge.points[0].y + edge.points[edge.points.length - 1].y) / 2}
                    className="text-xs fill-current text-muted-foreground"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {conn.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Nodes */}
        <g className="nodes">
          {layout.nodes.map(node => {
            const system = visibleSystems.find(s => s.id === node.id);
            if (!system) return null;

            const isSelected = selectedSystemId === node.id;
            const op = opacity(node.id, 'system');
            const status = system.status?.[env];

            return (
              <g
                key={node.id}
                transform={`translate(${node.x - node.width / 2}, ${node.y - node.height / 2})`}
                style={{ opacity: op }}
                onClick={() => onSelectSystem(node.id)}
                className="cursor-pointer"
              >
                <rect
                  width={node.width}
                  height={node.height}
                  rx="4"
                  fill="hsl(var(--background))"
                  stroke={isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                  strokeWidth={isSelected ? 2 : 1}
                  className="transition-all hover:stroke-foreground/50"
                />

                {/* Health indicator */}
                {status && (
                  <circle
                    cx={node.width - 10}
                    cy={10}
                    r={4}
                    className={getHealthColor(status)}
                  />
                )}

                <text
                  x={node.width / 2}
                  y={node.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-medium fill-current pointer-events-none"
                >
                  {system.name}
                </text>

                {system.domain && (
                  <text
                    x={node.width / 2}
                    y={node.height / 2 + 14}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[10px] fill-current text-muted-foreground pointer-events-none"
                  >
                    {system.domain}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
