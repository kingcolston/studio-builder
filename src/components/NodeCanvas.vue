<template>
  <div 
    class="canvas" 
    ref="canvasRef"
    @dragover.prevent
    @drop="onDrop"
    @click="deselectAll"
    @mousedown="onCanvasMouseDown"
    @mouseup="onCanvasMouseUp"
    @mousemove="onCanvasMouseMove"
  >
    <NodeElement
      v-for="node in nodes"
      :key="node.id"
      :node="node"
      :selected="selectedNodeId === node.id"
      @select="selectNode"
      @move="moveNode"
      @connection-start="startConnection"
      @connection-end="endConnection"
    />
    
    <svg class="connections-layer">
      <!-- Arrow marker definitions -->
      <defs>
        <marker
          id="arrowhead"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--connection-line, #6c757d)" />
        </marker>
        <marker
          id="arrowhead-drawing"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--connection-line, #6c757d)" />
        </marker>
        <marker
          id="arrowhead-selected"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--primary-color, #4a6ee0)" />
        </marker>
      </defs>
      
      <!-- Existing connections -->
      <path 
        v-for="connection in connections" 
        :key="connection.id"
        :d="getConnectionPath(connection)"
        :class="['connection-line', { selected: selectedConnectionId === connection.id }]"
        :marker-end="selectedConnectionId === connection.id ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'"
        @click.stop="selectConnection(connection)"
      />
      
      <!-- Connection being drawn -->
      <path 
        v-if="drawingConnection"
        :d="getDrawingConnectionPath()"
        class="connection-line drawing"
        marker-end="url(#arrowhead-drawing)"
      />
    </svg>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import NodeElement from './NodeElement.vue';
import { v4 as uuidv4 } from 'uuid';
import { createNode, getNodeType } from '../models';

