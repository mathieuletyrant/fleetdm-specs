"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var zod_to_openapi_1 = require("@asteasolutions/zod-to-openapi");
var activity_1 = require("./schemas/activity");
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
// Create OpenAPI registry
var registry = new zod_to_openapi_1.OpenAPIRegistry();
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
    description: "Returns a list of the activities that have been performed in Fleet.\n\nFor a comprehensive list of activity types and detailed information, please see the [audit logs](https://fleetdm.com/docs/using-fleet/audit-activities) page.",
    tags: ['Activities'],
    security: [{ BearerAuth: [] }],
    request: {
        query: activity_1.ListActivitiesQuerySchema,
    },
    responses: {
        200: {
            description: 'Successfully retrieved activities',
            content: {
                'application/json': {
                    schema: activity_1.ListActivitiesResponseSchema,
                },
            },
        },
        401: {
            description: 'Unauthorized - Invalid or missing authentication token',
        },
    },
});
// Generate OpenAPI documentation
var generator = new zod_to_openapi_1.OpenApiGeneratorV31(registry.definitions);
var openApiDocument = generator.generateDocument({
    openapi: '3.1.0',
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
var outputPath = path.join(__dirname, '..', 'openapi.json');
fs.writeFileSync(outputPath, JSON.stringify(openApiDocument, null, 2));
console.log('✓ OpenAPI spec generated successfully!');
console.log("  - File: ".concat(outputPath));
console.log("  - OpenAPI Version: ".concat(openApiDocument.openapi));
console.log("  - Paths: ".concat(Object.keys(openApiDocument.paths || {}).length));
console.log("  - Schemas: ".concat(Object.keys(((_a = openApiDocument.components) === null || _a === void 0 ? void 0 : _a.schemas) || {}).length));
