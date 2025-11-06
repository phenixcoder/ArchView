"use client"

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Journey, System } from '@/lib/schema';
import { getHealthColor } from '@/lib/utils';

interface LeftPanelProps {
  journeys: Array<{ id: string; name: string; label?: string; tags?: string[] }>;
  systems: System[];
  layers: string[];
  selectedJourneyId?: string;
  selectedEnv: 'dev' | 'stage' | 'prod';
  activeLayers: Set<string>;
  onSelectJourney: (id: string | undefined) => void;
  onToggleLayer: (layer: string) => void;
  onSelectSystem: (id: string | undefined) => void;
}

export function LeftPanel({
  journeys,
  systems,
  layers,
  selectedJourneyId,
  selectedEnv,
  activeLayers,
  onSelectJourney,
  onToggleLayer,
  onSelectSystem,
}: LeftPanelProps) {
  const [journeySearch, setJourneySearch] = useState('');
  const [systemSearch, setSystemSearch] = useState('');

  const filteredJourneys = journeys.filter((j) => {
    const searchTerm = journeySearch.toLowerCase();
    const displayName = (j.label || j.name).toLowerCase();
    const tagsMatch = j.tags?.some(t => t.toLowerCase().includes(searchTerm));
    return displayName.includes(searchTerm) || tagsMatch;
  });

  const filteredSystems = systems.filter((s) => {
    const searchTerm = systemSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(searchTerm) ||
      s.domain?.toLowerCase().includes(searchTerm) ||
      s.tags?.some(t => t.toLowerCase().includes(searchTerm))
    );
  });

  // Organize journeys by hierarchy
  const organizeJourneys = (journeys: typeof filteredJourneys) => {
    const tree: Record<string, typeof filteredJourneys> = {};

    for (const journey of journeys) {
      const parts = journey.id.split('/');
      const category = parts.length > 1 ? parts[0] : 'Other';

      if (!tree[category]) {
        tree[category] = [];
      }
      tree[category].push(journey);
    }

    // Sort categories and journeys within
    const sorted: Record<string, typeof filteredJourneys> = {};
    Object.keys(tree).sort().forEach(category => {
      sorted[category] = tree[category].sort((a, b) => {
        const aName = a.label || a.name;
        const bName = b.label || b.name;
        return aName.localeCompare(bName);
      });
    });

    return sorted;
  };

  const organizedJourneys = organizeJourneys(filteredJourneys);

  return (
    <div className="w-80 border-r bg-background flex flex-col h-full">
      <Tabs defaultValue="journeys" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b px-2">
          <TabsTrigger value="journeys">Journeys</TabsTrigger>
          <TabsTrigger value="systems">Systems</TabsTrigger>
          <TabsTrigger value="layers">Layers</TabsTrigger>
        </TabsList>

        <TabsContent value="journeys" className="flex-1 overflow-hidden flex flex-col m-0 p-2">
          <div className="relative mb-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search journeys..."
              value={journeySearch}
              onChange={(e) => setJourneySearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {Object.entries(organizedJourneys).map(([category, items]) => (
              <div key={category} className="space-y-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase px-2 py-1">
                  {category}
                </div>
                {items.map((journey) => (
                  <button
                    key={journey.id}
                    onClick={() =>
                      onSelectJourney(selectedJourneyId === journey.id ? undefined : journey.id)
                    }
                    className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors ${
                      selectedJourneyId === journey.id
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="font-medium">{journey.label || journey.name}</div>
                    {journey.tags && journey.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {journey.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] bg-muted px-1 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="systems" className="flex-1 overflow-hidden flex flex-col m-0 p-2">
          <div className="relative mb-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search systems..."
              value={systemSearch}
              onChange={(e) => setSystemSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1">
            {filteredSystems.map((system) => {
              const status = system.status?.[selectedEnv];
              return (
                <button
                  key={system.id}
                  onClick={() => onSelectSystem(system.id)}
                  className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getHealthColor(status)}`} />
                    <div className="flex-1">
                      <div className="font-medium">{system.name}</div>
                      {system.domain && (
                        <div className="text-[10px] text-muted-foreground">{system.domain}</div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="layers" className="flex-1 overflow-hidden flex flex-col m-0 p-2">
          <div className="text-xs text-muted-foreground mb-2">
            Toggle connection groups to filter the graph
          </div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {layers.map((layer) => (
              <label
                key={layer}
                className="flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-accent cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={activeLayers.has(layer)}
                  onChange={() => onToggleLayer(layer)}
                  className="rounded"
                />
                <span className="capitalize">{layer}</span>
              </label>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
