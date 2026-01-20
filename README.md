# FleetDM OpenAPI Spec Generator

Generate OpenAPI 3.1 specifications for the FleetDM REST API using **Zod** schemas and **@asteasolutions/zod-to-openapi**.

## Overview

This project uses [Zod](https://github.com/colinhacks/zod) for schema validation and [@asteasolutions/zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi) to automatically generate OpenAPI 3.1 specifications. This approach provides:

- ✅ **Type-safe schemas** with TypeScript
- ✅ **Runtime validation** using Zod
- ✅ **Automatic OpenAPI generation** from schemas
- ✅ **Single source of truth** for data structures
- ✅ **Mock API endpoints** for testing

## Current Scope

- **Authentication routes excluded** (per requirements)
- **Activities section implemented** (List activities endpoint)
- **OpenAPI 3.1.0** specification generated

## Project Structure

```
fleetdm-specs/
├── src/
│   ├── schemas/
│   │   └── activity.ts              # Zod schemas for Activities
│   ├── routes/
│   │   └── activities.ts            # Express routes with validation
│   ├── generate-openapi.ts          # OpenAPI spec generator
│   └── server.ts                    # Express server
├── openapi.json                     # Generated OpenAPI 3.1 spec
├── tsconfig.json                    # TypeScript configuration
└── package.json                     # Dependencies and scripts
```

## Installation

```bash
npm install
```

## Usage

### Generate OpenAPI Spec

```bash
npm run generate
```

Output:
- `openapi.json` - OpenAPI 3.1.0 specification

### Build the Project

```bash
npm run build
```

Compiles TypeScript to JavaScript in the `dist/` directory.

### Run the API Server

```bash
npm start
```

The server starts on `http://localhost:3000` with:
- `GET /health` - Health check
- `GET /api/v1/fleet/activities` - List activities with query parameters

### Development Mode

```bash
npm run dev
```

Runs with `ts-node` for development.

## OpenAPI Specification

The generated `openapi.json` contains:

- **OpenAPI Version**: 3.1.0
- **Authentication**: Bearer token (JWT)
- **Endpoints**: Activities (GET /api/v1/fleet/activities)
- **Schemas**: Activity, ActivityDetails, Meta, ListActivitiesResponse

### Endpoint: List Activities

**GET** `/api/v1/fleet/activities`

**Query Parameters:**
- `page` (integer) - Page number
- `per_page` (integer) - Results per page
- `order_key` (string) - Column to order by
- `order_direction` (enum: asc|desc) - Sort direction
- `query` (string) - Search keywords
- `activity_type` (string) - Filter by activity type
- `start_created_at` (datetime) - Filter after date
- `end_created_at` (datetime) - Filter before date

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/v1/fleet/activities?page=0&per_page=10&order_direction=desc"
```

**Response (200):**
```json
{
  "activities": [
    {
      "created_at": "2023-07-27T14:35:08Z",
      "id": 25,
      "actor_full_name": "Anna Chao",
      "type": "installed_software",
      "fleet_initiated": false,
      "details": {
        "status": "installed",
        "host_id": 1272,
        "software_title": "zoom.us.app"
      }
    }
  ],
  "meta": {
    "has_next_results": false,
    "has_previous_results": false
  }
}
```

## Adding More Endpoints

To add more FleetDM endpoints:

### 1. Create Zod Schemas

```typescript
// src/schemas/host.ts
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const HostSchema = z.object({
  id: z.number().int(),
  hostname: z.string(),
  // ... more fields
}).openapi('Host');
```

### 2. Register in OpenAPI Generator

```typescript
// src/generate-openapi.ts
import { HostSchema } from './schemas/host';

registry.registerPath({
  method: 'get',
  path: '/api/v1/fleet/hosts',
  summary: 'List hosts',
  tags: ['Hosts'],
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: 'Success',
      content: {
        'application/json': {
          schema: z.object({
            hosts: z.array(HostSchema),
          }),
        },
      },
    },
  },
});
```

### 3. Create Express Route

```typescript
// src/routes/hosts.ts
import { Router } from 'express';
import { HostSchema } from '../schemas/host';

const router = Router();

router.get('/hosts', async (req, res) => {
  // Implementation with Zod validation
});

export { router as hostsRouter };
```

### 4. Regenerate

```bash
npm run generate
```

## Why Zod + zod-to-openapi?

| Feature | Zod + zod-to-openapi | TSOA |
|---------|---------------------|------|
| Runtime validation | ✅ Built-in | ⚠️ Requires additional setup |
| Type safety | ✅ Excellent | ✅ Excellent |
| OpenAPI generation | ✅ Direct from schemas | ✅ From decorators |
| Learning curve | ✅ Simple | ⚠️ Steeper |
| Bundle size | ✅ Smaller | ❌ Larger |
| Flexibility | ✅ High | ⚠️ Framework-specific |

## Dependencies

- **express**: ^5.0.0 - Web framework
- **zod**: ^3.23.8 - Schema validation
- **@asteasolutions/zod-to-openapi**: ^7.1.2 - OpenAPI generation
- **typescript**: ^5.6.3 - TypeScript compiler
- **ts-node**: ^10.9.2 - TypeScript execution

## Requirements Met

✅ Generate OpenAPI 3.1 specs for FleetDM REST API  
✅ Exclude authentication routes  
✅ Parse Activities section  
✅ Use TypeScript and Express 5  
✅ Use Zod + zod-to-openapi instead of TSOA  

## License

MIT
