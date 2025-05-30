<template>
  <div 
    class="node" 
    :class="[`node-${node.nodeType}`, { selected: selected }]" 
    :style="nodeStyle"
    @mousedown.stop="onNodeMouseDown"
    @click.stop="onNodeClick"
  >
    <div class="node-header">
      <div class="node-title">{{ node.name }}</div>
      <div class="node-type">{{ node.nodeType }}</div>
    </div>
    
    <div class="node-content">
      <!-- Next Node -->
      <div v-if="node.next && !hasTrueFalseOutputs" class="node-next">
        <strong>Next:</strong> {{ getNodeNameById(node.next) }}
      </div>
      
      <!-- True/False Paths for Conditional Nodes -->
      <div v-if="hasTrueFalseOutputs && node.config" class="node-paths">
        <div v-if="node.config.truePath" class="node-path true-path">
          <strong>True:</strong> {{ getNodeNameById(node.config.truePath) }}
        </div>
        <div v-if="node.config.falsePath" class="node-path false-path">
          <strong>False:</strong> {{ getNodeNameById(node.config.falsePath) }}
        </div>
      </div>
      
      <!-- End Flag -->
      <div v-if="node.end" class="node-end">
        <strong>End:</strong> Yes
      </div>
      
      <!-- Execute Node Content -->
      <div v-if="node.nodeType === 'execute'" class="node-config-display">
        <div v-if="node.nodeAttributes && node.nodeAttributes.configId" class="config-item">
          <i class="fas fa-file-code"></i> {{ node.nodeAttributes.configId }}
        </div>
        <div v-if="node.nodeAttributes && node.nodeAttributes.nodeInput && Object.keys(node.nodeAttributes.nodeInput).length > 0" class="config-item">
          <i class="fas fa-input"></i> {{ Object.keys(node.nodeAttributes.nodeInput).length }} input(s)
        </div>
      </div>
      
      <!-- Conditional Node Content -->
      <div v-if="node.nodeType === 'conditional'" class="node-config-display">
        <div v-if="node.config && node.config.condition" class="config-item">
          <i class="fas fa-code"></i> {{ node.config.condition }}
        </div>
        <div v-if="node.nodeAttributes && node.nodeAttributes.choices && node.nodeAttributes.choices.length > 0" class="config-item">
          <i class="fas fa-list"></i> {{ node.nodeAttributes.choices.length }} condition choice(s)
        </div>
      </div>
      
      <!-- Parallel Node Content -->
      <div v-if="node.nodeType === 'parallel' && node.config" class="node-config-display">
        <div v-if="node.config.nodeNames && node.config.nodeNames.length > 0" class="config-item">
          <i class="fas fa-code-branch"></i> {{ node.config.nodeNames.length }} parallel paths
        </div>
      </div>
      
      <!-- REST API Node Content -->
      <div v-if="node.nodeType === 'restApi'" class="node-config-display">
        <div v-if="node.config && node.config.method && node.config.url" class="config-item">
          <i class="fas fa-globe"></i> {{ node.config.method }} {{ truncateUrl(node.config.url) }}
        </div>
        <div v-if="node.nodeAttributes && node.nodeAttributes.requestMethod && node.nodeAttributes.requestUrl" class="config-item">
          <i class="fas fa-server"></i> {{ node.nodeAttributes.requestMethod }} {{ truncateUrl(node.nodeAttributes.requestUrl) }}
        </div>
      </div>
    </div>
    
    <!-- Connection points -->
    <div 
      v-if="showInputPoint"
      class="connection-point input"
      @mousedown.stop="onInputPointMouseDown"
      @mouseup.stop="onInputPointMouseUp"
    ></div>
    
    <!-- Standard output point (for non-conditional nodes) -->
    <div 
      v-if="showOutputPoint && !hasTrueFalseOutputs"
      class="connection-point output"
      @mousedown.stop="onOutputPointMouseDown"
      @mouseup.stop="onOutputPointMouseUp"
    ></div>
    
    <!-- True/False output points (for conditional nodes) -->
    <template v-if="hasTrueFalseOutputs">
      <div 
        class="connection-point output true"
        @mousedown.stop="onTrueOutputMouseDown"
        @mouseup.stop="onTrueOutputMouseUp"
      >
        <span class="connection-label">T</span>
      </div>
      <div 
        class="connection-point output false"
        @mousedown.stop="onFalseOutputMouseDown"
        @mouseup.stop="onFalseOutputMouseUp"
      >
        <span class="connection-label">F</span>
      </div>
    </template>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { getNodeType } from '../models';
import { useFlowStore } from '../store/flowStore';

