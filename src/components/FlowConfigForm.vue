<template>
  <div class="flow-config-form">
    <h4>Flow Configuration</h4>
    
    <!-- Basic Flow Metadata -->
    <div class="config-section">
      <h5>Basic Information</h5>
      
      <div class="form-group">
        <label class="form-label">Flow Name</label>
        <input 
          type="text" 
          class="form-control" 
          v-model="flowData.name"
          @input="updateFlowMetadata"
        >
      </div>
      
      <div class="form-group">
        <label class="form-label">Config ID</label>
        <input 
          type="text" 
          class="form-control" 
          v-model="flowData.configId"
          @input="updateFlowMetadata"
        >
      </div>
      
      <div class="form-group">
        <label class="form-label">Config Type</label>
        <input 
          type="text" 
          class="form-control" 
          v-model="flowData.configType"
          @input="updateFlowMetadata"
        >
      </div>
      
      <div class="form-group">
        <label class="form-label">Config Status</label>
        <select 
          class="form-control" 
          v-model="flowData.configStatus"
          @change="updateFlowMetadata"
        >
          <option value="draft">Draft</option>
          <option value="review">Review</option>
          <option value="approved">Approved</option>
          <option value="published">Published</option>
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label">Config Owner</label>
        <input 
          type="text" 
          class="form-control" 
          v-model="flowData.configOwner"
          @input="updateFlowMetadata"
        >
      </div>
      
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea 
          class="form-control" 
          v-model="flowData.configDescription"
          @input="updateFlowMetadata"
          rows="3"
        ></textarea>
      </div>
    </div>
    
    <!-- Input Parameters -->
    <div class="config-section">
      <h5>Input Parameters</h5>
      
      <div 
        v-for="(value, key) in flowData.input" 
        :key="key"
        class="parameter-item"
      >
        <input 
          type="text" 
          class="form-control parameter-key" 
          :value="key"
          @input="updateInputKey(key, $event.target.value)"
          placeholder="Key"
        >
        <input 
          type="text" 
          class="form-control parameter-value" 
          v-model="flowData.input[key]"
          @input="updateFlowInput"
          placeholder="Value"
        >
        <button 
          class="btn btn-sm btn-danger" 
          @click="removeInputParameter(key)"
        >
          Remove
        </button>
      </div>
      
      <button 
        class="btn btn-sm btn-primary mt-2" 
        @click="addInputParameter"
      >
        Add Input Parameter
      </button>
    </div>
    
    <!-- Required Parameters -->
    <div class="config-section">
      <h5>Required Parameters</h5>
      
      <div 
        v-for="(value, key) in flowData.required" 
        :key="key"
        class="parameter-item"
      >
        <input 
          type="text" 
          class="form-control parameter-key" 
          :value="key"
          @input="updateRequiredKey(key, $event.target.value)"
          placeholder="Key"
        >
        <input 
          type="text" 
          class="form-control parameter-value" 
          v-model="flowData.required[key]"
          @input="updateFlowRequired"
          placeholder="Value"
        >
        <button 
          class="btn btn-sm btn-danger" 
          @click="removeRequiredParameter(key)"
        >
          Remove
        </button>
      </div>
      
      <button 
        class="btn btn-sm btn-primary mt-2" 
        @click="addRequiredParameter"
      >
        Add Required Parameter
      </button>
    </div>
    
    <!-- Import/Export Flow -->
    <div class="config-section">
      <h5>Import/Export Flow</h5>
      
      <!-- Import Flow -->
      <div class="import-section">
        <h6>Import Flow</h6>
        <p class="import-description">
          Import a flow from a JSON file. This will create a new flow that can be referenced by nodes.
        </p>
        
        <div class="form-group">
          <label class="form-label">JSON File</label>
          <input 
            type="file" 
            class="form-control" 
            accept=".json"
            @change="handleFileUpload"
          >
        </div>
        
        <button 
          class="btn btn-primary" 
          @click="importFlow"
          :disabled="!fileToImport"
        >
          Import Flow
        </button>
      </div>
      
      <!-- Export Flow -->
      <div class="export-section mt-3">
        <h6>Export Flow</h6>
        <p class="export-description">
          Export the current flow to a JSON file that can be imported later or used in other systems.
        </p>
        
        <button 
          class="btn btn-primary" 
          @click="exportFlow"
        >
          Export Flow
        </button>
      </div>
      
      <!-- Paste JSON -->
      <div class="paste-section mt-3">
        <h6>Paste JSON</h6>
        <p class="paste-description">
          Paste a JSON flow definition directly to import it.
        </p>
        
        <div class="form-group">
          <textarea 
            class="form-control" 
            v-model="jsonText"
            rows="5"
            placeholder="Paste JSON flow definition here"
          ></textarea>
        </div>
        
        <button 
          class="btn btn-primary" 
          @click="importJsonText"
          :disabled="!jsonText"
        >
          Import from Text
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch } from 'vue';
import { useFlowStore } from '../store/flowStore';

