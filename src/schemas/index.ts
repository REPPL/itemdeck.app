/**
 * Schema exports for itemdeck.
 *
 * Provides Zod schemas for runtime validation and TypeScript types.
 */

// Card data schema
export {
  cardDataSchema,
  validateCard,
  safeValidateCard,
  filterValidCards,
  type CardData,
} from "./cardData.schema";

// Category schema
export {
  categorySchema,
  validateCategory,
  safeValidateCategory,
  filterValidCategories,
  type Category,
} from "./category.schema";

// Collection schema
export {
  collectionSchema,
  collectionMetaSchema,
  validateCollection,
  safeValidateCollection,
  joinCardsWithCategories,
  type Collection,
  type CollectionMeta,
  type CardWithCategory,
} from "./collection.schema";

// Schema registry
export {
  schemaRegistry,
  isValidSchema,
  getSupportedSchemas,
  getSchema,
  type SchemaId,
} from "./registry";

// App configuration schema (existing)
export {
  CardConfigSchema,
  AnimationConfigSchema,
  BehaviourConfigSchema,
  AppConfigSchema,
  parseConfig,
  validatePartialConfig,
  DEFAULT_CONFIG,
  DEFAULT_CARD_CONFIG,
  DEFAULT_ANIMATION_CONFIG,
  DEFAULT_BEHAVIOUR_CONFIG,
  type CardConfig,
  type AnimationConfig,
  type BehaviourConfig,
  type AppConfig,
  type DeepPartialAppConfig,
} from "./config.schema";
