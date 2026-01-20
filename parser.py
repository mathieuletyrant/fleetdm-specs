#!/usr/bin/env python3
"""
FleetDM REST API to OpenAPI 3.1 Converter

This script parses the FleetDM REST API markdown documentation and generates
an OpenAPI 3.1 specification in YAML format.
"""

import re
import json
import yaml
from typing import Dict, List, Any, Optional, Tuple
from collections import defaultdict


class FleetAPIParser:
    """Parser for FleetDM REST API markdown documentation."""
    
    def __init__(self, markdown_content: str):
        self.content = markdown_content
        self.lines = markdown_content.split('\n')
        self.openapi_spec = {
            'openapi': '3.1.0',
            'info': {
                'title': 'Fleet REST API',
                'description': 'REST API for Fleet device management platform',
                'version': '1.0.0',
                'contact': {
                    'name': 'Fleet',
                    'url': 'https://fleetdm.com'
                }
            },
            'servers': [
                {
                    'url': 'https://fleet.example.com',
                    'description': 'Fleet server'
                }
            ],
            'security': [
                {'BearerAuth': []}
            ],
            'components': {
                'securitySchemes': {
                    'BearerAuth': {
                        'type': 'http',
                        'scheme': 'bearer',
                        'bearerFormat': 'JWT',
                        'description': 'API token authentication. Get your token from My Account > Get API token in the Fleet UI.'
                    }
                },
                'schemas': {},
                'responses': {}
            },
            'paths': {}
        }
        self.current_section = None
        self.current_tags = []
        
    def parse(self) -> Dict[str, Any]:
        """Parse the markdown and generate OpenAPI spec."""
        self._parse_document()
        return self.openapi_spec
    
    def _parse_document(self):
        """Parse the entire markdown document."""
        i = 0
        while i < len(self.lines):
            line = self.lines[i]
            
            # Detect main sections (## header)
            if line.startswith('## ') and not line.startswith('###'):
                section_name = line[3:].strip()
                self.current_section = section_name
                self.current_tags = [section_name]
                i += 1
                continue
            
            # Detect endpoints (### header followed by HTTP method)
            if line.startswith('### '):
                endpoint_name = line[4:].strip()
                i = self._parse_endpoint(i, endpoint_name)
                continue
            
            i += 1
    
    def _parse_endpoint(self, start_idx: int, endpoint_name: str) -> int:
        """Parse a single endpoint section."""
        i = start_idx + 1
        description_lines = []
        http_method = None
        path = None
        parameters = []
        request_body = None
        responses = {}
        
        # Look for HTTP method and path
        while i < len(self.lines):
            line = self.lines[i].strip()
            
            # Stop at next endpoint or section
            if line.startswith('### ') or (line.startswith('## ') and not line.startswith('###')):
                break
            
            # Capture description before method
            if not http_method and line and not line.startswith('`') and not line.startswith('####'):
                if not line.startswith('|') and not line.startswith('-'):
                    description_lines.append(line)
            
            # Detect HTTP method and path pattern like `POST /api/v1/fleet/login`
            method_match = re.match(r'`(GET|POST|PUT|PATCH|DELETE|HEAD)\s+(/[^`]+)`', line)
            if method_match:
                http_method = method_match.group(1).lower()
                path = method_match.group(2)
                # Convert :param to {param} for OpenAPI
                path = re.sub(r':(\w+)', r'{\1}', path)
                i += 1
                continue
            
            # Parse parameters section
            if line == '#### Parameters':
                i, parameters = self._parse_parameters_table(i + 1)
                continue
            
            # Parse example section with request/response
            if line == '#### Example':
                i, request_body, responses = self._parse_example_section(i + 1, http_method, path)
                continue
            
            i += 1
        
        # Add endpoint to spec if we found method and path
        if http_method and path:
            description = ' '.join(description_lines).strip()
            self._add_endpoint(
                path=path,
                method=http_method,
                summary=endpoint_name,
                description=description,
                parameters=parameters,
                request_body=request_body,
                responses=responses
            )
        
        return i
    
    def _parse_parameters_table(self, start_idx: int) -> Tuple[int, List[Dict]]:
        """Parse parameters from markdown table."""
        i = start_idx
        parameters = []
        
        # Skip empty lines
        while i < len(self.lines) and not self.lines[i].strip():
            i += 1
        
        # Look for table header
        if i >= len(self.lines):
            return i, parameters
        
        # Skip table header and separator
        if '|' in self.lines[i]:
            i += 1  # Skip header
            if i < len(self.lines) and '|' in self.lines[i] and '-' in self.lines[i]:
                i += 1  # Skip separator
        
        # Parse table rows
        while i < len(self.lines):
            line = self.lines[i].strip()
            
            # Stop at empty line or next section
            if not line or line.startswith('#') or (not line.startswith('|')):
                break
            
            # Parse table row
            if line.startswith('|'):
                parts = [p.strip() for p in line.split('|')[1:-1]]  # Remove empty first/last
                if len(parts) >= 4:
                    name = parts[0].strip()
                    param_type = parts[1].strip()
                    location = parts[2].strip()
                    desc = parts[3].strip()
                    
                    # Determine if required
                    required = '**Required**' in desc or 'Required.' in desc
                    
                    param = {
                        'name': name,
                        'in': location if location in ['query', 'path', 'header', 'cookie'] else 'query',
                        'description': desc.replace('**Required**. ', '').replace('**Required**.', ''),
                        'required': required,
                        'schema': self._convert_type(param_type)
                    }
                    
                    # Handle body parameters separately
                    if location == 'body':
                        param['_body_param'] = True
                        param['_type'] = param_type
                    
                    parameters.append(param)
            
            i += 1
        
        return i, parameters
    
    def _parse_example_section(self, start_idx: int, method: str, path: str) -> Tuple[int, Optional[Dict], Dict]:
        """Parse example section with request and response."""
        i = start_idx
        request_body = None
        responses = {}
        
        # Debug
        is_login = path and '/login' in path
        if is_login:
            print(f"DEBUG: _parse_example_section called with path='{path}'")
        
        while i < len(self.lines):
            line = self.lines[i].strip()
            
            if is_login:
                print(f"DEBUG iteration at line {i}: '{line[:50] if line else '(empty)'}'")
            
            # Debug for login endpoint
            if is_login and line and line.startswith('#####'):
                print(f"  -> This is a ##### header")
            
            # Stop at next section
            if line.startswith('###'):
                if is_login:
                    print(f"  -> Breaking because line starts with ###")
                break
            
            # Parse request body
            if is_login:
                if line and line.startswith('#####'):
                    test1 = line.startswith('##### Request body')
                    test2 = line.startswith('##### Request query parameters')
                    print(f"  Line check: '{line}' -> test1={test1}, test2={test2}")
            
            if line.startswith('##### Request body') or line.startswith('##### Request query parameters'):
                if is_login:
                    print(f"  About to parse request body at line {i}")
                new_i, request_body = self._parse_json_block(i + 1)
                if is_login:
                    print(f"  Parsed request body: old_i={i}, new_i={new_i}, request_body={request_body is not None}")
                i = new_i
                continue
            
            # Parse responses (Default response, error responses, etc.)
            if line.startswith('##### ') and 'response' in line.lower():
                response_name = line[6:].strip()
                # Debug: print which response we're parsing
                if is_login:
                    print(f"DEBUG: Parsing response '{response_name}' for {path}")
                i, status_code, response_data = self._parse_response_block(i + 1)
                if is_login:
                    print(f"  -> Got status_code={status_code}, has_content={'content' in response_data}")
                if status_code:
                    responses[status_code] = response_data
                continue
            
            i += 1
        
        if is_login:
            print(f"DEBUG: Total responses for {path}: {len(responses)}")
        return i, request_body, responses
    
    def _parse_json_block(self, start_idx: int) -> Tuple[int, Optional[Dict]]:
        """Parse JSON code block."""
        i = start_idx
        json_lines = []
        in_code_block = False
        
        while i < len(self.lines):
            line = self.lines[i]
            
            # Skip leading blank lines before code block
            if not in_code_block and not line.strip():
                i += 1
                continue
            
            if line.strip().startswith('```json') or line.strip().startswith('```'):
                if in_code_block:
                    # End of code block
                    break
                else:
                    # Start of code block
                    in_code_block = True
                    i += 1
                    continue
            
            if in_code_block:
                json_lines.append(line)
            elif line.strip().startswith('#####') or line.strip().startswith('####'):
                # Next section
                break
            
            i += 1
        
        # Try to parse JSON
        if json_lines:
            try:
                json_str = '\n'.join(json_lines)
                json_obj = json.loads(json_str)
                return i + 1, json_obj
            except json.JSONDecodeError:
                pass
        
        return i, None
    
    def _parse_response_block(self, start_idx: int) -> Tuple[int, Optional[str], Dict]:
        """Parse response block with status code and body."""
        i = start_idx
        status_code = None
        response_body = None
        description = ""
        
        # Look for status code (skip blank lines)
        while i < len(self.lines):
            line = self.lines[i].strip()
            
            # Skip blank lines
            if not line:
                i += 1
                continue
            
            # Parse status code like `Status: 200`
            status_match = re.match(r'`Status:\s*(\d+)`', line)
            if status_match:
                status_code = status_match.group(1)
                i += 1
                break
            
            # Stop at next section
            if line.startswith('#####') or line.startswith('####'):
                break
            
            description += line + " "
            i += 1
        
        # Parse response body
        i, response_body = self._parse_json_block(i)
        
        response_data = {
            'description': description.strip() or f'Response with status {status_code}',
            'content': {}
        }
        
        if response_body:
            response_data['content']['application/json'] = {
                'schema': self._infer_schema_from_example(response_body)
            }
        
        return i, status_code, response_data
    
    def _convert_type(self, type_str: str) -> Dict:
        """Convert markdown type to OpenAPI schema type."""
        type_str = type_str.lower().strip()
        
        type_mapping = {
            'string': {'type': 'string'},
            'integer': {'type': 'integer'},
            'int': {'type': 'integer'},
            'number': {'type': 'number'},
            'boolean': {'type': 'boolean'},
            'bool': {'type': 'boolean'},
            'object': {'type': 'object'},
            'array': {'type': 'array', 'items': {}},
            'list': {'type': 'array', 'items': {}}
        }
        
        return type_mapping.get(type_str, {'type': 'string'})
    
    def _infer_schema_from_example(self, example: Any) -> Dict:
        """Infer OpenAPI schema from JSON example."""
        if isinstance(example, dict):
            properties = {}
            for key, value in example.items():
                properties[key] = self._infer_schema_from_example(value)
            return {
                'type': 'object',
                'properties': properties
            }
        elif isinstance(example, list):
            if example:
                return {
                    'type': 'array',
                    'items': self._infer_schema_from_example(example[0])
                }
            else:
                return {'type': 'array', 'items': {}}
        elif isinstance(example, bool):
            return {'type': 'boolean'}
        elif isinstance(example, int):
            return {'type': 'integer'}
        elif isinstance(example, float):
            return {'type': 'number'}
        elif isinstance(example, str):
            return {'type': 'string'}
        elif example is None:
            return {'type': 'string', 'nullable': True}
        else:
            return {'type': 'string'}
    
    def _add_endpoint(self, path: str, method: str, summary: str, description: str,
                     parameters: List[Dict], request_body: Optional[Dict],
                     responses: Dict):
        """Add endpoint to OpenAPI spec."""
        if path not in self.openapi_spec['paths']:
            self.openapi_spec['paths'][path] = {}
        
        # Separate body parameters from other parameters
        body_params = [p for p in parameters if p.get('_body_param')]
        other_params = [p for p in parameters if not p.get('_body_param')]
        
        # Build operation object
        operation = {
            'summary': summary,
            'description': description,
            'tags': self.current_tags if self.current_tags else ['General']
        }
        
        # Add parameters (query, path, header)
        if other_params:
            clean_params = []
            for p in other_params:
                param = {k: v for k, v in p.items() if not k.startswith('_')}
                clean_params.append(param)
            operation['parameters'] = clean_params
        
        # Add request body
        if body_params or request_body:
            if request_body:
                # Build schema from example
                schema = self._infer_schema_from_example(request_body)
            else:
                # Build schema from body parameters
                properties = {}
                required = []
                for p in body_params:
                    properties[p['name']] = self._convert_type(p.get('_type', 'string'))
                    if 'description' in p:
                        properties[p['name']]['description'] = p['description']
                    if p.get('required'):
                        required.append(p['name'])
                
                schema = {
                    'type': 'object',
                    'properties': properties
                }
                if required:
                    schema['required'] = required
            
            operation['requestBody'] = {
                'required': True,
                'content': {
                    'application/json': {
                        'schema': schema
                    }
                }
            }
        
        # Add responses
        if responses:
            operation['responses'] = responses
        else:
            # Default response if none provided
            operation['responses'] = {
                '200': {
                    'description': 'Successful response'
                }
            }
        
        self.openapi_spec['paths'][path][method] = operation


def main():
    """Main function to parse and generate OpenAPI spec."""
    import sys
    
    # Read markdown file
    input_file = 'rest-api.md'
    output_file = 'openapi.yaml'
    
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    if len(sys.argv) > 2:
        output_file = sys.argv[2]
    
    print(f"Reading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        markdown_content = f.read()
    
    print("Parsing markdown...")
    parser = FleetAPIParser(markdown_content)
    openapi_spec = parser.parse()
    
    print(f"Writing OpenAPI spec to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        yaml.dump(openapi_spec, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
    
    # Also write JSON version
    json_output_file = output_file.replace('.yaml', '.json')
    with open(json_output_file, 'w', encoding='utf-8') as f:
        json.dump(openapi_spec, f, indent=2)
    
    print(f"✓ OpenAPI spec generated successfully!")
    print(f"  - YAML: {output_file}")
    print(f"  - JSON: {json_output_file}")
    print(f"  - Paths found: {len(openapi_spec['paths'])}")


if __name__ == '__main__':
    main()
