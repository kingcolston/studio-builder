<template>
  <div class="node-config-form">
    <h4>{{ nodeType.label }} Configuration</h4>
    
    <!-- Node Attributes Section -->
    <div class="node-attributes-section">
      <h5>Node Attributes</h5>
      
      <!-- Next Node -->
      <div class="form-group">
        <label class="form-label">Next Node</label>
        <select 
          class="form-control" 
          :value="getNextNodeName()"
          @change="updateNextNode($event.target.value)"
        >
          <option value="">None</option>
          <option 
            v-for="availNode in availableNodes" 
            :key="availNode.id" 
            :value="availNode.name"
          >
            {{ availNode.name }}
          </option>
        </select>
      </div>
      
      <!-- End Flag -->
      <div class="form-group">
        <div class="form-check">
          <input 
            type="checkbox" 
            class="form-check-input" 
            :checked="node.end"
            @change="updateEndFlag($event.target.checked)"
            id="end-flag"
          >
          <label class="form-check-label" for="end-flag">
            End Node (Terminates Flow)
          </label>
        </div>
      </div>
    </div>
    
    <!-- Node Type Specific Configuration -->
    <div class="node-type-config">
      <h5>Type-Specific Configuration</h5>
      <template v-if="nodeType.formFields && nodeType.formFields.length > 0">
        <div 
          v-for="(field, index) in nodeType.formFields" 
          :key="index"
          class="form-group"
          v-show="shouldShowField(field)"
        >
          <label class="form-label">{{ field.label }}</label>
          
          <!-- Text input -->
          <input 
            v-if="field.type === 'text'"
            type="text" 
            class="form-control" 
            :value="getFieldValue(field.name)"
            @input="updateField(field.name, $event.target.value)"
            :placeholder="field.placeholder || ''"
            :required="field.required"
          >
          
          <!-- Number input -->
          <input 
            v-else-if="field.type === 'number'"
            type="number" 
            class="form-control" 
            :value="getFieldValue(field.name)"
            @input="updateField(field.name, $event.target.value)"
            :placeholder="field.placeholder || ''"
            :required="field.required"
          >
          
          <!-- Checkbox -->
          <div v-else-if="field.type === 'checkbox'" class="form-check">
            <input 
              type="checkbox" 
              class="form-check-input" 
              :checked="getFieldValue(field.name)"
              @change="updateField(field.name, $event.target.checked)"
              :id="`field-${field.name}`"
            >
            <label class="form-check-label" :for="`field-${field.name}`">
              {{ field.label }}
            </label>
          </div>
          
          <!-- Select dropdown -->
          <select 
            v-else-if="field.type === 'select'"
            class="form-control" 
            :value="getFieldValue(field.name)"
            @change="updateField(field.name, $event.target.value)"
            :required="field.required"
          >
            <option value="">Select an option</option>
            <option 
              v-for="option in field.options" 
              :key="option.value" 
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          
          <!-- Node select dropdown -->
          <select 
            v-else-if="field.type === 'node-select'"
            class="form-control" 
            :value="getNodeNameById(getFieldValue(field.name))"
            @change="updateNodeField(field.name, $event.target.value)"
            :required="field.required"
          >
            <option value="">{{ field.placeholder || 'Select a node' }}</option>
            <option 
              v-for="availNode in availableNodes" 
              :key="availNode.id" 
              :value="availNode.name"
            >
              {{ availNode.name }}
            </option>
          </select>
          
          <!-- Node multi-select for parallel nodes -->
          <div v-else-if="field.type === 'node-multi-select'">
            <div 
              v-for="(nodeId, nodeIndex) in getNodeIdsArray()" 
              :key="nodeIndex"
              class="node-select-item"
            >
              <select 
                class="form-control" 
                :value="getNodeNameById(nodeId)"
                @change="updateNodeId(nodeIndex, getNodeIdByName($event.target.value))"
              >
                <option value="">{{ field.placeholder || 'Select a node' }}</option>
                <option 
                  v-for="availNode in availableNodes" 
                  :key="availNode.id" 
                  :value="availNode.name"
                >
                  {{ availNode.name }}
                </option>
              </select>
              <button 
                class="btn btn-sm btn-danger" 
                @click="removeNodeId(nodeIndex)"
              >
                Remove
              </button>
            </div>
            <button 
              class="btn btn-sm btn-primary mt-2" 
              @click="addNodeId"
            >
              Add Node
            </button>
          </div>
          
          <!-- Default fallback to text input -->
          <input 
            v-else
            type="text" 
            class="form-control" 
            :value="getFieldValue(field.name)"
            @input="updateField(field.name, $event.target.value)"
            :placeholder="field.placeholder || ''"
            :required="field.required"
          >
        </div>
      </template>
      
      <div v-else class="no-config-message">
        No type-specific configuration options available for this node type.
      </div>
    </div>
  </div>
</template>

<script>
import { computed, reactive, watch, inject } from 'vue';
import { getNodeType } from '../models';
import { useFlowStore } from '../store/flowStore';

