"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListActivitiesQuerySchema = exports.ListActivitiesResponseSchema = exports.MetaSchema = exports.ActivitySchema = exports.ActivityDetailsSchema = void 0;
var zod_1 = require("zod");
var zod_to_openapi_1 = require("@asteasolutions/zod-to-openapi");
// Extend Zod with OpenAPI methods
(0, zod_to_openapi_1.extendZodWithOpenApi)(zod_1.z);
/**
 * Activity details schema
 */
exports.ActivityDetailsSchema = zod_1.z.object({
    status: zod_1.z.string().optional().openapi({ description: 'Status of the activity' }),
    host_id: zod_1.z.number().optional().openapi({ description: 'ID of the host' }),
    host_display_name: zod_1.z.string().optional().openapi({ description: 'Display name of the host' }),
    policy_id: zod_1.z.number().nullable().optional().openapi({ description: 'ID of the policy' }),
    policy_name: zod_1.z.string().nullable().optional().openapi({ description: 'Name of the policy' }),
    install_uuid: zod_1.z.string().optional().openapi({ description: 'Installation UUID' }),
    self_service: zod_1.z.boolean().optional().openapi({ description: 'Whether it was self-service' }),
    software_title: zod_1.z.string().optional().openapi({ description: 'Software title' }),
    software_package: zod_1.z.string().optional().openapi({ description: 'Software package name' }),
    team_id: zod_1.z.number().optional().openapi({ description: 'ID of the team' }),
    team_name: zod_1.z.string().optional().openapi({ description: 'Name of the team' }),
}).passthrough().openapi('ActivityDetails', {
    description: 'Activity detail information varies by activity type'
});
/**
 * Single activity schema
 */
exports.ActivitySchema = zod_1.z.object({
    created_at: zod_1.z.string().datetime().openapi({
        description: 'When the activity was created',
        example: '2023-07-27T14:35:08Z'
    }),
    id: zod_1.z.number().int().openapi({ description: 'Unique identifier for the activity' }),
    actor_full_name: zod_1.z.string().optional().openapi({ description: 'Full name of the actor' }),
    actor_id: zod_1.z.number().int().optional().openapi({ description: 'ID of the actor' }),
    actor_gravatar: zod_1.z.string().optional().openapi({ description: 'Gravatar URL of the actor' }),
    actor_email: zod_1.z.string().email().optional().openapi({ description: 'Email of the actor' }),
    type: zod_1.z.string().openapi({
        description: 'Type of activity',
        example: 'installed_software'
    }),
    fleet_initiated: zod_1.z.boolean().openapi({
        description: 'Whether the activity was initiated by Fleet'
    }),
    details: exports.ActivityDetailsSchema,
}).openapi('Activity', {
    description: 'Represents a single activity in Fleet'
});
/**
 * Pagination metadata schema
 */
exports.MetaSchema = zod_1.z.object({
    has_next_results: zod_1.z.boolean().openapi({ description: 'Whether there are more results available' }),
    has_previous_results: zod_1.z.boolean().openapi({ description: 'Whether there are previous results' }),
}).openapi('Meta', {
    description: 'Pagination metadata'
});
/**
 * List activities response schema
 */
exports.ListActivitiesResponseSchema = zod_1.z.object({
    activities: zod_1.z.array(exports.ActivitySchema).openapi({ description: 'Array of activities' }),
    meta: exports.MetaSchema,
}).openapi('ListActivitiesResponse', {
    description: 'Response for list activities endpoint'
});
/**
 * List activities query parameters schema
 */
exports.ListActivitiesQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().optional().openapi({
        description: 'Page number of the results to fetch',
        example: 0
    }),
    per_page: zod_1.z.coerce.number().int().optional().openapi({
        description: 'Results per page',
        example: 10
    }),
    order_key: zod_1.z.string().optional().openapi({
        description: 'What to order results by. Can be any column in the activities table',
        example: 'created_at'
    }),
    order_direction: zod_1.z.enum(['asc', 'desc']).optional().openapi({
        description: 'The direction of the order given the order key. Default is "asc"',
        example: 'desc'
    }),
    query: zod_1.z.string().optional().openapi({
        description: 'Search query keywords. Searchable fields include actor_full_name and actor_email'
    }),
    activity_type: zod_1.z.string().optional().openapi({
        description: 'Indicates the activity type to filter by'
    }),
    start_created_at: zod_1.z.string().datetime().optional().openapi({
        description: 'Filters to include only activities that happened after this date'
    }),
    end_created_at: zod_1.z.string().datetime().optional().openapi({
        description: 'Filters to include only activities that happened before this date. If not specified, set to now'
    }),
}).openapi('ListActivitiesQuery');
