/**
 * Error thrown when a collection uses an unsupported schema.
 */

/**
 * Custom error for unsupported schema types.
 *
 * Provides helpful information about what schemas are available
 * and where to request new ones.
 */
export class SchemaNotSupportedError extends Error {
  /** The schema that was requested but not supported */
  readonly requestedSchema: string;

  /** List of schemas that are currently supported */
  readonly supportedSchemas: string[];

  constructor(requestedSchema: string, supportedSchemas: string[]) {
    const message =
      `Unsupported schema: "${requestedSchema}". ` +
      `Supported schemas: ${supportedSchemas.join(", ")}. ` +
      `Request new schemas at: https://github.com/REPPL/itemdeck/issues`;

    super(message);

    this.name = "SchemaNotSupportedError";
    this.requestedSchema = requestedSchema;
    this.supportedSchemas = supportedSchemas;

    // Maintain proper stack trace in V8 environments
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- captureStackTrace may not exist in all environments
    Error.captureStackTrace?.(this, SchemaNotSupportedError);
  }
}
