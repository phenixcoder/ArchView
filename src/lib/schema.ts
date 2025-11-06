import { z } from 'zod';

// Environment enum
export const EnvSchema = z.enum(['dev', 'stage', 'prod']);
export type Env = z.infer<typeof EnvSchema>;

// Health status enum
export const HealthStatusSchema = z.enum(['healthy', 'degraded', 'down', 'unknown']);
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

// Owner schema
export const OwnerSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  slack: z.string().optional(),
});
export type Owner = z.infer<typeof OwnerSchema>;

// Doc schema
export const DocSchema = z.object({
  title: z.string(),
  url: z.string().url(),
});
export type Doc = z.infer<typeof DocSchema>;

// System schema
export const SystemSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string().optional(),
  ip: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  owners: z.array(OwnerSchema).optional(),
  docs: z.array(DocSchema).optional(),
  status: z.record(EnvSchema, HealthStatusSchema).optional(),
  x: z.number().optional(),
  y: z.number().optional(),
});
export type System = z.infer<typeof SystemSchema>;

// Connection schema
export const ConnectionSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
  protocol: z.string().optional(),
  endpoint: z.string().optional(),
  port: z.number().optional(),
  credentialAlias: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  owners: z.array(OwnerSchema).optional(),
  docs: z.array(DocSchema).optional(),
  status: z.record(EnvSchema, HealthStatusSchema).optional(),
});
export type Connection = z.infer<typeof ConnectionSchema>;

// Journey schema
export const JourneySchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string().optional(),
  description: z.string().optional(),
  connections: z.array(z.string()),
  systems: z.array(z.string()).optional(),
  owners: z.array(OwnerSchema).optional(),
  docs: z.array(DocSchema).optional(),
  tags: z.array(z.string()).optional(),
});
export type Journey = z.infer<typeof JourneySchema>;

// Systems collection
export const SystemsCollectionSchema = z.object({
  systems: z.array(SystemSchema),
});
export type SystemsCollection = z.infer<typeof SystemsCollectionSchema>;

// Connections collection
export const ConnectionsCollectionSchema = z.object({
  connections: z.array(ConnectionSchema),
});
export type ConnectionsCollection = z.infer<typeof ConnectionsCollectionSchema>;

// Journey list item (for API responses)
export const JourneyListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string().optional(),
  path: z.string(),
  tags: z.array(z.string()).optional(),
});
export type JourneyListItem = z.infer<typeof JourneyListItemSchema>;

// Journey list response
export const JourneyListResponseSchema = z.object({
  items: z.array(JourneyListItemSchema),
});
export type JourneyListResponse = z.infer<typeof JourneyListResponseSchema>;
