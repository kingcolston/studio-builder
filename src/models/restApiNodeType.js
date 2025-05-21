import baseNodeType from './baseNodeType';

/**
 * REST API node type configuration
 * This node makes HTTP requests to REST APIs
 */
export default {
  ...baseNodeType,
  
  // Basic properties
  type: 'restApi',
  label: 'REST API',
  icon: 'fas fa-globe',
  description: 'Makes HTTP requests to REST APIs',
  
  // Connection points
  hasInput: true,
  hasOutput: true,
  
  // Default node attributes
  defaultNodeAttributes: {
    requestSchema: '',
    responseSchema: '',
    requestMethod: 'GET',
    requestUrl: '',
    requestHeaders: {},
    requestBody: {}
  },
  
  // Default values
  defaultConfig: {
    // REST API node specific configuration
    url: '',
    method: 'GET',
    headers: {},
    body: '',
    responseMapping: '',
    timeout: 30000,
    retries: 0
  },
  
  // UI display options
  color: 'rgba(108, 117, 125, 0.1)',
  borderColor: '#6c757d',
  
  // Validation rules
  validate: (node) => {
    const errors = [];
    
    if (!node.config.url) {
      errors.push('URL is required');
    }
    
    if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(node.config.method)) {
      errors.push('Invalid HTTP method');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },
  
  // Custom methods
  methods: {
    // REST API node specific methods
    execute: (node, context) => {
      // Logic to execute a REST API call
      // This would be implemented in the runtime engine
      return {
        success: true,
        result: {}
      };
    },
    
    // Helper method to parse the response
    parseResponse: (response, mapping) => {
      // Logic to parse the response based on the mapping
      return {};
    }
  },
  
  // Form fields for the node properties panel
  formFields: [
    // Config fields
    {
      name: 'url',
      label: 'URL',
      type: 'text',
      required: true,
      placeholder: 'https://api.example.com/endpoint'
    },
    {
      name: 'method',
      label: 'HTTP Method',
      type: 'select',
      options: [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'DELETE', label: 'DELETE' },
        { value: 'PATCH', label: 'PATCH' }
      ],
      required: true
    },
    {
      name: 'headers',
      label: 'Headers (JSON)',
      type: 'text',
      required: false,
      placeholder: '{"Content-Type": "application/json"}'
    },
    {
      name: 'body',
      label: 'Request Body (JSON)',
      type: 'text',
      required: false,
      placeholder: '{"key": "value"}',
      showWhen: (config) => ['POST', 'PUT', 'PATCH'].includes(config.method)
    },
    {
      name: 'responseMapping',
      label: 'Response Mapping',
      type: 'text',
      required: false,
      placeholder: 'data.result'
    },
    {
      name: 'timeout',
      label: 'Timeout (ms)',
      type: 'number',
      required: false,
      placeholder: '30000'
    },
    {
      name: 'retries',
      label: 'Retries',
      type: 'number',
      required: false,
      placeholder: '0'
    },
    
    // Node attribute fields
    {
      name: 'nodeAttributes.requestSchema',
      label: 'Request Schema',
      type: 'text',
      required: false,
      placeholder: 'JSON schema for request validation'
    },
    {
      name: 'nodeAttributes.responseSchema',
      label: 'Response Schema',
      type: 'text',
      required: false,
      placeholder: 'JSON schema for response validation'
    },
    {
      name: 'nodeAttributes.requestMethod',
      label: 'Request Method',
      type: 'select',
      options: [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'DELETE', label: 'DELETE' },
        { value: 'PATCH', label: 'PATCH' }
      ],
      required: false
    },
    {
      name: 'nodeAttributes.requestUrl',
      label: 'Request URL',
      type: 'text',
      required: false,
      placeholder: 'https://api.example.com/endpoint'
    },
    {
      name: 'nodeAttributes.requestHeaders',
      label: 'Request Headers',
      type: 'key-value',
      required: false,
      placeholder: 'Add key-value pairs for request headers'
    },
    {
      name: 'nodeAttributes.requestBody',
      label: 'Request Body',
      type: 'key-value',
      required: false,
      placeholder: 'Add key-value pairs for request body'
    }
  ]
};
