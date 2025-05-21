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
    // Node attributes can be added here
  },
  
  // Default values
  defaultConfig: {
    // Execute node specific configuration
    configId: '' // Reference to a JSON file
  },
  
  // UI display options
  color: 'rgba(23, 162, 184, 0.1)',
  borderColor: '#17a2b8',
  
  // Validation rules
  validate: (node) => {
    const errors = [];
    
    if (!node.config.configId) {
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
      name: 'configId',
      label: 'Config ID',
      type: 'text',
      required: true,
      placeholder: 'Enter the ID of the JSON configuration file'
    }
  ]
};
