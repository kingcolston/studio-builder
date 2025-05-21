# Node Flow Editor

A Vue.js application for creating node-based flows with drag-and-drop functionality. This application allows users to create, connect, and configure different types of nodes to build a flow that can be exported as JSON.

## Features

- Drag and drop nodes onto a canvas
- Connect nodes with arrows to create a flow
- Configure node properties with a dynamic form
- Export the flow as a JSON file
- Different node types with specific configurations:
  - Start node: Entry point of the flow
  - Execute node: Executes other JSON config files
  - Conditional node: Evaluates a condition and directs flow accordingly
  - Parallel node: Executes multiple nodes in parallel
  - End node: Exit point of the flow

## Project Structure

```
node-flow-editor/
├── src/
│   ├── assets/
│   │   └── main.css
│   ├── components/
│   │   ├── NodeCanvas.vue
│   │   ├── NodeElement.vue
│   │   └── NodeConfigForm.vue
│   ├── models/
│   │   ├── baseNodeType.js
│   │   ├── startNodeType.js
│   │   ├── executeNodeType.js
│   │   ├── conditionalNodeType.js
│   │   ├── parallelNodeType.js
│   │   ├── endNodeType.js
│   │   └── index.js
│   ├── store/
│   │   └── index.js
│   ├── App.vue
│   └── main.js
├── index.html
├── package.json
└── vite.config.js
```

## Node Structure

Each node in the flow has the following structure:

- `id`: A unique identifier for the node
- `nodeType`: The type of the node (e.g., 'start', 'execute', 'conditional', 'parallel', 'end')
- `name`: A display name for the node
- `position`: The position of the node on the canvas (x, y coordinates)
- `nodeAttributes`: An object containing node attributes
  - `input`: An array of key-value pairs representing input attributes
- `next`: A string referring to the ID of the next node in the flow
- `end`: A boolean determining whether the flow has ended at this node
- `config`: An object containing type-specific configuration values

## Adding or Modifying Node Properties

The application is designed to make it easy to add or modify node properties. Each node type has its own configuration file in the `src/models/` directory. These files define the properties, validation rules, and form fields for each node type.

### Node Type Configuration Structure

Each node type configuration extends the base node type and includes the following properties:

- `type`: The unique identifier for the node type
- `label`: The display name for the node type
- `icon`: The Font Awesome icon class for the node type
- `description`: A description of the node type
- `hasInput`: Whether the node has an input connection point
- `hasOutput`: Whether the node has an output connection point
- `defaultNodeAttributes`: The default node attributes for the node
  - `input`: An array of key-value pairs
- `defaultConfig`: The default configuration values for the node
- `color`: The background color for the node
- `borderColor`: The border color for the node
- `validate`: A function that validates the node configuration
- `methods`: Custom methods for the node type
- `formFields`: The form fields to display in the node properties panel

### Adding a New Node Type

To add a new node type:

1. Create a new file in the `src/models/` directory (e.g., `myNewNodeType.js`)
2. Import the base node type and extend it with your new node type configuration
3. Define the properties, validation rules, and form fields for your new node type
4. Export the new node type
5. Import and add your new node type to the `nodeTypes` array in `src/models/index.js`

Example:

```javascript
// src/models/myNewNodeType.js
import baseNodeType from './baseNodeType';

export default {
  ...baseNodeType,
  
  // Basic properties
  type: 'myNewNode',
  label: 'My New Node',
  icon: 'fas fa-star',
  description: 'A custom node type',
  
  // Connection points
  hasInput: true,
  hasOutput: true,
  
  // Default node attributes
  defaultNodeAttributes: {
    input: [
      { key: 'defaultKey1', value: 'defaultValue1' },
      { key: 'defaultKey2', value: 'defaultValue2' }
    ]
  },
  
  // Default values for type-specific configuration
  defaultConfig: {
    // Custom configuration properties
    customProperty1: '',
    customProperty2: 0,
    customProperty3: false
  },
  
  // UI display options
  color: 'rgba(255, 165, 0, 0.1)',
  borderColor: '#ffa500',
  
  // Validation rules
  validate: (node) => {
    const errors = [];
    
    if (!node.config || !node.config.customProperty1) {
      errors.push('Custom Property 1 is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },
  
  // Custom methods
  methods: {
    // Custom methods for this node type
    customMethod: (node, context) => {
      // Custom logic
      return { success: true };
    }
  },
  
  // Form fields for the node properties panel
  formFields: [
    {
      name: 'customProperty1',
      label: 'Custom Property 1',
      type: 'text',
      required: true,
      placeholder: 'Enter custom property 1'
    },
    {
      name: 'customProperty2',
      label: 'Custom Property 2',
      type: 'number',
      required: false,
      placeholder: 'Enter custom property 2'
    },
    {
      name: 'customProperty3',
      label: 'Custom Property 3',
      type: 'checkbox',
      required: false
    }
  ]
};
```

Then add it to the `nodeTypes` array in `src/models/index.js`:

```javascript
// src/models/index.js
import startNodeType from './startNodeType';
import executeNodeType from './executeNodeType';
import conditionalNodeType from './conditionalNodeType';
import parallelNodeType from './parallelNodeType';
import endNodeType from './endNodeType';
import myNewNodeType from './myNewNodeType'; // Import your new node type

// Export all node types
export const nodeTypes = [
  startNodeType,
  executeNodeType,
  conditionalNodeType,
  parallelNodeType,
  endNodeType,
  myNewNodeType // Add your new node type
];

// Update the nodeTypeMap
export const nodeTypeMap = {
  [startNodeType.type]: startNodeType,
  [executeNodeType.type]: executeNodeType,
  [conditionalNodeType.type]: conditionalNodeType,
  [parallelNodeType.type]: parallelNodeType,
  [endNodeType.type]: endNodeType,
  [myNewNodeType.type]: myNewNodeType // Add your new node type
};

// ... rest of the file
```

### Modifying an Existing Node Type

To modify an existing node type, simply update the corresponding file in the `src/models/` directory. For example, to add a new property to the Execute node type:

1. Open `src/models/executeNodeType.js`
2. Add the new property to the `defaultConfig` object
3. Add a new form field to the `formFields` array

Example:

```javascript
// src/models/executeNodeType.js
export default {
  // ... existing properties
  
  // Default values
  defaultConfig: {
    jsonFile: '',
    parameters: {},
    timeout: 30000,
    retryCount: 0,
    retryDelay: 1000,
    newProperty: 'default value' // Add your new property
  },
  
  // ... existing properties
  
  // Form fields for the node properties panel
  formFields: [
    // ... existing form fields
    {
      name: 'newProperty',
      label: 'New Property',
      type: 'text',
      required: false,
      placeholder: 'Enter new property value'
    }
  ]
};
```

## Supported Form Field Types

The `NodeConfigForm` component supports the following form field types:

- `text`: A text input field
- `number`: A number input field
- `checkbox`: A checkbox input field
- `select`: A dropdown select field with options
- `node-select`: A dropdown select field for selecting a node
- `node-multi-select`: A multi-select field for selecting multiple nodes (used in parallel nodes)

Each form field type has its own set of properties:

- `name`: The name of the property in the node configuration
- `label`: The display label for the form field
- `type`: The type of form field
- `required`: Whether the field is required
- `placeholder`: The placeholder text for the field
- `options`: An array of options for select fields (each option has a `value` and `label`)

## Running the Application

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Build for production:
   ```
   npm run build
   ```

## License

MIT
