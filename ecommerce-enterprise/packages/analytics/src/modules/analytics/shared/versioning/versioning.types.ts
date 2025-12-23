export interface VersioningOptions {
  /** Default API version */
  defaultVersion?: string;
  /** Supported API versions */
  supportedVersions: string[];
  /** Header name for version (default: 'API-Version') */
  headerName?: string;
  /** Query parameter name for version (default: 'version') */
  queryParamName?: string;
  /** Accept header versioning pattern (default: 'application/vnd.api+json;version={version}') */
  acceptHeaderPattern?: string;
  /** Whether to strip version from response */
  stripVersionFromResponse?: boolean;
  /** Version validation function */
  validateVersion?: (version: string) => boolean;
}

export interface VersionInfo {
  version: string;
  isDefault: boolean;
  isSupported: boolean;
}

export interface VersionedRoute {
  version: string;
  path: string;
  method: string;
  handler: Function;
}
