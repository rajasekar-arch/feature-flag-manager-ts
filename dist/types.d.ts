/**
 * Represents the possible values a feature flag can hold.
 * This ensures type safety for flag values.
 */
export type FeatureFlagValue = boolean | string | number;
/**
 * Defines a single feature flag.
 * @property name - The unique identifier for the feature flag (e.g., 'newDashboardUI').
 * @property defaultValue - The fallback value if no override is found.
 * @property description - A brief explanation of the feature flag's purpose.
 * @property type - Optional. The expected type of the flag value for stricter checking.
 */
export interface FeatureFlagDefinition {
    name: string;
    defaultValue: FeatureFlagValue;
    description?: string;
    type?: 'boolean' | 'string' | 'number';
}
/**
 * Configuration for loading feature flags from URL query parameters.
 * @property prefix - Optional. A prefix to identify feature flag parameters (e.g., 'ff_').
 * If 'ff_newFeature=true', the flag name would be 'newFeature'.
 */
export interface UrlParamSourceConfig {
    type: 'urlParam';
    prefix?: string;
}
/**
 * Configuration for loading feature flags from Local Storage.
 * @property key - The key under which the feature flag overrides are stored in Local Storage.
 */
export interface LocalStorageSourceConfig {
    type: 'localStorage';
    key: string;
}
/**
 * Configuration for loading feature flags from a remote JSON endpoint.
 * @property url - The URL of the JSON endpoint that returns feature flag overrides.
 * @property method - Optional. HTTP method (default: 'GET').
 * @property headers - Optional. Custom headers for the fetch request.
 * @property intervalMs - Optional. Interval in milliseconds to refetch flags (for dynamic updates).
 */
export interface JsonEndpointSourceConfig {
    type: 'jsonEndpoint';
    url: string;
    method?: 'GET' | 'POST';
    headers?: Record<string, string>;
    intervalMs?: number;
}
/**
 * Union type for all supported feature flag sources.
 */
export type FeatureFlagSourceConfig = UrlParamSourceConfig | LocalStorageSourceConfig | JsonEndpointSourceConfig;
/**
 * The main configuration object for the FeatureFlagManager.
 * @property flags - An array of FeatureFlagDefinition objects.
 * @property sources - Optional. An array of configurations for different flag override sources.
 */
export interface FeatureFlagConfig {
    flags: FeatureFlagDefinition[];
    sources?: FeatureFlagSourceConfig[];
}
/**
 * Callback function type for when a feature flag's state changes.
 * @param isEnabled - The new boolean state of the flag.
 */
export type FeatureFlagChangeListener = (isEnabled: boolean) => void;
/**
 * Represents the internal state of a feature flag, including its current value
 * and its original definition.
 */
export interface InternalFeatureFlag {
    value: FeatureFlagValue;
    definition: FeatureFlagDefinition;
}
