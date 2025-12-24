/**
 * Loader exports for v1/v2 schema format.
 *
 * Provides collection loading, entity resolution, and field access utilities.
 */

// Collection loader
export {
  loadCollection,
  loadCollectionDefinition,
  loadEntities,
  isV1Collection,
  isV2Collection,
  detectCollectionVersion,
  getSchemaVersion,
} from "./collectionLoader";

// Relationship resolver
export {
  createResolverContext,
  resolveReference,
  resolveEntityRelationships,
  resolveAllRelationships,
  getEntityRank,
  getRelationshipDefinition,
  type ResolverContext,
} from "./relationshipResolver";

// Image selector
export {
  selectImage,
  selectImages,
  getPrimaryImage,
  getPrimaryImageUrl,
  getImageUrls,
  getLogoUrl,
} from "./imageSelector";

// Field path parser
export {
  getFieldValue,
  getStringValue,
  getNumberValue,
  getImagesValue,
} from "./fieldPath";

// Rating resolver (v2)
export {
  isStructuredRating,
  normaliseRating,
  formatRating,
  ratingToPercentage,
  getRatingScore,
  getRatingMax,
  getRatingSource,
  compareRatings,
  displayRating,
} from "./ratingResolver";
