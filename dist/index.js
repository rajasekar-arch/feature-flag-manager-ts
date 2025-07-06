"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureFlagManager = void 0;
/**
 * A robust client-side feature flag manager for progressive feature rollout,
 * A/B testing, and dynamic configuration.
 *
 * This manager allows defining feature flags with default values and
 * overriding them from various sources like URL parameters, Local Storage,
 * or remote JSON endpoints. It provides a type-safe API for checking flag states
 * and listening for changes.
 */
class FeatureFlagManager {
    constructor() {
        // Stores the current active value of each feature flag.
        this.flags = new Map();
        // Stores the original definitions of all feature flags.
        this.definitions = new Map();
        // Stores listeners for feature flag changes.
        this.listeners = new Map();
        // Stores configurations for external sources.
        this.sourceConfigs = [];
        // Stores intervals for JSON endpoint polling.
        this.jsonEndpointIntervals = new Map(); // Using number for setInterval ID
    }
    /**
     * Initializes the FeatureFlagManager with the provided configuration.
     * This method should be called once, typically at application startup.
     *
     * @param config - The FeatureFlagConfig object defining flags and sources.
     * @throws Error if any flag name is duplicated or configuration is invalid.
     */
    initializeFeatureFlags(config) {
        if (!config || !Array.isArray(config.flags)) {
            throw new Error('FeatureFlagManager: Invalid configuration. "flags" array is required.');
        }
        // Clear existing state for re-initialization (useful for testing or dynamic reconfig)
        this.flags.clear();
        this.definitions.clear();
        this.clearAllJsonEndpointIntervals(); // Clear any existing polling intervals
        // 1. Store flag definitions and their default values
        for (const flagDef of config.flags) {
            if (this.definitions.has(flagDef.name)) {
                console.warn(`FeatureFlagManager: Duplicate flag name detected: "${flagDef.name}". The first definition will be used.`);
                continue;
            }
            this.definitions.set(flagDef.name, flagDef);
            this.flags.set(flagDef.name, {
                value: flagDef.defaultValue,
                definition: flagDef,
            });
        }
        this.sourceConfigs = config.sources || [];
        // 2. Apply overrides from sources in a defined order of precedence (URL > Local Storage > JSON)
        // We iterate through sources to apply them. Note: URL params are applied first regardless of order
        // in sourceConfigs, for immediate testing convenience.
        this.loadFlagsFromSources();
        // 3. Set up polling for JSON endpoints if configured
        this.setupJsonEndpointPolling();
        console.log('FeatureFlagManager initialized. Current flags:', Array.from(this.flags.entries()).map(([name, flag]) => ({ name, value: flag.value })));
    }
    /**
     * Checks if a boolean feature flag is enabled.
     * This is a convenience method for boolean flags.
     *
     * @param featureName - The name of the feature flag.
     * @returns `true` if the flag is enabled, `false` otherwise.
     * @throws Error if the flag is not defined or is not a boolean type.
     */
    isFeatureEnabled(featureName) {
        const flag = this.flags.get(featureName);
        if (!flag) {
            console.warn(`FeatureFlagManager: Feature flag "${featureName}" is not defined. Returning false.`);
            return false; // Or throw an error, depending on desired strictness
        }
        if (typeof flag.value !== 'boolean') {
            throw new Error(`FeatureFlagManager: Feature flag "${featureName}" is not a boolean type. Use getFeatureValue instead.`);
        }
        return flag.value;
    }
    /**
     * Retrieves the value of a feature flag.
     *
     * @param featureName - The name of the feature flag.
     * @param defaultValue - A fallback default value if the flag is not found or its value is null/undefined.
     * This also helps TypeScript infer the return type.
     * @returns The current value of the feature flag, or the provided defaultValue if not found.
     * @throws Error if the flag is defined but its current value's type does not match the expected type (if specified in definition).
     */
    getFeatureValue(featureName, defaultValue) {
        const flag = this.flags.get(featureName);
        if (!flag) {
            console.warn(`FeatureFlagManager: Feature flag "${featureName}" is not defined. Returning provided default value.`);
            return defaultValue;
        }
        const { value, definition } = flag;
        // Type checking against definition's 'type' property
        if (definition.type && typeof value !== definition.type) {
            console.error(`FeatureFlagManager: Type mismatch for flag "${featureName}". Expected "${definition.type}", got "${typeof value}". Returning provided default value.`);
            return defaultValue;
        }
        // Ensure the returned value matches the generic type T
        return value;
    }
    /**
     * Registers a callback function to be called when a specific feature flag's
     * boolean state changes.
     *
     * @param featureName - The name of the feature flag to listen for.
     * @param callback - The function to call when the flag's state changes.
     * @returns A function that, when called, will unsubscribe the listener.
     * @throws Error if the flag is not defined or is not a boolean type.
     */
    onFeatureChange(featureName, callback) {
        var _a;
        const flagDef = this.definitions.get(featureName);
        if (!flagDef) {
            throw new Error(`FeatureFlagManager: Cannot subscribe to undefined flag "${featureName}".`);
        }
        if (flagDef.type && flagDef.type !== 'boolean') {
            throw new Error(`FeatureFlagManager: Cannot subscribe with onFeatureChange to non-boolean flag "${featureName}". Use getFeatureValue and observe its changes manually if needed.`);
        }
        if (!this.listeners.has(featureName)) {
            this.listeners.set(featureName, new Set());
        }
        (_a = this.listeners.get(featureName)) === null || _a === void 0 ? void 0 : _a.add(callback);
        // Return an unsubscribe function
        return () => {
            var _a, _b;
            (_a = this.listeners.get(featureName)) === null || _a === void 0 ? void 0 : _a.delete(callback);
            if (((_b = this.listeners.get(featureName)) === null || _b === void 0 ? void 0 : _b.size) === 0) {
                this.listeners.delete(featureName);
            }
        };
    }
    /**
     * Internal method to load and apply feature flag overrides from all configured sources.
     * Sources are applied in the order they are defined in the config.
     */
    loadFlagsFromSources() {
        // URL parameters are always processed first for immediate testing precedence.
        this.sourceConfigs.filter(s => s.type === 'urlParam').forEach(source => {
            this.applyUrlParams(source);
        });
        // Local Storage overrides
        this.sourceConfigs.filter(s => s.type === 'localStorage').forEach(source => {
            this.applyLocalStorage(source);
        });
        // JSON endpoint overrides (initial fetch)
        this.sourceConfigs.filter(s => s.type === 'jsonEndpoint').forEach(source => {
            // We don't await here, as it's an async operation that shouldn't block initialization.
            // The update will happen when the fetch resolves.
            this.fetchJsonEndpoint(source);
        });
    }
    /**
     * Internal method to update a flag's value and notify any registered listeners.
     * @param name - The name of the flag to update.
     * @param newValue - The new value for the flag.
     */
    updateFlag(name, newValue) {
        var _a;
        const currentFlag = this.flags.get(name);
        if (currentFlag) {
            const oldValue = currentFlag.value;
            // Only update and notify if the value has actually changed
            if (oldValue !== newValue) {
                currentFlag.value = newValue;
                // No need to set the map again if we modified the object reference directly
                // this.flags.set(name, currentFlag);
                console.log(`FeatureFlagManager: Flag "${name}" changed from "${oldValue}" to "${newValue}".`);
                // Notify listeners if it's a boolean flag and its state changed
                if (typeof oldValue === 'boolean' && typeof newValue === 'boolean' && this.listeners.has(name)) {
                    (_a = this.listeners.get(name)) === null || _a === void 0 ? void 0 : _a.forEach(callback => callback(newValue));
                }
            }
        }
    }
    /**
     * Applies feature flag overrides from URL query parameters.
     * URL parameters take precedence for quick testing.
     * Format: `?ff_flagName=value`
     */
    applyUrlParams(config) {
        // Ensure window.location is available in browser environment
        if (typeof window === 'undefined' || !window.location) {
            console.warn('FeatureFlagManager: window.location not available for URL parameter source.');
            return;
        }
        const urlParams = new URLSearchParams(window.location.search);
        const prefix = config.prefix || '';
        this.definitions.forEach((def) => {
            const paramName = `${prefix}${def.name}`;
            if (urlParams.has(paramName)) {
                const paramValue = urlParams.get(paramName);
                let parsedValue;
                // Attempt to parse based on common boolean/number patterns
                if (paramValue === 'true') {
                    parsedValue = true;
                }
                else if (paramValue === 'false') {
                    parsedValue = false;
                }
                else if (paramValue !== null && paramValue !== '' && !isNaN(Number(paramValue))) {
                    parsedValue = Number(paramValue);
                }
                else if (paramValue !== null) {
                    parsedValue = paramValue;
                }
                if (parsedValue !== undefined) {
                    // Validate against definition type if available
                    if (def.type && typeof parsedValue !== def.type) {
                        console.warn(`FeatureFlagManager: URL param "${paramName}" value "${paramValue}" type mismatch. Expected "${def.type}", got "${typeof parsedValue}". Skipping override.`);
                    }
                    else {
                        this.updateFlag(def.name, parsedValue);
                    }
                }
            }
        });
    }
    /**
     * Applies feature flag overrides from Local Storage.
     * Expects a JSON string stored under the configured key, e.g., `{"newFeature": true, "welcomeMessage": "Hello!"}`.
     */
    applyLocalStorage(config) {
        // Ensure localStorage is available in browser environment
        if (typeof localStorage === 'undefined') {
            console.warn('FeatureFlagManager: localStorage not available for Local Storage source.');
            return;
        }
        try {
            const storedFlagsJson = localStorage.getItem(config.key);
            if (storedFlagsJson) {
                const storedOverrides = JSON.parse(storedFlagsJson);
                for (const flagName in storedOverrides) {
                    if (this.definitions.has(flagName)) {
                        const def = this.definitions.get(flagName);
                        const overrideValue = storedOverrides[flagName];
                        // Validate against definition type
                        if (def.type && typeof overrideValue !== def.type) {
                            console.warn(`FeatureFlagManager: Local Storage flag "${flagName}" value type mismatch. Expected "${def.type}", got "${typeof overrideValue}". Skipping override.`);
                        }
                        else {
                            this.updateFlag(flagName, overrideValue);
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error('FeatureFlagManager: Error parsing Local Storage flags:', error);
        }
    }
    /**
     * Fetches feature flag overrides from a remote JSON endpoint.
     * Expects the endpoint to return a JSON object where keys are flag names
     * and values are their override values.
     */
    async fetchJsonEndpoint(config) {
        // Ensure fetch API is available
        if (typeof fetch === 'undefined') {
            console.warn('FeatureFlagManager: fetch API not available for JSON endpoint source.');
            return;
        }
        try {
            const response = await fetch(config.url, {
                method: config.method || 'GET',
                headers: config.headers,
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const remoteOverrides = await response.json();
            for (const flagName in remoteOverrides) {
                if (this.definitions.has(flagName)) {
                    const def = this.definitions.get(flagName);
                    const overrideValue = remoteOverrides[flagName];
                    // Validate against definition type
                    if (def.type && typeof overrideValue !== def.type) {
                        console.warn(`FeatureFlagManager: JSON endpoint flag "${flagName}" value type mismatch. Expected "${def.type}", got "${typeof overrideValue}". Skipping override.`);
                    }
                    else {
                        this.updateFlag(flagName, overrideValue);
                    }
                }
            }
            console.log('FeatureFlagManager: Flags fetched successfully from JSON endpoint.');
        }
        catch (error) {
            console.error('FeatureFlagManager: Error fetching flags from JSON endpoint:', error);
        }
    }
    /**
     * Sets up polling for JSON endpoints based on their configured intervalMs.
     */
    setupJsonEndpointPolling() {
        // Ensure window.setInterval is available in browser environment
        if (typeof window === 'undefined' || !window.setInterval) {
            console.warn('FeatureFlagManager: window.setInterval not available for JSON endpoint polling.');
            return;
        }
        this.sourceConfigs.forEach(source => {
            if (source.type === 'jsonEndpoint' && source.intervalMs && source.intervalMs > 0) {
                const intervalId = window.setInterval(() => {
                    this.fetchJsonEndpoint(source);
                }, source.intervalMs);
                this.jsonEndpointIntervals.set(source.url, intervalId);
                console.log(`FeatureFlagManager: Set up polling for "${source.url}" every ${source.intervalMs}ms.`);
            }
        });
    }
    /**
     * Clears all active JSON endpoint polling intervals.
     * Useful during re-initialization or when the manager is no longer needed.
     */
    clearAllJsonEndpointIntervals() {
        if (typeof window === 'undefined' || !window.clearInterval) {
            console.warn('FeatureFlagManager: window.clearInterval not available to clear polling intervals.');
            return;
        }
        this.jsonEndpointIntervals.forEach(intervalId => {
            window.clearInterval(intervalId);
        });
        this.jsonEndpointIntervals.clear();
    }
    /**
     * Cleans up any active listeners and polling intervals.
     * Call this when the application is unmounting or the manager is no longer needed
     * to prevent memory leaks.
     */
    destroy() {
        this.listeners.clear();
        this.clearAllJsonEndpointIntervals();
        console.log('FeatureFlagManager: Destroyed. All listeners and polling intervals cleared.');
    }
}
// Export a singleton instance for convenience, or allow users to create their own.
// A singleton is common for managers like this.
exports.featureFlagManager = new FeatureFlagManager();
// Re-export types for public consumption
__exportStar(require("./types"), exports);
