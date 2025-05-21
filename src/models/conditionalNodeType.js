import baseNodeType from './baseNodeType';

/**
 * Conditional node type configuration
 * This node represents a decision point in the flow
 */
export default {
  ...baseNodeType,
  
  // Basic properties
  type: 'conditional',
  label: 'Conditional',
  icon: 'fas fa-question',
  description: 'Evaluates a condition and directs flow accordingly',
  
  // Connection points
  hasInput: true,
  hasOutput: true,
  
  // Default node attributes
  defaultNodeAttributes: {
    // Node attributes can be added here
  },
  
  // Default values
  defaultConfig: {
    // Conditional node specific configuration
    condition: '',
    trueNodeName: null,
    falseNodeName: null,
    evaluationType: 'javascript', // javascript, jsonpath, etc.
    contextVariable: 'data'
  },
  
  // UI display options
  color: 'rgba(255, 193, 7, 0.1)',
  borderColor: '#ffc107',
  
  // Validation rules
  validate: (node) => {
    const errors = [];
    
    if (!node.config || !node.config.condition) {
      errors.push('Condition expression is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },
  
  // Custom methods
  methods: {
    // Conditional node specific methods
    evaluate: (node, context) => {
      // Logic to evaluate a condition
      // This would be implemented in the runtime engine
      try {
        // Simple example for JavaScript evaluation
        if (node.config.evaluationType === 'javascript') {
          const contextData = context[node.config.contextVariable] || {};
          // Using Function constructor to evaluate the condition with context
          const evaluator = new Function(node.config.contextVariable, `return ${node.config.condition};`);
          return evaluator(contextData);
        }
        return false;
      } catch (error) {
        console.error('Error evaluating condition:', error);
        return false;
      }
    }
  },
  
  // Form fields for the node properties panel
  formFields: [
    {
      name: 'condition',
      label: 'Condition',
      type: 'text',
      required: true,
      placeholder: 'e.g. data.value > 10'
    },
    {
      name: 'evaluationType',
      label: 'Evaluation Type',
      type: 'select',
      options: [
        { value: 'javascript', label: 'JavaScript' },
        { value: 'jsonpath', label: 'JSONPath' }
      ],
      required: true
    },
    {
      name: 'contextVariable',
      label: 'Context Variable',
      type: 'text',
      required: false,
      placeholder: 'Variable name to use in condition'
    },
    {
      name: 'trueNodeName',
      label: 'True Path Node',
      type: 'node-select',
      required: false,
      placeholder: 'Select node for true condition'
    },
    {
      name: 'falseNodeName',
      label: 'False Path Node',
      type: 'node-select',
      required: false,
      placeholder: 'Select node for false condition'
    }
  ]
};
