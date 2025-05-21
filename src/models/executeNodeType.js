import baseNodeType from './baseNodeType';

/**
 * Execute node type configuration
 * This node executes other JSON config files
 */
export default {
  ...baseNodeType,
  
  // Basic properties
  type: 'execute',
  label: 'Execute',
  icon: 'fas fa-code',
  description: 'Executes another JSON configuration file',
  
  // Connection points
  hasInput: true,
  hasOutput: true,
  
  // Default node attributes
  defaultNodeAttributes: {
    configId: '', // Reference to a JSON file
    nodeInput: {} // Key-value pairs for node input
  },
  
  // Default values
  defaultConfig: {
    // Execute node specific configuration
  },
  
  // UI display options
  color: 'rgba(23, 162, 184, 0.1)',
  borderColor: '#17a2b8',
  
  // Validation rules
  validate: (node) => {
    const errors = [];
    
    if (!node.nodeAttributes || !node.nodeAttributes.configId) {
      errors.push('Config ID is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },
  
  // Custom methods
  methods: {
    // Execute node specific methods
    execute: (node, context) => {
      // Logic to execute a JSON file
      // This would be implemented in the runtime engine
      return {
        success: true,
        result: {}
      };
    }
  },
  
  // Form fields for the node properties panel
  formFields: [
    {
      name: 'nodeAttributes.configId',
      label: 'Config ID',
      type: 'text',
      required: true,
      placeholder: 'Enter the ID of the JSON configuration file'
    },
    {
      name: 'nodeAttributes.nodeInput',
      label: 'Node Input',
      type: 'key-value',
      required: false,
      placeholder: 'Add key-value pairs for node input'
    }
  ]
};
