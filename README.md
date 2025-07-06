# **`feature-flag-manager-ts` \- Robust Client-Side Feature Flag Manager**

A universal TypeScript-first npm package for managing client-side feature flags, enabling progressive feature rollout, A/B testing, and dynamic configuration in your web applications.

## **✨ Features**

* **Framework Agnostic:** Use with any frontend framework (React, Vue, Angular, Svelte, vanilla JS).  
* **Strongly Typed:** Fully written in TypeScript, providing excellent type definitions for feature flag names and values, preventing common errors.  
* **Flexible Flag Definitions:** Define flags with default values, descriptions, and expected types (`boolean`, `string`, `number`).  
* **Multiple Override Sources:**  
  * **URL Parameters:** Override flags directly via query parameters (e.g., `?ff_newFeature=true`). Ideal for quick local testing.  
  * **Local Storage:** Persist flag overrides in the user's browser for consistent testing across sessions.  
  * **JSON Endpoint:** Fetch dynamic flag configurations from a remote API, with optional polling for real-time updates.  
* **Reactive Updates:** Subscribe to changes in boolean feature flag states to dynamically update your UI.  
* **Singleton Instance:** Provides a convenient singleton `featureFlagManager` for easy access throughout your application.  
* **Robust Error Handling:** Includes warnings and errors for duplicate flag names, type mismatches, and API issues.

## **🚀 Installation**

Install the package using npm or yarn:

npm install feature-flag-manager-ts  
\# or  
yarn add feature-flag-manager-ts

## **🛠️ Usage**

The `featureFlagManager` singleton is your primary interface for interacting with the feature flag system.

### **1\. Initialize the Feature Flag Manager**

You should initialize the manager once, typically at the very beginning of your application's lifecycle (e.g., in your `main.ts`, `App.tsx`, or `index.js` file).

// main.ts or App.tsx

import { featureFlagManager } from 'your-feature-flag-package';

// Define your feature flags and their default states  
const featureFlagsConfig \= {  
  flags: \[  
    {  
      name: 'newDashboardUI',  
      defaultValue: false,  
      description: 'Enables the redesigned dashboard user interface.',  
      type: 'boolean',  
    },  
    {  
      name: 'welcomeMessage',  
      defaultValue: 'Hello, User\!',  
      description: 'The message displayed on the welcome banner.',  
      type: 'string',  
    },  
    {  
      name: 'maxItemsPerPage',  
      defaultValue: 10,  
      description: 'Maximum number of items to display per page.',  
      type: 'number',  
    },  
    {  
      name: 'experimentalFeatureA',  
      defaultValue: false,  
      description: 'An experimental feature that might be removed.',  
    }  
  \],  
  sources: \[  
    // Optional: Load overrides from URL query parameters (e.g., ?newDashboardUI=true)  
    { type: 'urlParam' },  
    // Optional: Load overrides from Local Storage  
    { type: 'localStorage', key: 'myAppFeatureFlags' },  
    // Optional: Load dynamic overrides from a remote JSON endpoint  
    // The endpoint should return a JSON object like: { "newDashboardUI": true, "welcomeMessage": "Welcome Back\!" }  
    {  
      type: 'jsonEndpoint',  
      url: '/api/feature-flags', // Replace with your actual API endpoint  
      method: 'GET',  
      headers: { 'X-App-Version': '1.0.0' },  
      intervalMs: 300000, // Optional: Poll every 5 minutes (300000 ms)  
    },  
  \],  
};

featureFlagManager.initializeFeatureFlags(featureFlagsConfig);

// It's good practice to destroy the manager when your app unmounts (e.g., in SPAs)  
// window.addEventListener('beforeunload', () \=\> featureFlagManager.destroy());

### **2\. Check Feature Flag States**

#### **`isFeatureEnabled(featureName: string): boolean`**

Use this for boolean feature flags. It returns `true` if the flag is enabled, `false` otherwise. If the flag is not defined or is not a boolean, it will warn and return `false` (or throw an error if you prefer stricter behavior).

import { featureFlagManager } from 'your-feature-flag-package';

if (featureFlagManager.isFeatureEnabled('newDashboardUI')) {  
  // Render the new dashboard UI  
  console.log('New dashboard UI is enabled\!');  
} else {  
  // Render the old dashboard UI  
  console.log('Old dashboard UI is active.');  
}

#### **`getFeatureValue<T extends FeatureFlagValue>(featureName: string, defaultValue: T): T`**

Use this to retrieve the value of any feature flag (boolean, string, or number). It provides a type-safe way to get the flag's current value, falling back to `defaultValue` if the flag is not found or its type doesn't match the definition.

import { featureFlagManager } \=\> 'your-feature-flag-package';

