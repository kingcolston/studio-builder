import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { useNodeStore } from './index';

export const useFlowStore = defineStore('flows', {
  state: () => ({
    flows: [],
    activeFlowId: null
  }),
  
  getters: {
    activeFlow: (state) => {
      return state.flows.find(flow => flow.id === state.activeFlowId) || null;
    },
    
    flowById: (state) => (id) => {
      return state.flows.find(flow => flow.id === id) || null;
    }
  },
  
  actions: {
    createFlow(name = 'New Flow') {
      const id = uuidv4();
      
      const flow = {
        id,
        name,
        configId: uuidv4(),
        configType: 'workflow',
        configStatus: 'draft',
        configOwner: 'user',
        configDescription: 'Flow created with Node Flow Editor',
        input: {
          param1: 'value1',
          param2: 'value2'
        },
        required: {
          requiredParam1: 'value1',
          requiredParam2: 'value2'
        },
        nodes: [],
        connections: []
      };
      
      this.flows.push(flow);
      
      // Set as active flow if no active flow
      if (!this.activeFlowId) {
        this.activeFlowId = id;
      }
      
      return id;
    },
    
    setActiveFlow(id) {
      this.activeFlowId = id;
    },
    
    updateFlowMetadata(id, metadata) {
      const flow = this.flowById(id);
      if (flow) {
        if (metadata.name !== undefined) flow.name = metadata.name;
        if (metadata.configId !== undefined) flow.configId = metadata.configId;
        if (metadata.configType !== undefined) flow.configType = metadata.configType;
        if (metadata.configStatus !== undefined) flow.configStatus = metadata.configStatus;
        if (metadata.configOwner !== undefined) flow.configOwner = metadata.configOwner;
        if (metadata.configDescription !== undefined) flow.configDescription = metadata.configDescription;
      }
    },
    
    updateFlowInput(id, input) {
      const flow = this.flowById(id);
      if (flow) {
        flow.input = { ...input };
      }
    },
    
    updateFlowRequired(id, required) {
      const flow = this.flowById(id);
      if (flow) {
        flow.required = { ...required };
      }
    },
    
    deleteFlow(id) {
      this.flows = this.flows.filter(flow => flow.id !== id);
      
      // If the active flow was deleted, set a new active flow
      if (this.activeFlowId === id) {
        this.activeFlowId = this.flows.length > 0 ? this.flows[0].id : null;
      }
    },
    
    // Sync nodes and connections from NodeStore to the active flow
    syncNodesAndConnections() {
      if (!this.activeFlowId) return;
      
      const nodeStore = useNodeStore();
      const flow = this.activeFlow;
      
      if (flow) {
        flow.nodes = [...nodeStore.nodes];
        flow.connections = [...nodeStore.connections];
      }
    },
    
    // Load nodes and connections from a flow to the NodeStore
    loadFlowToNodeStore(id) {
      const flow = this.flowById(id);
      if (!flow) return;
      
      const nodeStore = useNodeStore();
      
      // Clear the node store
      nodeStore.clearAll();
      
      // Add nodes and connections from the flow
      flow.nodes.forEach(node => {
        nodeStore.addNode({ ...node });
      });
      
      flow.connections.forEach(connection => {
        nodeStore.addConnection({ ...connection });
      });
      
      // Set as active flow
      this.activeFlowId = id;
    },
    
    // Import a flow from JSON
    importFlow(jsonData) {
      try {
        const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        
        // Process the input object - extract values from type/value structure
        const processedInput = {};
        if (data.input) {
          Object.entries(data.input).forEach(([key, value]) => {
            // Check if the input has the new format with type and value
            if (value && typeof value === 'object' && 'value' in value) {
              processedInput[key] = value.value;
            } else {
              // Handle legacy format where input values are direct
              processedInput[key] = value;
            }
          });
        }
        
        // Process the required array into an object
        let processedRequired = {};
        if (data.required) {
          // Check if required is an array (new format) or object (old format)
          if (Array.isArray(data.required)) {
            // New format: required is an array of strings
            data.required.forEach(key => {
              // Get the value from the input if available
              if (data.input && data.input[key] && data.input[key].value !== undefined) {
                processedRequired[key] = data.input[key].value;
              } else {
                processedRequired[key] = '';
              }
            });
          } else {
            // Old format: required is an object
            processedRequired = { ...data.required };
          }
        }
        
        // Create a new flow with the imported data
        const id = uuidv4();
        const flow = {
          id,
          name: data.name || `Imported Flow ${this.flows.length + 1}`,
          configId: data.configId || uuidv4(),
          configType: data.configType || 'workflow',
          configStatus: data.configStatus || 'draft',
          configOwner: data.configOwner || 'user',
          configDescription: data.configDescription || 'Imported flow',
          input: processedInput,
          required: processedRequired,
          nodes: [],
          connections: []
        };
        
        // If the imported data has a config section with nodes
        if (data.config && data.config.nodes) {
          // Convert the config object to nodes
          const nodeNames = Object.keys(data.config.nodes);
          
          // Calculate positions for nodes in a grid layout
          const GRID_SPACING_X = 250;
          const GRID_SPACING_Y = 150;
          const NODES_PER_ROW = 3;
          
          // Create nodes from the config
          nodeNames.forEach((nodeName, index) => {
            const nodeConfig = data.config.nodes[nodeName];
            // Get the node type (support both nodeType and type for backward compatibility)
            const nodeType = nodeConfig.nodeType || nodeConfig.type;
            
            if (nodeConfig && nodeType) {
              // Calculate position in a grid layout
              const row = Math.floor(index / NODES_PER_ROW);
              const col = index % NODES_PER_ROW;
              
              const position = {
                x: 100 + col * GRID_SPACING_X,
                y: 100 + row * GRID_SPACING_Y
              };
              
              // Initialize node attributes
              const nodeAttributes = nodeConfig.nodeAttributes || {};
              
              // Process node attributes for conditional nodes
              if (nodeType === 'conditional' && nodeConfig.choices) {
                // Initialize choices array if it doesn't exist
                if (!nodeAttributes.choices) {
                  nodeAttributes.choices = [];
                }
                
                // We'll process the choices after all nodes are created
                // to properly set the next node IDs
              }
              
              // Process node attributes for execute nodes
              if (nodeType === 'execute') {
                // Move configId and nodeInput from config to nodeAttributes if they exist in config
                if (nodeConfig.config && nodeConfig.config.configId && !nodeAttributes.configId) {
                  nodeAttributes.configId = nodeConfig.config.configId;
                }
                
                if (nodeConfig.config && nodeConfig.config.nodeInput && !nodeAttributes.nodeInput) {
                  nodeAttributes.nodeInput = nodeConfig.config.nodeInput;
                }
              }
              
              const node = {
                id: uuidv4(),
                name: nodeName,
                nodeType: nodeType,
                position,
                config: nodeConfig.config || {},
                nodeAttributes,
                next: null, // We'll set this after all nodes are created
                end: nodeConfig.end || false
              };
              
              flow.nodes.push(node);
            }
          });
          
          // Create connections based on the 'next' property
          flow.nodes.forEach(node => {
            const nodeConfig = data.config.nodes[node.name];
            if (nodeConfig && nodeConfig.next) {
              // Find the target node by name
              const targetNode = flow.nodes.find(n => n.name === nodeConfig.next);
              if (targetNode) {
                // Set the next property
                node.next = targetNode.id;
                
                // Create a connection
                const connection = {
                  id: uuidv4(),
                  sourceId: node.id,
                  targetId: targetNode.id
                };
                
                flow.connections.push(connection);
              }
            }
          });
          
          // Process choices for conditional nodes
          flow.nodes.forEach(node => {
            const nodeConfig = data.config.nodes[node.name];
            if (node.nodeType === 'conditional' && nodeConfig && nodeConfig.choices) {
              // Process each choice
              nodeConfig.choices.forEach(choice => {
                if (choice.condition && choice.next) {
                  // Find the target node by name
                  const targetNode = flow.nodes.find(n => n.name === choice.next);
                  if (targetNode) {
                    // Add the choice to the node's choices array
                    node.nodeAttributes.choices.push({
                      condition: choice.condition,
                      next: targetNode.id
                    });
                    
                    // Create a connection for this choice
                    const connection = {
                      id: uuidv4(),
                      sourceId: node.id,
                      targetId: targetNode.id,
                      connectionType: 'choice'
                    };
                    
                    flow.connections.push(connection);
                  }
                }
              });
            }
          });
          
          // Set the start node if specified
          if (data.config.startNode) {
            const startNodeName = data.config.startNode;
            const startNode = flow.nodes.find(n => n.name === startNodeName);
            if (startNode) {
              // Mark this node as the start node (you could add a property if needed)
              // For now, we'll just ensure it's first in the array
              const index = flow.nodes.indexOf(startNode);
              if (index > 0) {
                flow.nodes.splice(index, 1);
                flow.nodes.unshift(startNode);
              }
            }
          } else if (flow.nodes.length > 0) {
            // If no start node is specified, use the first node
            // We don't need to do anything special here since the first node is already at index 0
          }
        }
        
        this.flows.push(flow);
        return id;
      } catch (error) {
        console.error('Error importing flow:', error);
        return null;
      }
    },
    
    // Export a flow to JSON
    exportFlow(id) {
      const flow = this.flowById(id);
      if (!flow) return null;
      
      // Find the start node (first node in the array)
      const startNode = flow.nodes.length > 0 ? flow.nodes[0] : null;
      const startNodeName = startNode ? startNode.name : null;
      
      // Create a config object with a key-value pair for each node, using node names as keys
      const nodesConfig = {};
      flow.nodes.forEach(node => {
        // Find the next node name (if any)
        let nextNodeName = null;
        if (node.next) {
          const nextNode = flow.nodes.find(n => n.id === node.next);
          if (nextNode) {
            nextNodeName = nextNode.name;
          }
        }
        
        const nodeConfig = {
          nodeType: node.nodeType,
          config: node.config || {},
          next: nextNodeName,
          end: node.end || false
        };
        
        // Add node attributes if they exist
        if (node.nodeAttributes) {
          // For conditional nodes, include the choices attribute
          if (node.nodeType === 'conditional' && node.nodeAttributes.choices && node.nodeAttributes.choices.length > 0) {
            nodeConfig.choices = node.nodeAttributes.choices.map(choice => {
              // Convert the next node ID to a node name
              let nextNodeName = null;
              if (choice.next) {
                const nextNode = flow.nodes.find(n => n.id === choice.next);
                if (nextNode) {
                  nextNodeName = nextNode.name;
                }
              }
              
              return {
                condition: choice.condition,
                next: nextNodeName
              };
            });
          }
          
          // Include other node attributes as needed
          nodeConfig.nodeAttributes = { ...node.nodeAttributes };
        }
        
        nodesConfig[node.name] = nodeConfig;
      });
      
      // Transform the required object into an array of strings
      const requiredArray = Object.keys(flow.required);
      
      // Transform the input object to include type and value for each parameter
      const transformedInput = {};
      Object.entries(flow.input).forEach(([key, value]) => {
        transformedInput[key] = {
          type: "value",
          value: value
        };
      });
      
      // Ensure all required parameters have an entry in the input object
      requiredArray.forEach(param => {
        if (!transformedInput[param]) {
          transformedInput[param] = {
            type: "value",
            value: flow.required[param] || ""
          };
        }
      });
      
      // Create the export structure
      const exportData = {
        configId: flow.configId,
        configType: flow.configType,
        configStatus: flow.configStatus,
        configOwner: flow.configOwner,
        configDescription: flow.configDescription,
        input: transformedInput,
        required: requiredArray,
        config: {
          startNode: startNodeName,
          nodes: nodesConfig
        }
      };
      
      return exportData;
    }
  }
});
