#!/usr/bin/env node

/**
 * FleetDM REST API to OpenAPI 3.1 Converter
 * 
 * This script parses the FleetDM REST API markdown documentation and generates
 * an OpenAPI 3.1 specification in YAML/JSON format.
 * 
 * Current scope: Activities section only (Authentication routes excluded)
 */

const fs = require('fs');
const yaml = require('yaml');

class FleetAPIParser {
  constructor(markdownContent) {
    this.content = markdownContent;
    this.lines = markdownContent.split('\n');
    this.openapi = {
      openapi: '3.1.0',
      info: {
        title: 'Fleet REST API',
        description: 'REST API for Fleet device management platform',
        version: '1.0.0',
        contact: {
          name: 'Fleet',
          url: 'https://fleetdm.com'
        }
      },
      servers: [
        {
          url: 'https://fleet.example.com',
          description: 'Fleet server'
        }
      ],
      security: [
        { BearerAuth: [] }
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'API token authentication. Get your token from My Account > Get API token in the Fleet UI.'
          }
        },
        schemas: {},
        responses: {}
      },
      paths: {}
    };
    this.currentSection = null;
    this.currentTags = [];
  }

  parse() {
    this.parseDocument();
    return this.openapi;
  }

  parseDocument() {
    let i = 0;
    while (i < this.lines.length) {
      const line = this.lines[i];

      // Detect main sections (## header)
      if (line.startsWith('## ') && !line.startsWith('###')) {
        const sectionName = line.substring(3).trim();
        this.currentSection = sectionName;
        this.currentTags = [sectionName];
        
        // Skip Authentication section entirely
        if (sectionName === 'Authentication') {
          console.log(`Skipping section: ${sectionName}`);
          // Skip until next ## section
          i++;
          while (i < this.lines.length && !this.lines[i].startsWith('## ')) {
            i++;
          }
          continue;
        }
        
        // Only parse Activities section for now
        if (sectionName !== 'Activities') {
          console.log(`Skipping section: ${sectionName} (not Activities)`);
          i++;
          while (i < this.lines.length && !this.lines[i].startsWith('## ')) {
            i++;
          }
          continue;
        }
        
        console.log(`Parsing section: ${sectionName}`);
        i++;
        continue;
      }

      // Detect endpoints (### header)
      if (line.startsWith('### ')) {
        const endpointName = line.substring(4).trim();
        i = this.parseEndpoint(i, endpointName);
        continue;
      }

      i++;
    }
  }

  parseEndpoint(startIdx, endpointName) {
    let i = startIdx + 1;
    let descriptionLines = [];
    let httpMethod = null;
    let path = null;
    let parameters = [];
    let requestBody = null;
    let responses = {};

    console.log(`  Parsing endpoint: ${endpointName}`);

    // Parse endpoint content
    while (i < this.lines.length) {
      const line = this.lines[i].trim();

      // Debug: log progress
      if (endpointName.includes('List activities') && i >= 515 && i <= 525) {
        console.log(`    Loop iteration i=${i}, line="${line}"`);
      }

      // Stop at next endpoint or section
      if (line.startsWith('### ') || (line.startsWith('## ') && !line.startsWith('###'))) {
        break;
      }

      // Capture description before method
      if (!httpMethod && line && !line.startsWith('`') && !line.startsWith('####')) {
        if (!line.startsWith('|') && !line.startsWith('-') && !line.startsWith('>')) {
          descriptionLines.push(line);
        }
      }

      // Detect HTTP method and path pattern like `POST /api/v1/fleet/login`
      const methodMatch = line.match(/^`(GET|POST|PUT|PATCH|DELETE|HEAD)\s+([^`]+)`/);
      if (methodMatch) {
        httpMethod = methodMatch[1].toLowerCase();
        path = methodMatch[2];
        // Convert :param to {param} for OpenAPI
        path = path.replace(/:(\w+)/g, '{$1}');
        console.log(`    Method: ${httpMethod.toUpperCase()} ${path}`);
        i++;
        continue;
      }

      // Parse parameters section
      if (line === '#### Parameters') {
        console.log(`    Found Parameters section at line ${i}`);
        const result = this.parseParametersTable(i + 1);
        i = result.nextIdx;
        parameters = result.parameters;
        console.log(`    Found ${parameters.length} parameters, next i=${i}`);
        continue;
      }

      // Parse example section with request/response
      if (endpointName.includes('List activities') && line.startsWith('####')) {
        console.log(`    Checking if "${line}" === "#### Example": ${line === '#### Example'}`);
      }
      if (line === '#### Example') {
        console.log(`    Found Example section at line ${i}`);
        const result = this.parseExampleSection(i + 1);
        i = result.nextIdx;
        requestBody = result.requestBody;
        responses = result.responses;
        console.log(`    Found ${Object.keys(responses).length} response(s)`);
        continue;
      }

      i++;
    }

    // Add endpoint to spec if we found method and path
    if (httpMethod && path) {
      const description = descriptionLines.join(' ').trim();
      this.addEndpoint(path, httpMethod, endpointName, description, parameters, requestBody, responses);
    }

    return i;
  }

  parseParametersTable(startIdx) {
    let i = startIdx;
    const parameters = [];

    // Skip empty lines
    while (i < this.lines.length && !this.lines[i].trim()) {
      i++;
    }

    if (i >= this.lines.length) {
      return { nextIdx: i, parameters };
    }

    // Skip table header and separator
    if (this.lines[i].includes('|')) {
      i++; // Skip header
      if (i < this.lines.length && this.lines[i].includes('|') && this.lines[i].includes('-')) {
        i++; // Skip separator
      }
    }

    // Parse table rows
    while (i < this.lines.length) {
      const line = this.lines[i].trim();

      // Stop at empty line or next section
      if (!line || line.startsWith('#') || !line.startsWith('|')) {
        break;
      }

      // Parse table row
      if (line.startsWith('|')) {
        const parts = line.split('|').slice(1, -1).map(p => p.trim());
        if (parts.length >= 4) {
          const name = parts[0];
          const paramType = parts[1];
          const location = parts[2];
          const desc = parts[3];

          // Determine if required
          const required = desc.includes('**Required**') || desc.includes('Required.');

          const param = {
            name,
            in: ['query', 'path', 'header', 'cookie'].includes(location) ? location : 'query',
            description: desc.replace(/\*\*Required\*\*\.?\s*/g, ''),
            required,
            schema: this.convertType(paramType)
          };

          // Handle body parameters separately
          if (location === 'body') {
            param._bodyParam = true;
            param._type = paramType;
          }

          parameters.push(param);
        }
      }

      i++;
    }

    return { nextIdx: i, parameters };
  }

  parseExampleSection(startIdx) {
    let i = startIdx;
    let requestBody = null;
    const responses = {};

    while (i < this.lines.length) {
      const line = this.lines[i].trim();

      // Stop at next section
      if (line.startsWith('###')) {
        break;
      }

      // Parse request body
      if (line.startsWith('##### Request body') || line.startsWith('##### Request query parameters')) {
        const result = this.parseJsonBlock(i + 1);
        i = result.nextIdx;
        requestBody = result.jsonObj;
        continue;
      }

      // Parse responses
      if (line.startsWith('#####') && line.toLowerCase().includes('response')) {
        const responseName = line.substring(6).trim();
        const result = this.parseResponseBlock(i + 1);
        i = result.nextIdx;
        if (result.statusCode) {
          responses[result.statusCode] = result.responseData;
        }
        continue;
      }

      i++;
    }

    return { nextIdx: i, requestBody, responses };
  }

  parseJsonBlock(startIdx) {
    let i = startIdx;
    const jsonLines = [];
    let inCodeBlock = false;

    while (i < this.lines.length) {
      const line = this.lines[i];

      // Skip leading blank lines before code block
      if (!inCodeBlock && !line.trim()) {
        i++;
        continue;
      }

      if (line.trim().startsWith('```json') || line.trim().startsWith('```')) {
        if (inCodeBlock) {
          // End of code block
          break;
        } else {
          // Start of code block
          inCodeBlock = true;
          i++;
          continue;
        }
      }

      if (inCodeBlock) {
        jsonLines.push(line);
      } else if (line.trim().startsWith('#####') || line.trim().startsWith('####')) {
        // Next section
        break;
      }

      i++;
    }

    // Try to parse JSON
    let jsonObj = null;
    if (jsonLines.length > 0) {
      try {
        const jsonStr = jsonLines.join('\n');
        jsonObj = JSON.parse(jsonStr);
      } catch (e) {
        // Ignore parse errors
      }
    }

    return { nextIdx: i + 1, jsonObj };
  }

  parseResponseBlock(startIdx) {
    let i = startIdx;
    let statusCode = null;
    let responseBody = null;
    let description = '';

    // Look for status code (skip blank lines)
    while (i < this.lines.length) {
      const line = this.lines[i].trim();

      // Skip blank lines
      if (!line) {
        i++;
        continue;
      }

      // Parse status code like `Status: 200`
      const statusMatch = line.match(/^`Status:\s*(\d+)/);
      if (statusMatch) {
        statusCode = statusMatch[1];
        i++;
        break;
      }

      // Check if we hit a JSON block without a status code (default to 200)
      if (line.startsWith('```json') || line.startsWith('```')) {
        statusCode = '200'; // Default status code
        break;
      }

      // Stop at next section
      if (line.startsWith('#####') || line.startsWith('####')) {
        break;
      }

      description += line + ' ';
      i++;
    }

    // Parse response body
    const jsonResult = this.parseJsonBlock(i);
    i = jsonResult.nextIdx;
    responseBody = jsonResult.jsonObj;

    // If still no status code and we have a response body, default to 200
    if (!statusCode && responseBody) {
      statusCode = '200';
    }

    const responseData = {
      description: description.trim() || `Response with status ${statusCode}`,
      content: {}
    };

    if (responseBody) {
      responseData.content['application/json'] = {
        schema: this.inferSchemaFromExample(responseBody)
      };
    }

    return { nextIdx: i, statusCode, responseData };
  }

  convertType(typeStr) {
    const type = typeStr.toLowerCase().trim();

    const typeMapping = {
      'string': { type: 'string' },
      'integer': { type: 'integer' },
      'int': { type: 'integer' },
      'number': { type: 'number' },
      'boolean': { type: 'boolean' },
      'bool': { type: 'boolean' },
      'object': { type: 'object' },
      'array': { type: 'array', items: {} },
      'list': { type: 'array', items: {} }
    };

    return typeMapping[type] || { type: 'string' };
  }

  inferSchemaFromExample(example) {
    if (Array.isArray(example)) {
      if (example.length > 0) {
        return {
          type: 'array',
          items: this.inferSchemaFromExample(example[0])
        };
      } else {
        return { type: 'array', items: {} };
      }
    } else if (typeof example === 'object' && example !== null) {
      const properties = {};
      for (const [key, value] of Object.entries(example)) {
        properties[key] = this.inferSchemaFromExample(value);
      }
      return {
        type: 'object',
        properties
      };
    } else if (typeof example === 'boolean') {
      return { type: 'boolean' };
    } else if (typeof example === 'number') {
      return Number.isInteger(example) ? { type: 'integer' } : { type: 'number' };
    } else if (typeof example === 'string') {
      return { type: 'string' };
    } else if (example === null) {
      return { type: 'string', nullable: true };
    } else {
      return { type: 'string' };
    }
  }

  addEndpoint(path, method, summary, description, parameters, requestBody, responses) {
    if (!this.openapi.paths[path]) {
      this.openapi.paths[path] = {};
    }

    // Separate body parameters from other parameters
    const bodyParams = parameters.filter(p => p._bodyParam);
    const otherParams = parameters.filter(p => !p._bodyParam);

    // Build operation object
    const operation = {
      summary,
      description,
      tags: this.currentTags.length > 0 ? this.currentTags : ['General']
    };

    // Add parameters (query, path, header)
    if (otherParams.length > 0) {
      operation.parameters = otherParams.map(p => {
        const param = { ...p };
        delete param._bodyParam;
        delete param._type;
        return param;
      });
    }

    // Add request body
    if (bodyParams.length > 0 || requestBody) {
      let schema;
      if (requestBody) {
        // Build schema from example
        schema = this.inferSchemaFromExample(requestBody);
      } else {
        // Build schema from body parameters
        const properties = {};
        const required = [];
        for (const p of bodyParams) {
          properties[p.name] = this.convertType(p._type || 'string');
          if (p.description) {
            properties[p.name].description = p.description;
          }
          if (p.required) {
            required.push(p.name);
          }
        }

        schema = {
          type: 'object',
          properties
        };
        if (required.length > 0) {
          schema.required = required;
        }
      }

      operation.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema
          }
        }
      };
    }

    // Add responses
    if (Object.keys(responses).length > 0) {
      operation.responses = responses;
    } else {
      // Default response if none provided
      operation.responses = {
        '200': {
          description: 'Successful response'
        }
      };
    }

    this.openapi.paths[path][method] = operation;
  }
}

function main() {
  const inputFile = process.argv[2] || 'rest-api.md';
  const outputFileYaml = process.argv[3] || 'openapi.yaml';
  const outputFileJson = outputFileYaml.replace('.yaml', '.json');

  console.log(`Reading ${inputFile}...`);
  const markdownContent = fs.readFileSync(inputFile, 'utf-8');

  console.log('Parsing markdown...');
  const parser = new FleetAPIParser(markdownContent);
  const openapiSpec = parser.parse();

  console.log(`\nWriting OpenAPI spec to ${outputFileYaml}...`);
  fs.writeFileSync(outputFileYaml, yaml.stringify(openapiSpec));

  console.log(`Writing OpenAPI spec to ${outputFileJson}...`);
  fs.writeFileSync(outputFileJson, JSON.stringify(openapiSpec, null, 2));

  console.log(`\n✓ OpenAPI spec generated successfully!`);
  console.log(`  - YAML: ${outputFileYaml}`);
  console.log(`  - JSON: ${outputFileJson}`);
  console.log(`  - Paths found: ${Object.keys(openapiSpec.paths).length}`);
}

if (require.main === module) {
  main();
}

module.exports = { FleetAPIParser };
