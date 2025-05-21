import executeNodeType from './executeNodeType';
import conditionalNodeType from './conditionalNodeType';
import parallelNodeType from './parallelNodeType';
import restApiNodeType from './restApiNodeType';

// Export all node types
export const nodeTypes = [
  executeNodeType,
  conditionalNodeType,
  parallelNodeType,
  restApiNodeType
];

// Export a map of node types by type name for easy lookup
export const nodeTypeMap = {
  [executeNodeType.type]: executeNodeType,
  [conditionalNodeType.type]: conditionalNodeType,
  [parallelNodeType.type]: parallelNodeType,
  [restApiNodeType.type]: restApiNodeType
};

// Helper function to get a node type by type name
export const getNodeType = (type) => {
  return nodeTypeMap[type] || null;
};

// Helper function to create a new node instance with default config
export const createNode = (type, position = { x: 0, y: 0 }, name = null) => {
  const nodeType = getNodeType(type);
  if (!nodeType) {
    throw new Error(`Unknown node type: ${type}`);
  }
  
  return {
    id: null, // Will be assigned by the store
    nodeType: nodeType.type,
    name: name || `${nodeType.label} Node`,
    position,
    nodeAttributes: {
      // Other node attributes can be added here
    },
    next: null, // String referring to the next node ID
    end: false, // Boolean determining if flow has ended
    config: { ...nodeType.defaultConfig }
  };
};

// Export individual node types
export {
  executeNodeType,
  conditionalNodeType,
  parallelNodeType,
  restApiNodeType
};

// Export default as the array of all node types
export default nodeTypes;
