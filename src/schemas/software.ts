import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

// Extend Zod with OpenAPI methods
extendZodWithOpenApi(z);

/**
 * Create Fleet-maintained app request body schema
 */
export const CreateFleetMaintainedAppRequestSchema = z.object({
  fleet_maintained_app_id: z.number().int().openapi({
    description: 'The ID of Fleet-maintained app',
    example: 3
  }),
  team_id: z.number().int().openapi({
    description: 'The team ID. Adds Fleet-maintained app to the specified team',
    example: 2
  }),
  install_script: z.string().optional().openapi({
    description: 'Command that Fleet runs to install software. If not specified Fleet runs default install command for each Fleet-maintained app'
  }),
  pre_install_query: z.string().optional().openapi({
    description: 'Query that is pre-install condition. If the query doesn\'t return any result, Fleet won\'t proceed to install'
  }),
  post_install_script: z.string().optional().openapi({
    description: 'The contents of the script to run after install. If the specified script fails (exit code non-zero) software install will be marked as failed and rolled back'
  }),
  self_service: z.boolean().optional().openapi({
    description: 'Self-service software is optional and can be installed by the end user'
  }),
  labels_include_any: z.array(z.string()).optional().openapi({
    description: 'Target hosts that have any label, specified by label name, in the array'
  }),
  labels_exclude_any: z.array(z.string()).optional().openapi({
    description: 'Target hosts that don\'t have any label, specified by label name, in the array'
  }),
  automatic_install: z.boolean().optional().openapi({
    description: 'Create a policy that triggers a software install only on hosts missing the software'
  }),
}).openapi('CreateFleetMaintainedAppRequest', {
  description: 'Request body for creating a Fleet-maintained app'
});

/**
 * Create Fleet-maintained app response schema
 */
export const CreateFleetMaintainedAppResponseSchema = z.object({
  software_title_id: z.number().int().openapi({
    description: 'The ID of the created software title',
    example: 234
  }),
}).openapi('CreateFleetMaintainedAppResponse', {
  description: 'Response for create Fleet-maintained app endpoint'
});

// TypeScript types derived from schemas
export type CreateFleetMaintainedAppRequest = z.infer<typeof CreateFleetMaintainedAppRequestSchema>;
export type CreateFleetMaintainedAppResponse = z.infer<typeof CreateFleetMaintainedAppResponseSchema>;
