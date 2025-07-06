import { FeatureFlagConfig, FeatureFlagValue, FeatureFlagChangeListener } from './types';
/**
 * A robust client-side feature flag manager for progressive feature rollout,
 * A/B testing, and dynamic configuration.
 *
 * This manager allows defining feature flags with default values and
 * overriding them from various sources like URL parameters, Local Storage,
 * or remote JSON endpoints. It provides a type-safe API for checking flag states
 * and listening for changes.
 */
declare class FeatureFlagManager {
    private flags;
    private definitions;
    private listeners;
    private sourceConfigs;
    private jsonEndpointIntervals;
    /**
     * Initializes the FeatureFlagManager with the provided configuration.
     * This method should be called once, typically at application startup.
     *
     * @param config - The FeatureFlagConfig object defining flags and sources.
     * @throws Error if any flag name is duplicated or configuration is invalid.
     */
    initializeFeatureFlags(config: FeatureFlagConfig): void;
    /**
     * Checks if a boolean feature flag is enabled.
     * This is a convenience method for boolean flags.
     *
     * @param featureName - The name of the feature flag.
     * @returns `true` if the flag is enabled, `false` otherwise.
     * @throws Error if the flag is not defined or is not a boolean type.
     */
    isFeatureEnabled(featureName: string): boolean;
    /**
     * Retrieves the value of a feature flag.
     *
     * @param featureName - The name of the feature flag.
     * @param defaultValue - A fallback default value if the flag is not found or its value is null/undefined.
     * This also helps TypeScript infer the return type.
     * @returns The current value of the feature flag, or the provided defaultValue if not found.
     * @throws Error if the flag is defined but its current value's type does not match the expected type (if specified in definition).
     */
    getFeatureValue<T extends FeatureFlagValue>(featureName: string, defaultValue: T): T;
    /**
     * Registers a callback function to be called when a specific feature flag's
     * boolean state changes.
     *
     * @param featureName - The name of the feature flag to listen for.
     * @param callback - The function to call when the flag's state changes.
     * @returns A function that, when called, will unsubscribe the listener.
     * @throws Error if the flag is not defined or is not a boolean type.
     */
    onFeatureChange(featureName: string, callback: FeatureFlagChangeListener): () => void;
    /**
     * Internal method to load and apply feature flag overrides from all configured sources.
     * Sources are applied in the order they are defined in the config.
     */
    private loadFlagsFromSources;
    /**
     * Internal method to update a flag's value and notify any registered listeners.
     * @param name - The name of the flag to update.
     * @param newValue - The new value for the flag.
     */
    private updateFlag;
    /**
     * Applies feature flag overrides from URL query parameters.
     * URL parameters take precedence for quick testing.
     * Format: `?ff_flagName=value`
     */
    private applyUrlParams;
    /**
     * Applies feature flag overrides from Local Storage.
     * Expects a JSON string stored under the configured key, e.g., `{"newFeature": true, "welcomeMessage": "Hello!"}`.
     */
    private applyLocalStorage;
    /**
     * Fetches feature flag overrides from a remote JSON endpoint.
     * Expects the endpoint to return a JSON object where keys are flag names
     * and values are their override values.
     */
    private fetchJsonEndpoint;
    /**
     * Sets up polling for JSON endpoints based on their configured intervalMs.
     */
    private setupJsonEndpointPolling;
    /**
     * Clears all active JSON endpoint polling intervals.
     * Useful during re-initialization or when the manager is no longer needed.
     */
    private clearAllJsonEndpointIntervals;
    /**
     * Cleans up any active listeners and polling intervals.
     * Call this when the application is unmounting or the manager is no longer needed
     * to prevent memory leaks.
     */
    destroy(): void;
}
export declare const featureFlagManager: FeatureFlagManager;
export * from './types';