export default {
  name: 'NodeElement',
  props: {
    node: {
      type: Object,
      required: true
    },
    selected: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'select',
    'move',
    'connection-start',
    'connection-end'
  ],
  setup(props, { emit }) {
    const flowStore = useFlowStore();
    const isDragging = ref(false);
    const dragOffset = ref({ x: 0, y: 0 });
    
    const nodeStyle = computed(() => {
      // Get the node type configuration
      const nodeType = getNodeType(props.node.nodeType);
      
      // Base style with position
      const style = {
        left: `${props.node.position.x}px`,
        top: `${props.node.position.y}px`
      };
      
      // Add color styles from node type configuration if available
      if (nodeType) {
        if (nodeType.color) {
          style.backgroundColor = nodeType.color;
        }
        if (nodeType.borderColor) {
          style.borderColor = nodeType.borderColor;
        }
      }
      
      return style;
    });
    
    const showInputPoint = computed(() => {
      // Get the node type configuration
      const nodeType = getNodeType(props.node.nodeType);
      // Use the hasInput property from the node type configuration
      return nodeType ? nodeType.hasInput : true;
    });
    
    const showOutputPoint = computed(() => {
      // Get the node type configuration
      const nodeType = getNodeType(props.node.nodeType);
      // Use the hasOutput property from the node type configuration
      return nodeType ? nodeType.hasOutput : true;
    });
    
    const hasTrueFalseOutputs = computed(() => {
      // Get the node type configuration
      const nodeType = getNodeType(props.node.nodeType);
      // Check if this node type has true/false outputs
      return nodeType ? nodeType.hasTrueFalseOutputs : false;
    });
    
    // Get the name of a node by its ID
    const getNodeNameById = (nodeId) => {
      if (!nodeId) return '';
      
      // Get the active flow
      const activeFlow = flowStore.activeFlow;
      if (!activeFlow) return '';
      
      // Find the node in the active flow
      const node = activeFlow.nodes.find(n => n.id === nodeId);
      return node ? node.name : '';
    };
    
    const onNodeClick = () => {
      emit('select', props.node.id);
    };
    
    const onNodeMouseDown = (event) => {
      isDragging.value = true;
      
      // Calculate the offset between mouse position and node position
      dragOffset.value = {
        x: event.clientX - props.node.position.x,
        y: event.clientY - props.node.position.y
      };
      
      // Select the node
      emit('select', props.node.id);
      
      // Add global event listeners
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };
    
    const onMouseMove = (event) => {
      if (isDragging.value) {
        const newPosition = {
          x: event.clientX - dragOffset.value.x,
          y: event.clientY - dragOffset.value.y
        };
        
        emit('move', props.node.id, newPosition);
      }
    };
    
    const onMouseUp = () => {
      isDragging.value = false;
      
      // Remove global event listeners
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    const onInputPointMouseDown = (event) => {
      // Prevent node dragging when clicking on connection points
      event.stopPropagation();
    };
    
    const onInputPointMouseUp = (event) => {
      // Handle connection end
      const rect = event.target.getBoundingClientRect();
      const position = {
        x: rect.left,
        y: rect.top + rect.height / 2
      };
      
      emit('connection-end', props.node.id, position, 'input');
    };
    
    const onOutputPointMouseDown = (event) => {
      // Prevent node dragging when clicking on connection points
      event.stopPropagation();
      
      // Start drawing a connection
      const rect = event.target.getBoundingClientRect();
      const position = {
        x: rect.right,
        y: rect.top + rect.height / 2
      };
      
      emit('connection-start', props.node.id, position, 'output');
    };
    
    const onOutputPointMouseUp = (event) => {
      // This could be used if needed
    };
    
    const onTrueOutputMouseDown = (event) => {
      // Prevent node dragging when clicking on connection points
      event.stopPropagation();
      
      // Start drawing a connection from the true output
      const rect = event.target.getBoundingClientRect();
      const position = {
        x: rect.right,
        y: rect.top + rect.height / 2
      };
      
      emit('connection-start', props.node.id, position, 'true');
    };
    
    const onTrueOutputMouseUp = (event) => {
      // This could be used if needed
    };
    
    const onFalseOutputMouseDown = (event) => {
      // Prevent node dragging when clicking on connection points
      event.stopPropagation();
      
      // Start drawing a connection from the false output
      const rect = event.target.getBoundingClientRect();
      const position = {
        x: rect.right,
        y: rect.top + rect.height / 2
      };
      
      emit('connection-start', props.node.id, position, 'false');
    };
    
    const onFalseOutputMouseUp = (event) => {
      // This could be used if needed
    };
    
    // Clean up event listeners when component is unmounted
    onUnmounted(() => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    });
    
    // Helper function to truncate long URLs for display
    const truncateUrl = (url) => {
      if (!url) return '';
      if (url.length <= 20) return url;
      return url.substring(0, 17) + '...';
    };
    
    return {
      nodeStyle,
      showInputPoint,
      showOutputPoint,
      hasTrueFalseOutputs,
      getNodeNameById,
      truncateUrl,
      onNodeClick,
      onNodeMouseDown,
      onInputPointMouseDown,
      onInputPointMouseUp,
      onOutputPointMouseDown,
      onOutputPointMouseUp,
      onTrueOutputMouseDown,
      onTrueOutputMouseUp,
      onFalseOutputMouseDown,
      onFalseOutputMouseUp
    };
  }
};
</script>