export default {
  name: 'FlowConfigForm',
  props: {
    flow: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const flowStore = useFlowStore();
    const fileToImport = ref(null);
    const jsonText = ref('');
    
    // Create a reactive copy of the flow data
    const flowData = reactive({
      name: props.flow.name,
      configId: props.flow.configId,
      configType: props.flow.configType,
      configStatus: props.flow.configStatus,
      configOwner: props.flow.configOwner,
      configDescription: props.flow.configDescription,
      input: { ...props.flow.input },
      required: { ...props.flow.required }
    });
    
    // Watch for changes in the flow prop
    watch(() => props.flow, (newFlow) => {
      flowData.name = newFlow.name;
      flowData.configId = newFlow.configId;
      flowData.configType = newFlow.configType;
      flowData.configStatus = newFlow.configStatus;
      flowData.configOwner = newFlow.configOwner;
      flowData.configDescription = newFlow.configDescription;
      flowData.input = { ...newFlow.input };
      flowData.required = { ...newFlow.required };
    }, { deep: true });
    
    // Update flow metadata
    const updateFlowMetadata = () => {
      flowStore.updateFlowMetadata(props.flow.id, {
        name: flowData.name,
        configId: flowData.configId,
        configType: flowData.configType,
        configStatus: flowData.configStatus,
        configOwner: flowData.configOwner,
        configDescription: flowData.configDescription
      });
    };
    
    // Update flow input
    const updateFlowInput = () => {
      flowStore.updateFlowInput(props.flow.id, flowData.input);
    };
    
    // Update flow required
    const updateFlowRequired = () => {
      flowStore.updateFlowRequired(props.flow.id, flowData.required);
    };
    
    // Add a new input parameter
    const addInputParameter = () => {
      const newKey = `param${Object.keys(flowData.input).length + 1}`;
      flowData.input[newKey] = '';
      updateFlowInput();
    };
    
    // Remove an input parameter
    const removeInputParameter = (key) => {
      const { [key]: removed, ...rest } = flowData.input;
      flowData.input = rest;
      updateFlowInput();
    };
    
    // Update an input parameter key
    const updateInputKey = (oldKey, newKey) => {
      if (newKey && newKey !== oldKey && !flowData.input[newKey]) {
        const value = flowData.input[oldKey];
        const { [oldKey]: removed, ...rest } = flowData.input;
        flowData.input = { ...rest, [newKey]: value };
        updateFlowInput();
      }
    };
    
    // Add a new required parameter
    const addRequiredParameter = () => {
      const newKey = `requiredParam${Object.keys(flowData.required).length + 1}`;
      flowData.required[newKey] = '';
      updateFlowRequired();
    };
    
    // Remove a required parameter
    const removeRequiredParameter = (key) => {
      const { [key]: removed, ...rest } = flowData.required;
      flowData.required = rest;
      updateFlowRequired();
    };
    
    // Update a required parameter key
    const updateRequiredKey = (oldKey, newKey) => {
      if (newKey && newKey !== oldKey && !flowData.required[newKey]) {
        const value = flowData.required[oldKey];
        const { [oldKey]: removed, ...rest } = flowData.required;
        flowData.required = { ...rest, [newKey]: value };
        updateFlowRequired();
      }
    };
    
    // Handle file upload
    const handleFileUpload = (event) => {
      fileToImport.value = event.target.files[0];
    };
    
    // Import flow from JSON file
    const importFlow = () => {
      if (!fileToImport.value) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = e.target.result;
          const flowId = flowStore.importFlow(jsonData);
          
          if (flowId) {
            // Set the new flow as active
            flowStore.setActiveFlow(flowId);
            
            alert(`Flow imported successfully!`);
            fileToImport.value = null;
          } else {
            alert('Failed to import flow. Invalid JSON format.');
          }
        } catch (error) {
          console.error('Error importing flow:', error);
          alert('Failed to import flow. Invalid JSON format.');
        }
      };
      
      reader.readAsText(fileToImport.value);
    };
    
    // Export flow to JSON
    const exportFlow = () => {
      const exportData = flowStore.exportFlow(props.flow.id);
      if (!exportData) return;
      
      const fileName = `${flowData.name.replace(/\s+/g, '_').toLowerCase()}.json`;
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
    
    // Import flow from pasted JSON text
    const importJsonText = () => {
      if (!jsonText.value) return;
      
      try {
        const flowId = flowStore.importFlow(jsonText.value);
        
        if (flowId) {
          // Set the new flow as active
          flowStore.setActiveFlow(flowId);
          
          alert(`Flow imported successfully!`);
          jsonText.value = '';
        } else {
          alert('Failed to import flow. Invalid JSON format.');
        }
      } catch (error) {
        console.error('Error importing flow:', error);
        alert('Failed to import flow. Invalid JSON format.');
      }
    };
    
    return {
      flowData,
      fileToImport,
      jsonText,
      updateFlowMetadata,
      updateFlowInput,
      updateFlowRequired,
      addInputParameter,
      removeInputParameter,
      updateInputKey,
      addRequiredParameter,
      removeRequiredParameter,
      updateRequiredKey,
      handleFileUpload,
      importFlow,
      exportFlow,
      importJsonText
    };
  }
};
</script>

<style scoped>
.flow-config-form {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  border: 1px solid var(--node-border);
}

.flow-config-form h4 {
  margin-bottom: 1rem;
  font-size: 1.1rem;
  color: var(--primary-color);
}

.config-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  border: 1px solid var(--node-border);
}

.config-section h5 {
  margin-bottom: 1rem;
  font-size: 1rem;
  color: var(--primary-color);
}

.config-section h6 {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
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

.parameter-item {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  align-items: center;
}

.parameter-key {
  flex: 1;
}

.parameter-value {
  flex: 2;
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

.mt-3 {
  margin-top: 1rem;
}

.import-description, .export-description, .paste-description {
  font-size: 0.9rem;
  color: var(--secondary-color);
  margin-bottom: 1rem;
}

.import-section, .export-section, .paste-section {
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.01);
  border-radius: 4px;
  border: 1px solid var(--node-border);
  margin-bottom: 1rem;
}
</style>
