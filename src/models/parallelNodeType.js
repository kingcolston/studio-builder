import baseNodeType from './baseNodeType';

/**
 * Parallel node type configuration
 * This node executes multiple nodes in parallel
 */
export default {
  ...baseNodeType,
  
  // Basic properties
  type: 'parallel',
  label: 'Parallel',
  icon: 'fas fa-code-branch',
  description: 'Executes multiple nodes in parallel',
  
  // Connection points
  hasInput: true,
  hasOutput: true,
  
  // Default node attributes
  defaultNodeAttributes: {
    // Node attributes can be added here
  },
  
  // Default values
  defaultConfig: {
    // Parallel node specific configuration
    nodeNames: [], // Array of node names to execute in parallel
    waitForAll: true,
    errorHandling: 'continueOnError' // continueOnError, stopOnError
  },
  
  // UI display options
  color: 'rgba(111, 66, 193, 0.1)',
  borderColor: '#6f42c1',
  
  // Validation rules
  validate: (node) => {
    const errors = [];
    
    if (!node.config || !node.config.nodeNames || node.config.nodeNames.length === 0) {
      errors.push('At least one node must be selected for parallel execution');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },
  
  // Custom methods
  methods: {
    // Parallel node specific methods
    executeParallel: (node, context, executeNode) => {
      // Logic to execute nodes in parallel
      // This would be implemented in the runtime engine
      const promises = node.config.nodeNames.map(nodeName => {
        return executeNode(nodeName, context);
      });
      
      return Promise.all(promises);
    }
  },
  
  // Form fields for the node properties panel
  formFields: [
    {
      name: 'nodeNames',
      label: 'Parallel Nodes',
      type: 'node-multi-select',
      required: true,
      placeholder: 'Select nodes to execute in parallel'
    },
    {
      name: 'waitForAll',
      label: 'Wait for All Completions',
      type: 'checkbox',
      required: false
    },
    {
      name: 'errorHandling',
      label: 'Error Handling',
      type: 'select',
      options: [
        { value: 'continueOnError', label: 'Continue On Error' },
        { value: 'stopOnError', label: 'Stop On Error' }
      ],
      required: true
    }
  ]
};
