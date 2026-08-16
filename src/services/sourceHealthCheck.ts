/**
 * Source health check service.
 *
 * Validates remote data sources before loading collections.
 * Performs accessibility checks, schema validation, and latency measurement.
 */

import { collectionDefinitionSchema } from "@/schemas/v2/collection.schema";
import { detectSchemaVersion, type CollectionDefinition } from "@/types/schema";

/**
 * Health check result status.
 */
export type HealthStatus = "healthy" | "degraded" | "unreachable" | "invalid";

/**
 * Health issue severity levels.
 */
export type HealthIssueSeverity = "warning" | "error";

/**
 * Health issue codes for categorising problems.
 */
export type HealthIssueCode =
  | "SOURCE_UNAVAILABLE"
  | "SCHEMA_INCOMPATIBLE"
  | "SCHEMA_OUTDATED"
  | "HIGH_LATENCY"
  | "MISSING_MANIFEST"
  | "INVALID_JSON"
  | "NETWORK_ERROR";

/**
 * Individual health issue.
 */
export interface HealthIssue {
  severity: HealthIssueSeverity;
  code: HealthIssueCode;
  message: string;
}

/**
 * Health check result for a source.
 */
export interface HealthCheckResult {
  /** Source URL that was checked */
  url: string;
  /** Overall health status */
  status: HealthStatus;
  /** Response latency in milliseconds */
  latency: number;
  /** Collection name if discovered */
  collectionName?: string;
  /**
   * Number of items in collection.
   *
   * Not derivable from collection.json: the definition describes entity types,
   * while entity counts live in the per-entity index files. Left undefined
   * unless a future check fetches those indexes.
   */
  itemCount?: number;
  /** Schema version detected */
  schemaVersion?: string;
  /** Whether schema is compatible */
  schemaCompatible?: boolean;
  /** Timestamp of this check */
  lastChecked: Date;
  /** Any issues found during check */
  issues: HealthIssue[];
  /** Error message if check failed */
  error?: string;
}

/**
 * High latency threshold in milliseconds.
 * Latencies above this trigger a "degraded" status warning.
 */
const HIGH_LATENCY_THRESHOLD_MS = 2000;

/**
 * Supported schema versions.
 *
 * Values match those returned by {@link detectSchemaVersion}; collections may
 * omit `schemaVersion` entirely, in which case the version is inferred.
 */
const SUPPORTED_SCHEMA_VERSIONS = ["v1", "v2"];

/**
 * Check health of a remote source.
 *
 * Performs a 3-phase check:
 * 1. HEAD request for accessibility and latency
 * 2. Fetch collection.json for schema validation
 * 3. Validate against schema and check compatibility
 *
 * @param url - Base URL of the collection (should end with / or be the collection.json URL)
 * @returns Health check result
 */
export async function checkSourceHealth(url: string): Promise<HealthCheckResult> {
  const startTime = performance.now();
  const issues: HealthIssue[] = [];
  let collectionName: string | undefined;
  let schemaVersion: string | undefined;
  let schemaCompatible: boolean | undefined;

  // Normalise URL to collection.json
  const collectionUrl = url.endsWith("collection.json")
    ? url
    : url.endsWith("/")
      ? `${url}collection.json`
      : `${url}/collection.json`;

  try {
    // Phase 1: Accessibility check with HEAD request
    const headResponse = await fetch(collectionUrl, {
      method: "HEAD",
      cache: "no-store",
    });

    if (!headResponse.ok) {
      const latency = Math.round(performance.now() - startTime);
      return {
        url,
        status: "unreachable",
        latency,
        lastChecked: new Date(),
        issues: [{
          severity: "error",
          code: "SOURCE_UNAVAILABLE",
          message: `Source returned status ${String(headResponse.status)}`,
        }],
        error: `HTTP ${String(headResponse.status)}`,
      };
    }

    // Phase 2: Fetch collection.json
    const response = await fetch(collectionUrl, { cache: "no-store" });
    const latency = Math.round(performance.now() - startTime);

    if (!response.ok) {
      return {
        url,
        status: "unreachable",
        latency,
        lastChecked: new Date(),
        issues: [{
          severity: "error",
          code: "SOURCE_UNAVAILABLE",
          message: `Failed to fetch collection: ${String(response.status)}`,
        }],
        error: `HTTP ${String(response.status)}`,
      };
    }

    // Check latency
    if (latency > HIGH_LATENCY_THRESHOLD_MS) {
      issues.push({
        severity: "warning",
        code: "HIGH_LATENCY",
        message: `Response time ${String(latency)}ms exceeds ${String(HIGH_LATENCY_THRESHOLD_MS)}ms threshold`,
      });
    }

    // Parse JSON
    let data: unknown;
    try {
      data = await response.json() as unknown;
    } catch {
      return {
        url,
        status: "invalid",
        latency,
        lastChecked: new Date(),
        issues: [{
          severity: "error",
          code: "INVALID_JSON",
          message: "Collection file is not valid JSON",
        }],
        error: "Invalid JSON",
      };
    }

    // Phase 3: Schema validation
    const parseResult = collectionDefinitionSchema.safeParse(data);

    if (parseResult.success) {
      // Cast as in the collection loader: the inferred schema type is a looser
      // structural match for the hand-written definition type.
      const collection = parseResult.data as CollectionDefinition;
      collectionName = collection.name;
      // Collections may omit schemaVersion, so infer it from the definition
      // rather than assuming a default.
      const version = detectSchemaVersion(collection);
      schemaVersion = version;
      schemaCompatible = SUPPORTED_SCHEMA_VERSIONS.includes(version);

      if (!schemaCompatible) {
        issues.push({
          severity: "error",
          code: "SCHEMA_INCOMPATIBLE",
          message: `Schema version ${schemaVersion} is not supported`,
        });
      }
    } else {
      // Schema validation failed
      issues.push({
        severity: "error",
        code: "SCHEMA_INCOMPATIBLE",
        message: "Collection does not match expected schema",
      });

      return {
        url,
        status: "invalid",
        latency,
        lastChecked: new Date(),
        issues,
        error: "Schema validation failed",
      };
    }

    // Determine overall status
    const hasErrors = issues.some(i => i.severity === "error");
    const hasWarnings = issues.some(i => i.severity === "warning");
    const status: HealthStatus = hasErrors
      ? "invalid"
      : hasWarnings
        ? "degraded"
        : "healthy";

    return {
      url,
      status,
      latency,
      collectionName,
      schemaVersion,
      schemaCompatible,
      lastChecked: new Date(),
      issues,
    };
  } catch (error) {
    const latency = Math.round(performance.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return {
      url,
      status: "unreachable",
      latency,
      lastChecked: new Date(),
      issues: [{
        severity: "error",
        code: "NETWORK_ERROR",
        message: errorMessage,
      }],
      error: errorMessage,
    };
  }
}

/**
 * Check health of multiple sources in parallel.
 *
 * @param urls - Array of source URLs to check
 * @returns Array of health check results
 */
export async function checkMultipleSourceHealth(
  urls: string[]
): Promise<HealthCheckResult[]> {
  return Promise.all(urls.map(url => checkSourceHealth(url)));
}
