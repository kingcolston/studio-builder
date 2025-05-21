<template>
  <div class="app">
    <header class="header">
      <h1>Node Flow Editor</h1>
      <div class="actions">
        <button class="btn" @click="createNewFlow">New Flow</button>
        <button class="btn btn-secondary" @click="clearCanvas">Clear Canvas</button>
      </div>
    </header>
    
    <div class="node-palette">
      <div 
        v-for="(nodeType, index) in nodeTypes" 
        :key="index"
        class="palette-item"
        draggable="true"
        @dragstart="onDragStart($event, nodeType)"
      >
        <i :class="nodeType.icon"></i> {{ nodeType.label }}
      </div>
    </div>
    
    <div class="workspace">
      <!-- Flow Canvas -->
      <NodeCanvas 
        ref="canvas"
        :nodes="nodes" 
        :connections="connections"
        @node-added="onNodeAdded"
        @node-selected="onNodeSelected"
        @node-moved="onNodeMoved"
        @connection-created="onConnectionCreated"
        @connection-removed="onConnectionRemoved"
      />
    </div>
    
    <div class="properties-panel">
      <!-- Flow Configuration Form -->
      <div v-if="showFlowConfig" class="flow-properties">
        <h3>Flow Properties</h3>
        <button class="btn btn-sm btn-secondary" @click="showFlowConfig = false">
          Back to Node Properties
        </button>
        
        <FlowConfigForm :flow="activeFlow" />
        
        <div class="export-section">
          <h4>Export Flow</h4>
          <button class="btn btn-primary" @click="exportFlowToJson">
            Export to JSON
          </button>
        </div>
      </div>
      
      <!-- Node Properties Form -->
      <div v-else-if="selectedNode" class="node-properties">
        <h3>Node Properties</h3>
        
        <div class="flow-info">
          <span class="flow-name">{{ activeFlow.name }}</span>
          <button class="btn btn-sm btn-secondary" @click="showFlowConfig = true">
            Edit Flow Config
          </button>
        </div>
        
        <div class="form-group">
          <label class="form-label">Name</label>
          <input 
            type="text" 
            class="form-control" 
            v-model="selectedNode.name"
            @input="updateNodeName"
          >
        </div>
        <div class="form-group">
          <label class="form-label">Type</label>
          <select class="form-control" v-model="selectedNode.nodeType" @change="updateNodeType">
            <option v-for="(nodeType, index) in nodeTypes" :key="index" :value="nodeType.type">
              {{ nodeType.label }}
            </option>
          </select>
        </div>
        
        <!-- Dynamic Node Configuration Form -->
        <NodeConfigForm 
          v-if="selectedNode" 
          :node="selectedNode"
          :availableNodes="otherNodes"
          @update="updateNodeConfigFromForm"
        />
        
        <button class="btn btn-danger mt-3" @click="deleteSelectedNode">Delete Node</button>
      </div>
      
      <!-- No Selection -->
      <div v-else class="no-selection">
        <p>Select a node to edit its properties or configure the flow.</p>
        <button class="btn btn-primary" @click="showFlowConfig = true">
          Configure Flow
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch } from 'vue';
import { useNodeStore } from './store';
import { useFlowStore } from './store/flowStore';
import NodeCanvas from './components/NodeCanvas.vue';
import NodeConfigForm from './components/NodeConfigForm.vue';
import FlowConfigForm from './components/FlowConfigForm.vue';
import { nodeTypes, createNode } from './models';
import { v4 as uuidv4 } from 'uuid';