export default {
  name: 'NodeCanvas',
  components: {
    NodeElement
  },
  props: {
    nodes: {
      type: Array,
      required: true
    },
    connections: {
      type: Array,
      required: true
    }
  },
  emits: [
    'node-added',
    'node-selected',
    'node-moved',
    'connection-created',
    'connection-removed'
  ],
  setup(props, { emit }) {
    const canvasRef = ref(null);
    const selectedNodeId = ref(null);
    const selectedConnectionId = ref(null);
    
    // For connection drawing
    const drawingConnection = ref(false);
    const connectionSource = ref(null);
    const connectionTarget = ref(null);
    const mousePosition = ref({ x: 0, y: 0 });
    
    // For node dragging
    const isDragging = ref(false);
    const dragOffset = ref({ x: 0, y: 0 });
    
    // Node dimensions (approximate)
    const NODE_WIDTH = 150;
    const NODE_HEIGHT = 80;
    
    const onDrop = (event) => {
      event.preventDefault();
      
      try {
        const nodeTypeData = event.dataTransfer.getData('nodeType');
        if (!nodeTypeData) return;
        
        const nodeType = JSON.parse(nodeTypeData);
        const canvasRect = canvasRef.value.getBoundingClientRect();
        
        // Calculate the position where the node should be placed
        const position = {
          x: event.clientX - canvasRect.left,
          y: event.clientY - canvasRect.top
        };
        
        // Use the createNode helper to create a new node with the appropriate configuration
        const node = createNode(nodeType.type, position);
        
        // Generate a unique ID for the node
        node.id = uuidv4();
        
        // Add a timestamp to the name to make it unique
        node.name = `${nodeType.label} ${Date.now().toString().slice(-4)}`;
        
        emit('node-added', node);
      } catch (error) {
        console.error('Error adding node:', error);
      }
    };
    
    const selectNode = (nodeId) => {
      selectedNodeId.value = nodeId;
      selectedConnectionId.value = null;
      
      const node = props.nodes.find(n => n.id === nodeId);
      if (node) {
        emit('node-selected', node);
      }
    };
    
    const deselectAll = () => {
      selectedNodeId.value = null;
      selectedConnectionId.value = null;
      emit('node-selected', null);
    };
    
    const moveNode = (nodeId, position) => {
      emit('node-moved', nodeId, position);
    };
    
    const startConnection = (nodeId, position) => {
      drawingConnection.value = true;
      connectionSource.value = {
        nodeId,
        position
      };
      mousePosition.value = position;
    };
    
    const endConnection = (nodeId, position) => {
      if (drawingConnection.value && connectionSource.value && connectionSource.value.nodeId !== nodeId) {
        const connection = {
          id: uuidv4(),
          sourceId: connectionSource.value.nodeId,
          targetId: nodeId
        };
        
        emit('connection-created', connection);
      }
      
      drawingConnection.value = false;
      connectionSource.value = null;
      connectionTarget.value = null;
    };
    
    const onCanvasMouseMove = (event) => {
      if (drawingConnection.value) {
        const canvasRect = canvasRef.value.getBoundingClientRect();
        mousePosition.value = {
          x: event.clientX - canvasRect.left,
          y: event.clientY - canvasRect.top
        };
      }
    };
    
    const onCanvasMouseDown = (event) => {
      // Handle canvas mouse down events if needed
    };
    
    const onCanvasMouseUp = (event) => {
      if (drawingConnection.value) {
        drawingConnection.value = false;
        connectionSource.value = null;
        connectionTarget.value = null;
      }
    };
    
    const selectConnection = (connection) => {
      selectedConnectionId.value = connection.id;
      selectedNodeId.value = null;
      
      // You could emit an event here if you want to show connection properties
    };
    
    const getConnectionPath = (connection) => {
      const sourceNode = props.nodes.find(n => n.id === connection.sourceId);
      const targetNode = props.nodes.find(n => n.id === connection.targetId);
      
      if (!sourceNode || !targetNode) return '';
      
      // Calculate source and target points
      const sourcePoint = {
        x: sourceNode.position.x + NODE_WIDTH, // Right edge of source node
        y: sourceNode.position.y + NODE_HEIGHT / 2 // Middle of source node
      };
      
      const targetPoint = {
        x: targetNode.position.x, // Left edge of target node
        y: targetNode.position.y + NODE_HEIGHT / 2 // Middle of target node
      };
      
      // Calculate control points for a smooth curve
      const distance = Math.sqrt(
        Math.pow(targetPoint.x - sourcePoint.x, 2) + 
        Math.pow(targetPoint.y - sourcePoint.y, 2)
      );
      
      // Adjust control point distance based on the distance between nodes
      const controlPointDistance = Math.min(distance / 2, 100);
      
      // Create control points
      const cp1 = {
        x: sourcePoint.x + controlPointDistance,
        y: sourcePoint.y
      };
      
      const cp2 = {
        x: targetPoint.x - controlPointDistance,
        y: targetPoint.y
      };
      
      // Create a bezier curve path
      return `M ${sourcePoint.x} ${sourcePoint.y} 
              C ${cp1.x} ${cp1.y}, 
                ${cp2.x} ${cp2.y}, 
                ${targetPoint.x} ${targetPoint.y}`;
    };
    
    const getDrawingConnectionPath = () => {
      if (!connectionSource.value) return '';
      
      const sourcePoint = connectionSource.value.position;
      const targetPoint = mousePosition.value;
      
      // Calculate control points for a smooth curve
      const distance = Math.sqrt(
        Math.pow(targetPoint.x - sourcePoint.x, 2) + 
        Math.pow(targetPoint.y - sourcePoint.y, 2)
      );
      
      // Adjust control point distance based on the distance between nodes
      const controlPointDistance = Math.min(distance / 2, 100);
      
      // Create control points
      const cp1 = {
        x: sourcePoint.x + controlPointDistance,
        y: sourcePoint.y
      };
      
      const cp2 = {
        x: targetPoint.x - controlPointDistance,
        y: targetPoint.y
      };
      
      // Create a bezier curve path
      return `M ${sourcePoint.x} ${sourcePoint.y} 
              C ${cp1.x} ${cp1.y}, 
                ${cp2.x} ${cp2.y}, 
                ${targetPoint.x} ${targetPoint.y}`;
    };
    
    return {
      canvasRef,
      selectedNodeId,
      selectedConnectionId,
      drawingConnection,
      connectionSource,
      connectionTarget,
      mousePosition,
      onDrop,
      selectNode,
      deselectAll,
      moveNode,
      startConnection,
      endConnection,
      onCanvasMouseDown,
      onCanvasMouseUp,
      onCanvasMouseMove,
      selectConnection,
      getConnectionPath,
      getDrawingConnectionPath
    };
  }
};
</script>

<style>
.canvas {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: var(--canvas-bg);
  overflow: auto;
}

.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.connection-line {
  stroke: var(--connection-line);
  stroke-width: 2px;
  fill: none;
  pointer-events: stroke;
  cursor: pointer;
}

.connection-line.drawing {
  stroke-dasharray: 5, 5;
  animation: dash 1s linear infinite;
}

.connection-line.selected {
  stroke: var(--primary-color);
  stroke-width: 3px;
}

/* Add a selected marker for connections */
marker#arrowhead-selected {
  fill: var(--primary-color);
}

/* Make sure the arrowheads are visible */
.connection-line {
  stroke-linecap: round;
  stroke-linejoin: round;
}

@keyframes dash {
  to {
    stroke-dashoffset: -10;
  }
}
</style>
