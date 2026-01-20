import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  CreateFleetMaintainedAppRequestSchema,
  CreateFleetMaintainedAppResponseSchema
} from '../schemas/software';

export function registerSoftwareRoutes(registry: OpenAPIRegistry) {
  // Register the POST /api/v1/fleet/software/fleet_maintained_apps endpoint
  registry.registerPath({
    method: 'post',
    path: '/api/v1/fleet/software/fleet_maintained_apps',
    summary: 'Create Fleet-maintained app',
    description: `Add Fleet-maintained app so it's available for install.

**Experimental feature.** This feature is undergoing rapid improvement, which may result in breaking changes to the API or configuration surface. It is not recommended for use in automated workflows.

_Available in Fleet Premium._

Only one of \`labels_include_any\` or \`labels_exclude_any\` can be specified. If neither are specified, all hosts are targeted.

Add the \`X-Fleet-Scripts-Encoded: base64\` header line to parse \`install_script\`, \`uninstall_script\`, \`post_install_script\`, and \`pre_install_query\` fields as base64-encoded rather than as-is.`,
    tags: ['Software'],
    security: [{ BearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateFleetMaintainedAppRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Successfully created Fleet-maintained app',
        content: {
          'application/json': {
            schema: CreateFleetMaintainedAppResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized - Invalid or missing authentication token',
      },
      402: {
        description: 'Payment required - Fleet Premium license required',
      },
    },
  });
}
