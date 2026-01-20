import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { 
  ListActivitiesQuerySchema, 
  ListActivitiesResponseSchema 
} from './schemas/activity';
import * as fs from 'fs';
import * as path from 'path';

// Create OpenAPI registry
const registry = new OpenAPIRegistry();

// Register Bearer Auth security scheme
registry.registerComponent('securitySchemes', 'BearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'API token authentication. Get your token from My Account > Get API token in the Fleet UI.',
});

// Register the GET /api/v1/fleet/activities endpoint
registry.registerPath({
  method: 'get',
  path: '/api/v1/fleet/activities',
  summary: 'List activities',
  description: `Returns a list of the activities that have been performed in Fleet.

For a comprehensive list of activity types and detailed information, please see the [audit logs](https://fleetdm.com/docs/using-fleet/audit-activities) page.`,
  tags: ['Activities'],
  security: [{ BearerAuth: [] }],
  request: {
    query: ListActivitiesQuerySchema,
  },
  responses: {
    200: {
      description: 'Successfully retrieved activities',
      content: {
        'application/json': {
          schema: ListActivitiesResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized - Invalid or missing authentication token',
    },
  },
});

// Generate OpenAPI documentation
const generator = new OpenApiGeneratorV3(registry.definitions);

const openApiDocument = generator.generateDocument({
  openapi: '3.0.3',
  info: {
    title: 'Fleet REST API',
    version: '1.0.0',
    description: 'REST API for Fleet device management platform',
    contact: {
      name: 'Fleet',
      url: 'https://fleetdm.com',
    },
  },
  servers: [
    {
      url: 'https://fleet.example.com',
      description: 'Fleet server',
    },
  ],
});

// Write to file
const outputPath = path.join(__dirname, '..', 'openapi.json');
fs.writeFileSync(outputPath, JSON.stringify(openApiDocument, null, 2));

console.log('✓ OpenAPI spec generated successfully!');
console.log(`  - File: ${outputPath}`);
console.log(`  - OpenAPI Version: ${openApiDocument.openapi}`);
console.log(`  - Paths: ${Object.keys(openApiDocument.paths || {}).length}`);
console.log(`  - Schemas: ${Object.keys(openApiDocument.components?.schemas || {}).length}`);