<style scoped>
.node {
  background-color: var(--node-bg);
  border: 2px solid var(--node-border);
  border-radius: 6px;
  padding: 1rem;
  min-width: 150px;
  position: absolute;
  cursor: move;
  user-select: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: border-color 0.3s, box-shadow 0.3s;
  z-index: 2;
}

.node.selected {
  border-color: var(--node-selected);
  box-shadow: 0 2px 10px rgba(74, 110, 224, 0.3);
  z-index: 3;
}

/* Node type specific styles */
.node-start {
  border-color: #28a745;
  background-color: rgba(40, 167, 69, 0.1);
}

.node-start .node-type {
  background-color: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.node-end {
  border-color: #dc3545;
  background-color: rgba(220, 53, 69, 0.1);
}

.node-end .node-type {
  background-color: rgba(220, 53, 69, 0.2);
  color: #dc3545;
}

.node-execute {
  border-color: #17a2b8;
  background-color: rgba(23, 162, 184, 0.1);
}

.node-execute .node-type {
  background-color: rgba(23, 162, 184, 0.2);
  color: #17a2b8;
}

.node-conditional {
  border-color: #ffc107;
  background-color: rgba(255, 193, 7, 0.1);
}

.node-conditional .node-type {
  background-color: rgba(255, 193, 7, 0.2);
  color: #856404;
}

.node-parallel {
  border-color: #6f42c1;
  background-color: rgba(111, 66, 193, 0.1);
}

.node-parallel .node-type {
  background-color: rgba(111, 66, 193, 0.2);
  color: #6f42c1;
}

.node-restApi {
  border-color: #6c757d;
  background-color: rgba(108, 117, 125, 0.1);
}

.node-restApi .node-type {
  background-color: rgba(108, 117, 125, 0.2);
  color: #6c757d;
}

.node-config-display {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--node-border);
}

.config-item {
  font-size: 0.85rem;
  color: var(--secondary-color);
  margin-bottom: 0.3rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.config-item i {
  margin-right: 0.3rem;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--node-border);
}

.node-title {
  font-weight: bold;
  font-size: 1rem;
}

.node-type {
  font-size: 0.8rem;
  color: var(--secondary-color);
  background-color: rgba(108, 117, 125, 0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
}

.node-content {
  margin-bottom: 0.5rem;
}

.node-input, .node-output, .node-next, .node-end, .node-path {
  margin-bottom: 0.3rem;
  font-size: 0.9rem;
}

.true-path {
  color: #28a745;
}

.false-path {
  color: #dc3545;
}

.node-attributes {
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  font-size: 0.9rem;
}

.attribute-section {
  margin-bottom: 0.3rem;
}

.attribute-item {
  margin-left: 0.5rem;
  margin-top: 0.2rem;
  display: flex;
}

.attribute-key {
  font-weight: bold;
  margin-right: 0.3rem;
}

.attribute-value {
  color: var(--secondary-color);
}

.connection-point {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: var(--primary-color);
  position: absolute;
  cursor: pointer;
  z-index: 4;
}

.connection-point.input {
  top: 50%;
  left: -6px;
  transform: translateY(-50%);
}

.connection-point.output {
  top: 50%;
  right: -6px;
  transform: translateY(-50%);
}

/* True/False connection points */
.connection-point.true {
  top: 35%;
  right: -6px;
  background-color: #28a745;
}

.connection-point.false {
  top: 65%;
  right: -6px;
  background-color: #dc3545;
}

.connection-label {
  position: absolute;
  right: 15px;
  top: -2px;
  font-size: 10px;
  font-weight: bold;
}

.connection-point.true .connection-label {
  color: #28a745;
}

.connection-point.false .connection-label {
  color: #dc3545;
}

.connection-point:hover {
  transform: translateY(-50%) scale(1.2);
}

.connection-point.true:hover,
.connection-point.false:hover {
  transform: scale(1.2);
}
</style>
