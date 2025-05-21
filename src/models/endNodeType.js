import baseNodeType from './baseNodeType';

/**
 * End node type configuration
 * This node represents the end point of a flow
 */
export default {
  ...baseNodeType,
  
  // Basic properties
  type: 'end',
  label: 'End',
  icon: 'fas fa-stop',
  description: 'Ending point of the flow',
  
  // Connection points
  hasInput: true,
  hasOutput: false,
  
  // Default node attributes
  defaultNodeAttributes: {
    input: [
      { key: 'result', value: 'success' },
      { key: 'outputData', value: '{}' }
    ]
  },
  
  // Default values
  defaultConfig: {
    // End node specific configuration
    outputData: {},
    statusCode: 200,
    endType: 'success' // success, error, terminate
  },
  
  // UI display options
  color: 'rgba(220, 53, 69, 0.1)',
  borderColor: '#dc3545',
  
  // Validation rules
  validate: (node) => {
    const errors = [];
    
    // Add any validation rules specific to end nodes
    
    return {
      valid: errors.length === 0,
      errors
    };
  },
  
  // Custom methods
  methods: {
    // End node specific methods
    finalize: (node, context) => {
      // Logic to finalize a flow
      return {
        status: node.config.endType,
        statusCode: node.config.statusCode,
        data: node.config.outputData
      };
    }
  },
  
  // Form fields for the node properties panel
  formFields: [
    {
      name: 'endType',
      label: 'End Type',
      type: 'select',
      options: [
        { value: 'success', label: 'Success' },
        { value: 'error', label: 'Error' },
        { value: 'terminate', label: 'Terminate' }
      ],
      required: true
    },
    {
      name: 'statusCode',
      label: 'Status Code',
      type: 'number',
      required: false,
      placeholder: 'HTTP status code or custom code'
    }
  ]
};