export default {
  name: 'NodeConfigForm',
  props: {
    node: {
      type: Object,
      required: true
    },
    availableNodes: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update'],
  setup(props, { emit }) {
    const flowStore = useFlowStore();
    
    // Get the node type configuration
    const nodeType = computed(() => {
      return getNodeType(props.node.nodeType) || {};
    });
    
    // Initialize config if it doesn't exist
    if (!props.node.config) {
      props.node.config = {};
    }
    
    // Initialize nodeAttributes if it doesn't exist
    if (!props.node.nodeAttributes) {
      props.node.nodeAttributes = {};
    }
    
    // Determine if a field should be shown based on its showWhen property
    const shouldShowField = (field) => {
      if (!field.showWhen) return true;
      return field.showWhen(props.node.config);
    };
    
    // Get a field value from the node config
    const getFieldValue = (fieldName) => {
      return props.node.config[fieldName];
    };
    
    // Update a field value in the node config
    const updateField = (fieldName, value) => {
      const updatedConfig = { 
        ...props.node.config,
        [fieldName]: value
      };
      
      emit('update', {
        config: updatedConfig,
        nodeAttributes: props.node.nodeAttributes,
        next: props.node.next,
        end: props.node.end
      });
    };
    
    // Get the name of a node by its ID
    const getNodeNameById = (nodeId) => {
      if (!nodeId) return '';
      const node = props.availableNodes.find(n => n.id === nodeId);
      return node ? node.name : '';
    };
    
    // Get the ID of a node by its name
    const getNodeIdByName = (nodeName) => {
      if (!nodeName) return null;
      const node = props.availableNodes.find(n => n.name === nodeName);
      return node ? node.id : null;
    };
    
    // Get the name of the next node
    const getNextNodeName = () => {
      return getNodeNameById(props.node.next);
    };
    
    // Update the next node using the node name
    const updateNextNode = (nodeName) => {
      const nodeId = getNodeIdByName(nodeName);
      
      emit('update', {
        config: props.node.config,
        nodeAttributes: props.node.nodeAttributes,
        next: nodeId,
        end: props.node.end
      });
    };
    
    // Update a node field using the node name
    const updateNodeField = (fieldName, nodeName) => {
      const nodeId = getNodeIdByName(nodeName);
      
      const updatedConfig = { 
        ...props.node.config,
        [fieldName]: nodeId
      };
      
      emit('update', {
        config: updatedConfig,
        nodeAttributes: props.node.nodeAttributes,
        next: props.node.next,
        end: props.node.end
      });
    };
    
    // Update the end flag
    const updateEndFlag = (value) => {
      emit('update', {
        config: props.node.config,
        nodeAttributes: props.node.nodeAttributes,
        next: props.node.next,
        end: value
      });
    };
    
    // Get the array of node IDs for parallel nodes
    const getNodeIdsArray = () => {
      if (props.node.nodeType === 'parallel') {
        if (!props.node.config.nodeIds) {
          props.node.config.nodeIds = [];
        }
        return props.node.config.nodeIds;
      }
      return [];
    };
    
    // Add a new node ID to the parallel node
    const addNodeId = () => {
      if (props.node.nodeType === 'parallel') {
        const nodeIds = [...getNodeIdsArray(), ''];
        const updatedConfig = { 
          ...props.node.config,
          nodeIds
        };
        
        emit('update', {
          config: updatedConfig,
          nodeAttributes: props.node.nodeAttributes,
          next: props.node.next,
          end: props.node.end
        });
      }
    };
    
    // Update a node ID in the parallel node
    const updateNodeId = (index, value) => {
      if (props.node.nodeType === 'parallel') {
        const nodeIds = [...getNodeIdsArray()];
        nodeIds[index] = value;
        
        const updatedConfig = { 
          ...props.node.config,
          nodeIds
        };
        
        emit('update', {
          config: updatedConfig,
          nodeAttributes: props.node.nodeAttributes,
          next: props.node.next,
          end: props.node.end
        });
      }
    };
    
    // Remove a node ID from the parallel node
    const removeNodeId = (index) => {
      if (props.node.nodeType === 'parallel') {
        const nodeIds = [...getNodeIdsArray()];
        nodeIds.splice(index, 1);
        
        const updatedConfig = { 
          ...props.node.config,
          nodeIds
        };
        
        emit('update', {
          config: updatedConfig,
          nodeAttributes: props.node.nodeAttributes,
          next: props.node.next,
          end: props.node.end
        });
      }
    };
    
    return {
      nodeType,
      shouldShowField,
      getFieldValue,
      updateField,
      getNodeNameById,
      getNodeIdByName,
      getNextNodeName,
      updateNextNode,
      updateNodeField,
      updateEndFlag,
      getNodeIdsArray,
      addNodeId,
      updateNodeId,
      removeNodeId
    };
  }
};
</script>

<style scoped>
.node-config-form {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  border: 1px solid var(--node-border);
}

.node-config-form h4 {
  margin-bottom: 1rem;
  font-size: 1.1rem;
  color: var(--primary-color);
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

.form-control:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(74, 110, 224, 0.25);
}

.form-check {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.form-check-input {
  margin-right: 0.5rem;
}

.node-select-item {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  align-items: center;
}

.node-select-item .form-control {
  flex: 1;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-danger {
  background-color: var(--danger-color, #dc3545);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.mt-2 {
  margin-top: 0.5rem;
}

.no-config-message {
  color: var(--secondary-color);
  font-style: italic;
}

.node-attributes-section, .node-type-config {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  border: 1px solid var(--node-border);
}

.node-attributes-section h5, .node-type-config h5 {
  margin-bottom: 1rem;
  font-size: 1rem;
  color: var(--primary-color);
}
</style>
