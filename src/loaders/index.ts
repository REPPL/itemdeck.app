/**
 * Loader exports for v1 schema format.
 *
 * Provides collection loading, entity resolution, and field access utilities.
 */

// Collection loader
export {
  loadCollection,
  loadCollectionDefinition,
  loadEntities,
  isV1Collection,
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
} from "./imageSelector";

// Field path parser
export {
  getFieldValue,
  getStringValue,
  getNumberValue,
  getImagesValue,
} from "./fieldPath";
