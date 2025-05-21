/**
 * Base node type configuration
 * This serves as the foundation for all node types
 */
export default {
  // Basic properties
  type: '',
  label: '',
  icon: '',
  description: '',
  
  // Connection points
  hasInput: true,
  hasOutput: true,
  
  // Default values for node structure
  defaultNodeAttributes: {
    // Node attributes can be added here
  },
  
  // Default values for node configuration
  defaultConfig: {},
  
  // UI display options
  color: '',
  borderColor: '',
  
  // Validation rules
  validate: (node) => {
    return { valid: true, errors: [] };
  },
  
  // Custom methods
  methods: {
    // Add any type-specific methods here
  }
};
