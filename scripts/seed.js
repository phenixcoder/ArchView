const fs = require('fs/promises');
const path = require('path');

const sampleSystems = {
  systems: [
    {
      id: 'web',
      name: 'Web Frontend',
      domain: 'app.example.com',
      description: 'Customer-facing web application',
      tags: ['frontend', 'customer'],
      owners: [{ name: 'Frontend Team', email: 'frontend@example.com' }],
      docs: [{ title: 'Web App Docs', url: 'https://docs.example.com/web' }],
      status: { dev: 'healthy', stage: 'healthy', prod: 'healthy' },
    },
    {
      id: 'bff',
      name: 'Backend for Frontend',
      domain: 'bff.example.com',
      description: 'API gateway for web clients',
      tags: ['backend', 'api'],
      owners: [{ name: 'API Team', email: 'api@example.com' }],
      docs: [{ title: 'BFF API Docs', url: 'https://docs.example.com/bff' }],
      status: { dev: 'healthy', stage: 'degraded', prod: 'healthy' },
    },
    {
      id: 'auth',
      name: 'Auth Service',
      domain: 'auth.example.com',
      description: 'Authentication and authorization service',
      tags: ['backend', 'security'],
      owners: [{ name: 'Security Team', email: 'security@example.com' }],
      docs: [{ title: 'Auth Service Docs', url: 'https://docs.example.com/auth' }],
      status: { dev: 'healthy', stage: 'healthy', prod: 'healthy' },
    },
    {
      id: 'core',
      name: 'Core Service',
      domain: 'core.example.com',
      description: 'Core business logic service',
      tags: ['backend', 'core'],
      owners: [{ name: 'Platform Team', email: 'platform@example.com' }],
      docs: [{ title: 'Core Service Docs', url: 'https://docs.example.com/core' }],
      status: { dev: 'healthy', stage: 'healthy', prod: 'healthy' },
    },
    {
      id: 'db',
      name: 'Database',
      domain: 'db.example.com',
      description: 'Primary PostgreSQL database',
      tags: ['data', 'storage'],
      owners: [{ name: 'Data Team', email: 'data@example.com' }],
      docs: [{ title: 'Database Schema', url: 'https://docs.example.com/db' }],
      status: { dev: 'healthy', stage: 'healthy', prod: 'healthy' },
    },
    {
      id: 'mq',
      name: 'Message Queue',
      domain: 'mq.example.com',
      description: 'RabbitMQ message broker',
      tags: ['messaging', 'events'],
      owners: [{ name: 'Platform Team', email: 'platform@example.com' }],
      docs: [{ title: 'MQ Docs', url: 'https://docs.example.com/mq' }],
      status: { dev: 'healthy', stage: 'healthy', prod: 'degraded' },
    },
    {
      id: 'pay',
      name: 'Payment Service',
      domain: 'pay.example.com',
      description: 'Payment processing service',
      tags: ['backend', 'payments'],
      owners: [{ name: 'Payments Team', email: 'payments@example.com' }],
      docs: [{ title: 'Payment Service Docs', url: 'https://docs.example.com/pay' }],
      status: { dev: 'healthy', stage: 'healthy', prod: 'healthy' },
    },
  ],
};