export default {
  name: 'App',
  components: {
    NodeCanvas,
    NodeConfigForm,
    FlowConfigForm
  },
  setup() {
    const nodeStore = useNodeStore();
    const flowStore = useFlowStore();
    const selectedNode = ref(null);
    const showFlowConfig = ref(false);
    
    // Create a default flow if none exists
    if (flowStore.flows.length === 0) {
      flowStore.createFlow('Default Flow');
    }
    
    // Watch for changes in the active flow
    watch(() => flowStore.activeFlowId, (newActiveFlowId, oldActiveFlowId) => {
      if (newActiveFlowId !== oldActiveFlowId) {
        // Load the nodes and connections from the active flow
        flowStore.loadFlowToNodeStore(newActiveFlowId);
        
        // Clear the selected node
        selectedNode.value = null;
      }
    });
    
    // Watch for changes in the node store
    watch(() => [nodeStore.nodes, nodeStore.connections], () => {
      // Sync the nodes and connections to the active flow
      flowStore.syncNodesAndConnections();
    }, { deep: true });
    
    const onDragStart = (event, nodeType) => {
      event.dataTransfer.setData('nodeType', JSON.stringify(nodeType));
    };
    
    const onNodeAdded = (node) => {
      nodeStore.addNode(node);
    };
    
    const onNodeSelected = (node) => {
      selectedNode.value = node;
      showFlowConfig.value = false;
    };
    
    const onNodeMoved = (nodeId, position) => {
      nodeStore.updateNodePosition(nodeId, position);
    };
    
    const onConnectionCreated = (connection) => {
      // Add the connection to the store
      const connectionId = nodeStore.addConnection(connection);
      
      if (connectionId) {
        // Update the source node's next property to point to the target node
        const sourceNode = nodeStore.nodes.find(n => n.id === connection.sourceId);
        if (sourceNode) {
          nodeStore.updateNode(sourceNode.id, {
            next: connection.targetId
          });
        }
      }
    };
    
    const onConnectionRemoved = (connectionId) => {
      // Find the connection
      const connection = nodeStore.connections.find(c => c.id === connectionId);
      if (connection) {
        // Find the source node
        const sourceNode = nodeStore.nodes.find(n => n.id === connection.sourceId);
        if (sourceNode && sourceNode.next === connection.targetId) {
          // Clear the source node's next property
          nodeStore.updateNode(sourceNode.id, {
            next: null
          });
        }
      }
      
      // Remove the connection
      nodeStore.removeConnection(connectionId);
    };
    
    const updateNodeName = () => {
      if (selectedNode.value) {
        nodeStore.updateNodeName(selectedNode.value.id, selectedNode.value.name);
      }
    };
    
    const updateNodeType = () => {
      if (selectedNode.value) {
        // Get the default config for the new node type
        const newNode = createNode(selectedNode.value.nodeType);
        
        // Update the node's config with the default config for the new type
        selectedNode.value.config = { ...newNode.config };
        
        // Update the node type in the store
        nodeStore.updateNodeType(selectedNode.value.id, selectedNode.value.nodeType, selectedNode.value.config);
      }
    };
    
    const deleteSelectedNode = () => {
      if (selectedNode.value) {
        nodeStore.removeNode(selectedNode.value.id);
        selectedNode.value = null;
      }
    };
    
    const createNewFlow = () => {
      const flowId = flowStore.createFlow(`Flow ${flowStore.flows.length + 1}`);
      flowStore.setActiveFlow(flowId);
    };
    
    const exportFlowToJson = () => {
      const exportData = flowStore.exportFlow(flowStore.activeFlowId);
      if (!exportData) return;
      
      const flow = flowStore.activeFlow;
      const fileName = flow ? `${flow.name.replace(/\s+/g, '_').toLowerCase()}.json` : 'flow.json';
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    
    const clearCanvas = () => {
      nodeStore.clearAll();
      flowStore.syncNodesAndConnections();
      selectedNode.value = null;
    };
    
    const updateNodeConfig = () => {
      if (selectedNode.value) {
        nodeStore.updateNodeConfig(selectedNode.value.id, selectedNode.value.config);
      }
    };
    
    // Method to update node config from the NodeConfigForm component
    const updateNodeConfigFromForm = (updates) => {
      if (selectedNode.value) {
        // Update the node's config
        selectedNode.value.config = updates.config;
        
        // Update the node's attributes
        selectedNode.value.nodeAttributes = updates.nodeAttributes;
        
        // Update the next node
        selectedNode.value.next = updates.next;
        
        // Update the end flag
        selectedNode.value.end = updates.end;
        
        // Update the node in the store
        nodeStore.updateNode(selectedNode.value.id, {
          config: updates.config,
          nodeAttributes: updates.nodeAttributes,
          next: updates.next,
          end: updates.end
        });
        
        // If the next node has changed, update the connections
        if (updates.next !== undefined) {
          // Remove any existing connections from this node
          const existingConnections = nodeStore.connections.filter(c => c.sourceId === selectedNode.value.id);
          existingConnections.forEach(connection => {
            nodeStore.removeConnection(connection.id);
          });
          
          // Add a new connection if next is not null
          if (updates.next) {
            nodeStore.addConnection({
              id: uuidv4(),
              sourceId: selectedNode.value.id,
              targetId: updates.next
            });
          }
        }
      }
    };
    
    return {
      nodeTypes,
      selectedNode,
      showFlowConfig,
      nodes: computed(() => nodeStore.nodes),
      connections: computed(() => nodeStore.connections),
      activeFlow: computed(() => flowStore.activeFlow),
      otherNodes: computed(() => {
        if (!selectedNode.value) return nodeStore.nodes;
        return nodeStore.nodes.filter(node => node.id !== selectedNode.value.id);
      }),
      onDragStart,
      onNodeAdded,
      onNodeSelected,
      onNodeMoved,
      onConnectionCreated,
      onConnectionRemoved,
      updateNodeName,
      updateNodeType,
      updateNodeConfig,
      updateNodeConfigFromForm,
      deleteSelectedNode,
      createNewFlow,
      exportFlowToJson,
      clearCanvas
    };
  }
};
</script>

<style>
.app {
  display: grid;
  grid-template-columns: 1fr 300px;
  grid-template-rows: auto auto 1fr;
  height: 100vh;
  overflow: hidden;
}

.header {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: var(--primary-color);
  color: white;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.node-palette {
  grid-column: 1 / -1;
  display: flex;
  gap: 1rem;
  padding: 0.5rem 1rem;
  background-color: var(--light-color);
  border-bottom: 1px solid var(--node-border);
}

.workspace {
  grid-column: 1;
  grid-row: 3;
  position: relative;
  overflow: auto;
  background-color: var(--canvas-bg);
}

.properties-panel {
  grid-column: 2;
  grid-row: 3;
  padding: 1rem;
  background-color: var(--light-color);
  border-left: 1px solid var(--node-border);
  overflow-y: auto;
}

.node-properties h3, .flow-properties h3 {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--node-border);
}

.flow-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
}

.flow-name {
  font-weight: bold;
  color: var(--primary-color);
}

.export-section {
  margin-top: 2rem;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  border: 1px solid var(--node-border);
}

.export-section h4 {
  margin-bottom: 1rem;
  font-size: 1rem;
  color: var(--primary-color);
}

.no-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--secondary-color);
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--node-border);
  border-radius: 4px;
  font-size: 0.9rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: var(--primary-color);
  color: white;
}

.btn-secondary {
  background-color: var(--secondary-color);
}

.btn-danger {
  background-color: var(--danger-color, #dc3545);
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.mt-3 {
  margin-top: 1rem;
}

.palette-item {
  padding: 0.5rem 1rem;
  background-color: white;
  border: 1px solid var(--node-border);
  border-radius: 4px;
  cursor: grab;
  user-select: none;
}

.palette-item:hover {
  background-color: var(--light-hover);
}
</style>
