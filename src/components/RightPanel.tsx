"use client"

import { System, Connection } from '@/lib/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { getHealthColor } from '@/lib/utils';
import { ExternalLink, Mail, MessageSquare } from 'lucide-react';

interface RightPanelProps {
  selectedSystem?: System;
  selectedConnection?: Connection;
  selectedEnv: 'dev' | 'stage' | 'prod';
  onClose: () => void;
}

export function RightPanel({
  selectedSystem,
  selectedConnection,
  selectedEnv,
  onClose,
}: RightPanelProps) {
  if (!selectedSystem && !selectedConnection) {
    return null;
  }

  const entity = selectedSystem || selectedConnection;
  const isSystem = !!selectedSystem;

  return (
    <div className="w-96 border-l bg-background flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">{isSystem ? 'System Details' : 'Connection Details'}</h2>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Basic Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {isSystem && selectedSystem ? selectedSystem.name :
                selectedConnection ? `${selectedConnection.from} → ${selectedConnection.to}` : ''}
            </CardTitle>
            {entity?.description && (
              <CardDescription className="text-xs">{entity.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {isSystem && selectedSystem && (
              <>
                {selectedSystem.domain && (
                  <div>
                    <span className="font-medium">Domain:</span> {selectedSystem.domain}
                  </div>
                )}
                {selectedSystem.ip && (
                  <div>
                    <span className="font-medium">IP:</span> {selectedSystem.ip}
                  </div>
                )}
              </>
            )}

            {!isSystem && selectedConnection && (
              <>
                <div>
                  <span className="font-medium">From:</span> {selectedConnection.from}
                </div>
                <div>
                  <span className="font-medium">To:</span> {selectedConnection.to}
                </div>
                {selectedConnection.protocol && (
                  <div>
                    <span className="font-medium">Protocol:</span> {selectedConnection.protocol}
                  </div>
                )}
                {selectedConnection.endpoint && (
                  <div>
                    <span className="font-medium">Endpoint:</span> {selectedConnection.endpoint}
                  </div>
                )}
                {selectedConnection.port && (
                  <div>
                    <span className="font-medium">Port:</span> {selectedConnection.port}
                  </div>
                )}
                {selectedConnection.credentialAlias && (
                  <div>
                    <span className="font-medium">Credential:</span> {selectedConnection.credentialAlias}
                  </div>
                )}
              </>
            )}

            {/* Tags */}
            {entity?.tags && entity.tags.length > 0 && (
              <div>
                <span className="font-medium">Tags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {entity.tags.map((tag) => (
                    <span key={tag} className="text-[10px] bg-muted px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health Status */}
        {entity?.status && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Health Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(['dev', 'stage', 'prod'] as const).map((env) => {
                const status = entity.status?.[env];
                if (!status) return null;
                return (
                  <div key={env} className="flex items-center justify-between text-xs">
                    <span className="capitalize font-medium">{env}</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getHealthColor(status)}`} />
                      <span className="capitalize">{status}</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Owners */}
        {entity?.owners && entity.owners.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Owners</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {entity.owners.map((owner, idx) => (
                <div key={idx} className="text-xs space-y-1">
                  <div className="font-medium">{owner.name}</div>
                  <div className="flex flex-col gap-1 text-muted-foreground">
                    {owner.email && (
                      <a
                        href={`mailto:${owner.email}`}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        <Mail className="h-3 w-3" />
                        {owner.email}
                      </a>
                    )}
                    {owner.slack && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {owner.slack}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Documentation */}
        {entity?.docs && entity.docs.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Documentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {entity.docs.map((doc, idx) => (
                <a
                  key={idx}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {doc.title}
                </a>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