const sampleConnections = {
  connections: [
    {
      id: 'c1',
      from: 'web',
      to: 'bff',
      label: 'HTTPS API Calls',
      protocol: 'HTTPS',
      endpoint: '/api/v1',
      port: 443,
      tags: ['api', 'core'],
      credentialAlias: 'web-to-bff-api-key',
      status: { dev: 'healthy', stage: 'healthy', prod: 'healthy' },
    },
    {
      id: 'c2',
      from: 'bff',
      to: 'auth',
      label: 'Auth Validation',
      protocol: 'HTTPS',
      endpoint: '/validate',
      port: 443,
      tags: ['auth', 'security'],
      credentialAlias: 'bff-to-auth-jwt',
      status: { dev: 'healthy', stage: 'degraded', prod: 'healthy' },
    },
    {
      id: 'c3',
      from: 'bff',
      to: 'core',
      label: 'Business Logic',
      protocol: 'gRPC',
      endpoint: 'core.CoreService',
      port: 50051,
      tags: ['core'],
      credentialAlias: 'bff-to-core-mtls',
      status: { dev: 'healthy', stage: 'healthy', prod: 'healthy' },
    },
    {
      id: 'c4',
      from: 'core',
      to: 'db',
      label: 'Database Queries',
      protocol: 'PostgreSQL',
      port: 5432,
      tags: ['data', 'core'],
      credentialAlias: 'core-to-db-credentials',
      status: { dev: 'healthy', stage: 'healthy', prod: 'healthy' },
    },
    {
      id: 'c5',
      from: 'core',
      to: 'mq',
      label: 'Publish Events',
      protocol: 'AMQP',
      port: 5672,
      tags: ['events', 'messaging'],
      credentialAlias: 'core-to-mq-credentials',
      status: { dev: 'healthy', stage: 'healthy', prod: 'degraded' },
    },
    {
      id: 'c6',
      from: 'bff',
      to: 'pay',
      label: 'Payment Processing',
      protocol: 'HTTPS',
      endpoint: '/process',
      port: 443,
      tags: ['payments'],
      credentialAlias: 'bff-to-pay-api-key',
      status: { dev: 'healthy', stage: 'healthy', prod: 'healthy' },
    },
  ],
};

const sampleJourneys = [
  {
    path: 'commerce/checkout/guest.journey.json',
    data: {
      id: 'commerce/checkout/guest',
      name: 'Guest Checkout',
      label: '🛒 Guest Checkout',
      description: 'Anonymous user purchases without creating an account',
      connections: ['c1', 'c2', 'c3', 'c4'],
      tags: ['p0', 'revenue', 'commerce'],
      owners: [{ name: 'Checkout PM', email: 'checkout@example.com' }],
      docs: [{ title: 'Guest Checkout Flow', url: 'https://docs.example.com/guest-checkout' }],
    },
  },
  {
    path: 'commerce/payments/card-auth-capture.journey.json',
    data: {
      id: 'commerce/payments/card-auth-capture',
      name: 'Card Auth & Capture Flow',
      label: '💳 Card Payment',
      description: 'Credit card authorization and capture process',
      connections: ['c1', 'c2', 'c6', 'c3'],
      tags: ['payments', 'p0'],
      owners: [{ name: 'Payments Lead', email: 'payments@example.com' }],
      docs: [{ title: 'Payment Processing', url: 'https://docs.example.com/payments' }],
    },
  },
  {
    path: 'platform/events/order-placed.journey.json',
    data: {
      id: 'platform/events/order-placed',
      name: 'Order Placed Event',
      label: '📦 Order Event',
      description: 'System behavior when an order is placed',
      connections: ['c3', 'c4', 'c5'],
      tags: ['events', 'p1'],
      owners: [{ name: 'Platform Team', email: 'platform@example.com' }],
      docs: [{ title: 'Event Architecture', url: 'https://docs.example.com/events' }],
    },
  },
];

async function seedSamples(root) {
  try {
    // Create directories
    await fs.mkdir(root, { recursive: true });
    await fs.mkdir(path.join(root, 'journeys/commerce/checkout'), { recursive: true });
    await fs.mkdir(path.join(root, 'journeys/commerce/payments'), { recursive: true });
    await fs.mkdir(path.join(root, 'journeys/platform/events'), { recursive: true });

    // Write systems.json
    await fs.writeFile(
      path.join(root, 'systems.json'),
      JSON.stringify(sampleSystems, null, 2),
      'utf-8'
    );

    // Write connections.json
    await fs.writeFile(
      path.join(root, 'connections.json'),
      JSON.stringify(sampleConnections, null, 2),
      'utf-8'
    );

    // Write journey files
    for (const journey of sampleJourneys) {
      await fs.writeFile(
        path.join(root, 'journeys', journey.path),
        JSON.stringify(journey.data, null, 2),
        'utf-8'
      );
    }

    console.log(`✅ Sample data seeded to ${root}`);
  } catch (error) {
    console.error('❌ Failed to seed sample data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const dataRoot = process.env.DATA_ROOT || path.join(process.cwd(), 'data');
  seedSamples(dataRoot)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedSamples };
