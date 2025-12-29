/**
 * Plugin validation pipeline.
 *
 * Validates plugin manifests against schemas, security rules,
 * and tier-specific restrictions.
 *
 * @module plugins/validation/validator
 */

import {
  pluginManifestSchema,
  type PluginManifest,
  type PluginTier,
  type Capability,
} from "@/plugins/schemas";
import {
  validateCapabilities,
  CAPABILITY_INFO,
} from "@/plugins/security/capabilities";

// ============================================================================
// Types
// ============================================================================

/**
 * Validation error severity.
 */
export type ValidationSeverity = "error" | "warning" | "info";

/**
 * Validation error/warning.
 */
export interface ValidationIssue {
  /** Issue severity */
  severity: ValidationSeverity;
  /** Issue code for programmatic handling */
  code: string;
  /** Human-readable message */
  message: string;
  /** Path to the problematic field (if applicable) */
  path?: string[];
  /** Suggested fix (if available) */
  suggestion?: string;
}

/**
 * Validation result.
 */
export interface ValidationResult {
  /** Whether the manifest is valid (no errors) */
  valid: boolean;
  /** All issues found during validation */
  issues: ValidationIssue[];
  /** Errors only */
  errors: ValidationIssue[];
  /** Warnings only */
  warnings: ValidationIssue[];
  /** Sanitised manifest (if valid) */
  manifest?: PluginManifest;
}

/**
 * Validation options.
 */
export interface ValidationOptions {
  /** Distribution tier (affects security checks) */
  tier: PluginTier;
  /** Skip security checks */
  skipSecurityChecks?: boolean;
  /** Skip content policy checks */
  skipContentPolicy?: boolean;
}

// ============================================================================
// Validation Pipeline
// ============================================================================

/**
 * Validate a plugin manifest.
 *
 * Performs the following validation steps:
 * 1. Schema validation (Zod)
 * 2. Semantic validation (version compatibility, dependencies)
 * 3. Capability validation against tier limits
 * 4. Security checks for community plugins
 * 5. Content policy checks
 *
 * @param data - Raw manifest data
 * @param options - Validation options
 * @returns Validation result
 */
export function validateManifest(
  data: unknown,
  options: ValidationOptions
): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Step 1: Schema validation
  const schemaResult = pluginManifestSchema.safeParse(data);

  if (!schemaResult.success) {
    // Convert Zod errors to validation issues
    for (const zodError of schemaResult.error.issues) {
      issues.push({
        severity: "error",
        code: "SCHEMA_ERROR",
        message: zodError.message,
        path: zodError.path.map(String),
      });
    }

    return createResult(issues);
  }

  const manifest = schemaResult.data;

  // Step 2: Semantic validation
  const semanticIssues = validateSemantics(manifest);
  issues.push(...semanticIssues);

  // Step 3: Capability validation
  const capabilityIssues = validateCapabilityRequests(
    manifest.capabilities,
    options.tier
  );
  issues.push(...capabilityIssues);

  // Step 4: Security checks (for community plugins)
  if (!options.skipSecurityChecks && options.tier === "community") {
    const securityIssues = performSecurityChecks(manifest);
    issues.push(...securityIssues);
  }

  // Step 5: Content policy checks
  if (!options.skipContentPolicy) {
    const contentIssues = checkContentPolicy(manifest);
    issues.push(...contentIssues);
  }

  return createResult(issues, manifest);
}

/**
 * Create a validation result from issues.
 */
function createResult(
  issues: ValidationIssue[],
  manifest?: PluginManifest
): ValidationResult {
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  return {
    valid: errors.length === 0,
    issues,
    errors,
    warnings,
    manifest: errors.length === 0 ? manifest : undefined,
  };
}

// ============================================================================
// Semantic Validation
// ============================================================================

/**
 * Validate semantic rules beyond schema.
 */
function validateSemantics(manifest: PluginManifest): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check plugin ID format
  if (!manifest.id.includes(".")) {
    issues.push({
      severity: "warning",
      code: "ID_NOT_REVERSE_DOMAIN",
      message: "Plugin ID should use reverse domain notation (e.g., org.example.plugin)",
      path: ["id"],
      suggestion: `Use a format like "org.example.${manifest.id}"`,
    });
  }

  // Check version is valid semver
  const semverPattern = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/;
  if (!semverPattern.test(manifest.version)) {
    issues.push({
      severity: "error",
      code: "INVALID_VERSION",
      message: "Version must be valid semver (e.g., 1.0.0)",
      path: ["version"],
    });
  }

  // Check minVersion is not higher than current app version
  // (Would need app version constant - skipping for now)

  // Check entry points exist if specified
  if (manifest.entry?.main && !manifest.entry.main.startsWith("./")) {
    issues.push({
      severity: "warning",
      code: "ENTRY_NOT_RELATIVE",
      message: "Entry point should be a relative path starting with ./",
      path: ["entry", "main"],
    });
  }

  // Check for empty description
  if (!manifest.description || manifest.description.trim().length === 0) {
    issues.push({
      severity: "warning",
      code: "EMPTY_DESCRIPTION",
      message: "Plugin should have a meaningful description",
      path: ["description"],
    });
  }

  // Check author information
  if (!manifest.author.url) {
    issues.push({
      severity: "info",
      code: "NO_AUTHOR_URL",
      message: "Consider adding an author URL for credibility",
      path: ["author", "url"],
    });
  }

  return issues;
}

// ============================================================================
// Capability Validation
// ============================================================================

/**
 * Validate requested capabilities against tier limits.
 */
function validateCapabilityRequests(
  capabilities: Capability[],
  tier: PluginTier
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const validation = validateCapabilities(capabilities, tier);

  // Report blocked capabilities as errors
  for (const cap of validation.blocked) {
    const info = CAPABILITY_INFO[cap];
    issues.push({
      severity: "error",
      code: "BLOCKED_CAPABILITY",
      message: `Capability "${cap}" is not available for ${tier} plugins`,
      path: ["capabilities"],
      suggestion: info.category === "dangerous"
        ? "Dangerous capabilities are only available for built-in plugins"
        : `Remove this capability or change the plugin tier`,
    });
  }

  // Report consent-required capabilities as info
  for (const cap of validation.needsConsent) {
    issues.push({
      severity: "info",
      code: "CAPABILITY_NEEDS_CONSENT",
      message: `Capability "${cap}" will require user consent`,
      path: ["capabilities"],
    });
  }

  // Check for unusual capability combinations
  if (
    capabilities.includes("collection:write") &&
    !capabilities.includes("collection:read")
  ) {
    issues.push({
      severity: "warning",
      code: "CAPABILITY_INCONSISTENCY",
      message: "collection:write without collection:read is unusual",
      path: ["capabilities"],
      suggestion: "Add collection:read capability",
    });
  }

  return issues;
}

// ============================================================================
// Security Checks
// ============================================================================

/** Suspicious patterns in code */
const SUSPICIOUS_PATTERNS = [
  { pattern: /eval\s*\(/, name: "eval()", severity: "error" as const },
  { pattern: /new\s+Function\s*\(/, name: "new Function()", severity: "error" as const },
  { pattern: /document\s*\./, name: "document access", severity: "warning" as const },
  { pattern: /window\s*\./, name: "window access", severity: "warning" as const },
  { pattern: /localStorage\s*\./, name: "direct localStorage access", severity: "warning" as const },
  { pattern: /XMLHttpRequest/, name: "XMLHttpRequest", severity: "warning" as const },
  { pattern: /fetch\s*\(/, name: "fetch()", severity: "info" as const },
];

/**
 * Perform security checks on manifest and code.
 */
function performSecurityChecks(manifest: PluginManifest): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check for dangerous capabilities in non-builtin plugins
  const dangerousCaps = manifest.capabilities.filter((cap) =>
    cap.startsWith("dangerous:")
  );

  if (dangerousCaps.length > 0) {
    issues.push({
      severity: "error",
      code: "DANGEROUS_CAPABILITIES",
      message: `Community plugins cannot use dangerous capabilities: ${dangerousCaps.join(", ")}`,
      path: ["capabilities"],
    });
  }

  // Check external URLs in manifest
  const urls = [
    manifest.homepage,
    manifest.repository,
    manifest.assets?.icon,
    manifest.assets?.banner,
    ...(manifest.assets?.screenshots ?? []),
    manifest.entry?.styles,
  ].filter(Boolean) as string[];

  for (const url of urls) {
    if (url.startsWith("http://")) {
      issues.push({
        severity: "warning",
        code: "INSECURE_URL",
        message: `Insecure HTTP URL found: ${url}`,
        suggestion: "Use HTTPS instead of HTTP",
      });
    }
  }

  return issues;
}

// ============================================================================
// Content Policy Checks
// ============================================================================

/** Blocked keywords in metadata */
const BLOCKED_KEYWORDS = [
  "malware",
  "virus",
  "hack",
  "crack",
  "pirate",
  "warez",
];

/**
 * Check manifest against content policy.
 */
function checkContentPolicy(manifest: PluginManifest): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check for blocked keywords
  const textToCheck = [
    manifest.name,
    manifest.description,
    ...(manifest.keywords ?? []),
  ]
    .join(" ")
    .toLowerCase();

  for (const keyword of BLOCKED_KEYWORDS) {
    if (textToCheck.includes(keyword)) {
      issues.push({
        severity: "warning",
        code: "CONTENT_POLICY_KEYWORD",
        message: `Manifest contains potentially problematic keyword: "${keyword}"`,
        suggestion: "Review content to ensure it complies with content policy",
      });
    }
  }

  // Check name length
  if (manifest.name.length < 3) {
    issues.push({
      severity: "warning",
      code: "NAME_TOO_SHORT",
      message: "Plugin name should be at least 3 characters",
      path: ["name"],
    });
  }

  // Check for URL-like names (could be misleading)
  if (manifest.name.match(/^https?:\/\//i)) {
    issues.push({
      severity: "error",
      code: "MISLEADING_NAME",
      message: "Plugin name should not be a URL",
      path: ["name"],
    });
  }

  return issues;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validate plugin code for security issues.
 *
 * @param code - Plugin code to validate
 * @returns Array of validation issues
 */
export function validatePluginCode(code: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const { pattern, name, severity } of SUSPICIOUS_PATTERNS) {
    if (pattern.test(code)) {
      issues.push({
        severity,
        code: "SUSPICIOUS_PATTERN",
        message: `Suspicious pattern detected: ${name}`,
        suggestion:
          severity === "error"
            ? "This pattern is not allowed in community plugins"
            : "This pattern may not work in sandboxed environment",
      });
    }
  }

  return issues;
}

/**
 * Format validation issues as a human-readable string.
 *
 * @param result - Validation result
 * @returns Formatted string
 */
export function formatValidationResult(result: ValidationResult): string {
  if (result.valid && result.issues.length === 0) {
    return "Validation passed with no issues.";
  }

  const lines: string[] = [];

  if (!result.valid) {
    lines.push(`Validation FAILED with ${result.errors.length} error(s).`);
  } else {
    lines.push(`Validation passed with ${result.warnings.length} warning(s).`);
  }

  lines.push("");

  for (const issue of result.issues) {
    const icon =
      issue.severity === "error"
        ? "❌"
        : issue.severity === "warning"
          ? "⚠️"
          : "ℹ️";
    const path = issue.path ? ` [${issue.path.join(".")}]` : "";
    lines.push(`${icon} ${issue.message}${path}`);

    if (issue.suggestion) {
      lines.push(`   💡 ${issue.suggestion}`);
    }
  }

  return lines.join("\n");
}

/**
 * Quick validation check (returns boolean).
 *
 * @param data - Raw manifest data
 * @param tier - Distribution tier
 * @returns Whether the manifest is valid
 */
export function isValidManifest(data: unknown, tier: PluginTier): boolean {
  const result = validateManifest(data, { tier });
  return result.valid;
}
