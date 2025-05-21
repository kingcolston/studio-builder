import baseNodeType from './baseNodeType';

/**
 * Start node type configuration
 * This node represents the entry point of a flow
 */
export default {
  ...baseNodeType,
  
  // Basic properties
  type: 'start',
  label: 'Start',
  icon: 'fas fa-play',
  description: 'Starting point of the flow',
  
  // Connection points
  hasInput: false,
  hasOutput: true,
  
  // Default node attributes
  defaultNodeAttributes: {
    // Node attributes can be added here
  },
  
  // Default values
  defaultConfig: {
    // Start node specific configuration
    initialData: {},
    startParams: {}
  },
  
  // UI display options
  color: 'rgba(40, 167, 69, 0.1)',
  borderColor: '#28a745',
  
  // Validation rules
  validate: (node) => {
    const errors = [];
    
    // Add any validation rules specific to start nodes
    
    return {
      valid: errors.length === 0,
      errors
    };
  },
  
  // Custom methods
  methods: {
    // Start node specific methods
    initialize: (node) => {
      // Logic to initialize a start node
      return node;
    }
  }
};
