import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';

export const useNodeStore = defineStore('nodes', {
  state: () => ({
    nodes: [],
    connections: [],
    nextNodeId: 1
  }),
  
  actions: {
    addNode(node) {
      // Generate a unique ID if not provided
      if (!node.id) {
        node.id = uuidv4();
      }
      
      // Set default name if not provided
      if (!node.name) {
        node.name = `${node.nodeType.charAt(0).toUpperCase() + node.nodeType.slice(1)} ${this.nextNodeId++}`;
      }
      
      this.nodes.push(node);
      return node.id;
    },
    
    updateNodePosition(nodeId, position) {
      const node = this.nodes.find(n => n.id === nodeId);
      if (node) {
        node.position = position;
      }
    },
    
    updateNodeName(nodeId, name) {
      const node = this.nodes.find(n => n.id === nodeId);
      if (node) {
        node.name = name;
      }
    },
    
    updateNodeType(nodeId, nodeType, config = null) {
      const node = this.nodes.find(n => n.id === nodeId);
      if (node) {
        node.nodeType = nodeType;
        if (config !== null) {
          node.config = config;
        }
      }
    },
    
    updateNodeConfig(nodeId, config) {
      const node = this.nodes.find(n => n.id === nodeId);
      if (node) {
        node.config = config;
      }
    },
    
    updateNode(nodeId, updates) {
      const node = this.nodes.find(n => n.id === nodeId);
      if (node) {
        // Update config if provided
        if (updates.config !== undefined) {
          node.config = updates.config;
        }
        
        // Update nodeAttributes if provided
        if (updates.nodeAttributes !== undefined) {
          node.nodeAttributes = updates.nodeAttributes;
        }
        
        // Update next if provided
        if (updates.next !== undefined) {
          node.next = updates.next;
        }
        
        // Update end if provided
        if (updates.end !== undefined) {
          node.end = updates.end;
        }
      }
    },
    
    removeNode(nodeId) {
      // Remove the node
      this.nodes = this.nodes.filter(n => n.id !== nodeId);
      
      // Remove any connections associated with this node
      this.connections = this.connections.filter(
        c => c.sourceId !== nodeId && c.targetId !== nodeId
      );
    },
    
    addConnection(connection) {
      // Generate a unique ID if not provided
      if (!connection.id) {
        connection.id = uuidv4();
      }
      
      // Check if a connection already exists between these nodes
      const existingConnection = this.connections.find(
        c => c.sourceId === connection.sourceId && c.targetId === connection.targetId
      );
      
      if (!existingConnection) {
        this.connections.push(connection);
        return connection.id;
      }
      
      return null;
    },
    
    removeConnection(connectionId) {
      this.connections = this.connections.filter(c => c.id !== connectionId);
    },
    
    clearAll() {
      this.nodes = [];
      this.connections = [];
      this.nextNodeId = 1;
    }
  }
});
