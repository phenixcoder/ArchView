"use client"

import { useState, useEffect } from 'react';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { GraphCanvas } from './GraphCanvas';
import { Button } from './ui/button';
import { System, Connection, Journey, JourneyListItem } from '@/lib/schema';

interface ExplorerProps {
  initialSystems: System[];
  initialConnections: Connection[];
  initialJourneys: JourneyListItem[];
}

export function Explorer({ initialSystems, initialConnections, initialJourneys }: ExplorerProps) {
  const [systems, setSystems] = useState<System[]>(initialSystems);
  const [connections, setConnections] = useState<Connection[]>(initialConnections);
  const [journeys, setJourneys] = useState<JourneyListItem[]>(initialJourneys);

  const [selectedJourneyId, setSelectedJourneyId] = useState<string | undefined>();
  const [selectedJourney, setSelectedJourney] = useState<Journey | undefined>();
  const [selectedSystemId, setSelectedSystemId] = useState<string | undefined>();
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | undefined>();
  const [selectedEnv, setSelectedEnv] = useState<'dev' | 'stage' | 'prod'>('prod');
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set());

  // Extract all unique layers from connections
  const allLayers = Array.from(
    new Set(connections.flatMap(c => c.tags || []))
  ).sort();

  // Load selected journey data
  useEffect(() => {
    if (!selectedJourneyId) {
      setSelectedJourney(undefined);
      return;
    }

    if (selectedJourneyId === 'all') {
      fetch('/api/journeys/all')
        .then(res => res.json())
        .then(data => setSelectedJourney(data))
        .catch(err => console.error('Failed to load all journeys:', err));
    } else {
      const journeyItem = journeys.find(j => j.id === selectedJourneyId);
      if (journeyItem) {
        fetch(`/api/journeys/${journeyItem.path.replace(/^journeys\//, '').replace(/\.journey\.json$/, '')}`)
          .then(res => {
            if (!res.ok) {
              // Journey endpoint doesn't exist yet, construct from connections
              const journey: Journey = {
                id: journeyItem.id,
                name: journeyItem.name,
                label: journeyItem.label,
                connections: [],
                tags: journeyItem.tags,
              };
              setSelectedJourney(journey);
              return;
            }
            return res.json();
          })
          .then(data => data && setSelectedJourney(data))
          .catch(err => console.error('Failed to load journey:', err));
      }
    }
  }, [selectedJourneyId, journeys]);

  const handleToggleLayer = (layer: string) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      if (next.has(layer)) {
        next.delete(layer);
      } else {
        next.add(layer);
      }
      return next;
    });
  };

  const handleSelectSystem = (id: string | undefined) => {
    setSelectedSystemId(id);
    setSelectedConnectionId(undefined);
  };

  const handleSelectConnection = (id: string | undefined) => {
    setSelectedConnectionId(id);
    setSelectedSystemId(undefined);
  };

  const selectedSystem = selectedSystemId ? systems.find(s => s.id === selectedSystemId) : undefined;
  const selectedConnection = selectedConnectionId
    ? connections.find(c => c.id === selectedConnectionId)
    : undefined;

  return (
    <div className="flex h-screen">
      {/* Left Panel */}
      <LeftPanel
        journeys={[
          { id: 'all', name: 'All Journeys', label: '🌐 All Journeys' },
          ...journeys,
        ]}
        systems={systems}
        layers={allLayers}
        selectedJourneyId={selectedJourneyId}
        selectedEnv={selectedEnv}
        activeLayers={activeLayers}
        onSelectJourney={setSelectedJourneyId}
        onToggleLayer={handleToggleLayer}
        onSelectSystem={handleSelectSystem}
      />

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 border-b bg-background px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">ArchView</h1>
            {selectedJourney && (
              <div className="text-sm text-muted-foreground">
                {selectedJourney.label || selectedJourney.name}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground mr-2">Environment:</div>
            {(['dev', 'stage', 'prod'] as const).map(env => (
              <Button
                key={env}
                size="sm"
                variant={selectedEnv === env ? 'default' : 'outline'}
                onClick={() => setSelectedEnv(env)}
                className="capitalize"
              >
                {env}
              </Button>
            ))}
          </div>
        </div>

        {/* Graph Canvas */}
        <GraphCanvas
          systems={systems}
          connections={connections}
          journey={selectedJourney}
          env={selectedEnv}
          activeLayers={activeLayers}
          selectedSystemId={selectedSystemId}
          selectedConnectionId={selectedConnectionId}
          onSelectSystem={handleSelectSystem}
          onSelectConnection={handleSelectConnection}
        />
      </div>

      {/* Right Panel */}
      {(selectedSystem || selectedConnection) && (
        <RightPanel
          selectedSystem={selectedSystem}
          selectedConnection={selectedConnection}
          selectedEnv={selectedEnv}
          onClose={() => {
            setSelectedSystemId(undefined);
            setSelectedConnectionId(undefined);
          }}
        />
      )}
    </div>
  );
}
