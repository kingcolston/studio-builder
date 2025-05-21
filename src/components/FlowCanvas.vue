<template>
  <div 
    class="flow-canvas" 
    :class="{ active }"
    :style="flowStyle"
    @mousedown.stop="onFlowMouseDown"
    @click.stop="onFlowClick"
  >
    <div class="flow-header">
      <div class="flow-title">{{ flow.name }}</div>
      <div class="flow-actions">
        <button class="btn btn-sm" @click.stop="$emit('edit-flow', flow.id)">
          <i class="fas fa-cog"></i>
        </button>
        <button class="btn btn-sm" @click.stop="$emit('export-flow', flow.id)">
          <i class="fas fa-download"></i>
        </button>
        <button class="btn btn-sm btn-danger" @click.stop="$emit('delete-flow', flow.id)">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
    
    <NodeCanvas 
      ref="canvas"
      :nodes="flow.nodes" 
      :connections="flow.connections"
      @node-added="onNodeAdded"
      @node-selected="onNodeSelected"
      @node-moved="onNodeMoved"
      @connection-created="onConnectionCreated"
      @connection-removed="onConnectionRemoved"
    />
    
    <!-- Resize handles -->
    <div class="resize-handle resize-handle-e" @mousedown.stop="onResizeStart('e')"></div>
    <div class="resize-handle resize-handle-s" @mousedown.stop="onResizeStart('s')"></div>
    <div class="resize-handle resize-handle-se" @mousedown.stop="onResizeStart('se')"></div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import NodeCanvas from './NodeCanvas.vue';
import { useNodeStore } from '../store';
import { useFlowStore } from '../store/flowStore';

export default {
  name: 'FlowCanvas',
  components: {
    NodeCanvas
  },
  props: {
    flow: {
      type: Object,
      required: true
    },
    active: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'select-flow',
    'edit-flow',
    'export-flow',
    'delete-flow'
  ],
  setup(props, { emit }) {
    const canvas = ref(null);
    const nodeStore = useNodeStore();
    const flowStore = useFlowStore();
    
    const isDragging = ref(false);
    const dragOffset = ref({ x: 0, y: 0 });
    
    const isResizing = ref(false);
    const resizeDirection = ref('');
    const resizeStartDimensions = ref({ width: 0, height: 0 });
    const resizeStartPosition = ref({ x: 0, y: 0 });
    
    const flowStyle = computed(() => {
      return {
        left: `${props.flow.position.x}px`,
        top: `${props.flow.position.y}px`,
        width: `${props.flow.dimensions.width}px`,
        height: `${props.flow.dimensions.height}px`,
        zIndex: props.active ? 10 : 1
      };
    });
    
    const onFlowClick = () => {
      emit('select-flow', props.flow.id);
    };
    
    const onFlowMouseDown = (event) => {
      // Only allow dragging from the header
      if (!event.target.closest('.flow-header')) return;
      
      isDragging.value = true;
      
      // Calculate the offset between mouse position and flow position
      dragOffset.value = {
        x: event.clientX - props.flow.position.x,
        y: event.clientY - props.flow.position.y
      };
      
      // Select the flow
      emit('select-flow', props.flow.id);
      
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
        
        flowStore.updateFlowPosition(props.flow.id, newPosition);
      }
      
      if (isResizing.value) {
        const dx = event.clientX - resizeStartPosition.value.x;
        const dy = event.clientY - resizeStartPosition.value.y;
        
        let newWidth = resizeStartDimensions.value.width;
        let newHeight = resizeStartDimensions.value.height;
        
        // Handle different resize directions
        if (resizeDirection.value.includes('e')) {
          newWidth = Math.max(200, resizeStartDimensions.value.width + dx);
        }
        
        if (resizeDirection.value.includes('s')) {
          newHeight = Math.max(150, resizeStartDimensions.value.height + dy);
        }
        
        flowStore.updateFlowDimensions(props.flow.id, { width: newWidth, height: newHeight });
      }
    };
    
    const onMouseUp = () => {
      isDragging.value = false;
      isResizing.value = false;
      
      // Remove global event listeners
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    const onResizeStart = (direction) => {
      isResizing.value = true;
      resizeDirection.value = direction;
      
      // Store the starting dimensions and mouse position
      resizeStartDimensions.value = { ...props.flow.dimensions };
      resizeStartPosition.value = {
        x: event.clientX,
        y: event.clientY
      };
      
      // Select the flow
      emit('select-flow', props.flow.id);
      
      // Add global event listeners
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };
    
    // NodeCanvas event handlers
    const onNodeAdded = (node) => {
      if (props.active) {
        nodeStore.addNode(node);
        flowStore.syncNodesAndConnections();
      }
    };
    
    const onNodeSelected = (node) => {
      if (props.active) {
        emit('select-flow', props.flow.id);
      }
    };
    
    const onNodeMoved = (nodeId, position) => {
      if (props.active) {
        nodeStore.updateNodePosition(nodeId, position);
        flowStore.syncNodesAndConnections();
      }
    };
    
    const onConnectionCreated = (connection) => {
      if (props.active) {
        nodeStore.addConnection(connection);
        flowStore.syncNodesAndConnections();
      }
    };
    
    const onConnectionRemoved = (connectionId) => {
      if (props.active) {
        nodeStore.removeConnection(connectionId);
        flowStore.syncNodesAndConnections();
      }
    };
    
    // Clean up event listeners when component is unmounted
    onUnmounted(() => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    });
    
    return {
      canvas,
      flowStyle,
      onFlowClick,
      onFlowMouseDown,
      onResizeStart,
      onNodeAdded,
      onNodeSelected,
      onNodeMoved,
      onConnectionCreated,
      onConnectionRemoved
    };
  }
};
</script>

<style scoped>
.flow-canvas {
  position: absolute;
  background-color: var(--canvas-bg);
  border: 2px solid var(--primary-color);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  min-width: 200px;
  min-height: 150px;
}

.flow-canvas.active {
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(74, 110, 224, 0.2);
}

.flow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: white;
  cursor: move;
}

.flow-title {
  font-weight: bold;
  font-size: 1rem;
}

.flow-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  background-color: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}

.btn-sm:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.btn-danger {
  background-color: rgba(220, 53, 69, 0.7);
}

.btn-danger:hover {
  background-color: rgba(220, 53, 69, 0.9);
}

/* Resize handles */
.resize-handle {
  position: absolute;
  background-color: var(--primary-color);
  z-index: 20;
}

.resize-handle-e {
  cursor: e-resize;
  width: 6px;
  height: calc(100% - 12px);
  right: 0;
  top: 6px;
}

.resize-handle-s {
  cursor: s-resize;
  height: 6px;
  width: calc(100% - 12px);
  bottom: 0;
  left: 6px;
}

.resize-handle-se {
  cursor: se-resize;
  width: 12px;
  height: 12px;
  right: 0;
  bottom: 0;
  border-radius: 0 0 8px 0;
}
</style>