const welcomeMessage \= featureFlagManager.getFeatureValue('welcomeMessage', 'Default Welcome\!');  
console.log(\`Displaying welcome message: "${welcomeMessage}"\`);

const itemsPerPage \= featureFlagManager.getFeatureValue('maxItemsPerPage', 20);  
console.log(\`Showing ${itemsPerPage} items per page.\`);

const isExperimentalEnabled \= featureFlagManager.getFeatureValue('experimentalFeatureA', false);  
if (isExperimentalEnabled) {  
  console.log('Experimental feature A is active\!');  
}

### **3\. React to Feature Flag Changes**

#### **`onFeatureChange(featureName: string, callback: (isEnabled: boolean) => void): () => void`**

Subscribe to changes in boolean feature flags. This is particularly useful for dynamically updating UI components without a full page reload, especially when flags are updated from a polling JSON endpoint. The returned function can be called to unsubscribe.

import { featureFlagManager } from 'your-feature-flag-package';

// Example in a React component (using useEffect for lifecycle management)  
// Or in vanilla JS, you'd manage the unsubscribe function manually.

// In a React Component:  
// import React, { useEffect, useState } from 'react';  
// import { featureFlagManager } from 'your-feature-flag-package';

// function MyComponent() {  
//   const \[showNewUI, setShowNewUI\] \= useState(featureFlagManager.isFeatureEnabled('newDashboardUI'));

//   useEffect(() \=\> {  
//     const unsubscribe \= featureFlagManager.onFeatureChange('newDashboardUI', (isEnabled) \=\> {  
//       setShowNewUI(isEnabled);  
//       console.log(\`Feature 'newDashboardUI' changed to: ${isEnabled}\`);  
//     });

//     // Clean up the subscription when the component unmounts  
//     return () \=\> unsubscribe();  
//   }, \[\]); // Empty dependency array means this runs once on mount

//   return (  
//     \<div\>  
//       {showNewUI ? (  
//         \<h1\>Welcome to the New Dashboard\!\</h1\>  
//       ) : (  
//         \<h2\>Welcome to the Old Dashboard.\</h2\>  
//       )}  
//     \</div\>  
//   );  
// }

// export default MyComponent;

// \--- Vanilla JavaScript Example \---  
let isNewUIDisplayed \= featureFlagManager.isFeatureEnabled('newDashboardUI');  
const updateUI \= (isEnabled: boolean) \=\> {  
  isNewUIDisplayed \= isEnabled;  
  console.log(\`Vanilla JS: New UI state: ${isEnabled}\`);  
  // Logic to update DOM based on isEnabled  
};

const unsubscribe \= featureFlagManager.onFeatureChange('newDashboardUI', updateUI);

// Later, to stop listening:  
// unsubscribe();

### **4\. Cleanup**

#### **`destroy(): void`**

It's good practice to call `destroy()` on the `featureFlagManager` when your application is shutting down or unmounting (especially in Single Page Applications) to clear any active listeners or polling intervals and prevent memory leaks.

import { featureFlagManager } from 'your-feature-flag-package';

// When your application (or a specific part using the manager) is no longer needed  
// For example, in a React App's root component cleanup, or a global event listener  
// window.addEventListener('beforeunload', () \=\> {  
//   featureFlagManager.destroy();  
//   console.log('Feature flag manager cleaned up.');  
// });

## **⚙️ Configuration Details**

### **`FeatureFlagConfig`**

The main configuration object passed to `initializeFeatureFlags`.

interface FeatureFlagConfig {  
  flags: FeatureFlagDefinition\[\];  
  sources?: FeatureFlagSourceConfig\[\];  
}

interface FeatureFlagDefinition {  
  name: string;  
  defaultValue: boolean | string | number;  
  description?: string;  
  type?: 'boolean' | 'string' | 'number'; // Optional, but recommended for strictness  
}

### **`FeatureFlagSourceConfig`**

Defines where the manager should look for flag overrides. Sources are processed in the order they appear in the `sources` array, with later sources potentially overriding earlier ones. However, the internal implementation prioritizes URL parameters first, then Local Storage, then JSON endpoints.

* **`{ type: 'urlParam', prefix?: string }`**  
  * Looks for flags in `window.location.search`.  
  * Example: If `prefix` is `'ff_'`, then `?ff_myFeature=true` would override `myFeature`. If no prefix, `?myFeature=true`.  
  * Values `true` and `false` are parsed as booleans. Numbers are parsed as numbers. Otherwise, they remain strings.  
* **`{ type: 'localStorage', key: string }`**  
  * Looks for a JSON string in `localStorage` under the specified `key`.  
  * The JSON should be an object mapping flag names to their override values: `{"newFeature": true, "welcomeMessage": "Hello!"}`.  
* **`{ type: 'jsonEndpoint', url: string, method?: 'GET' | 'POST', headers?: Record<string, string>, intervalMs?: number }`**  
  * Fetches flag overrides from a remote URL.  
  * The endpoint should return a JSON object like `{"featureA": true, "featureB": "variantX"}`.  
  * `intervalMs`: If provided (and greater than 0), the manager will periodically refetch flags from this endpoint, allowing for dynamic updates without a page refresh. Changes will trigger `onFeatureChange` listeners.

## **🤝 Contributing**

Contributions are welcome\! If you have suggestions for improvements, new features, or bug fixes, please open an issue or submit a pull request.

1. Fork the repository.  
2. Create your feature branch (`git checkout -b feature/Production`).  
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).  
4. Push to the branch (`git push origin feature/Production`).  
5. Open a Pull Request.

## **📄 License**

Distributed under the MIT License. See `LICENSE` for more information.

