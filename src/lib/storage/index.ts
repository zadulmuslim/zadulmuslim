import "server-only";

/**
 * Public surface of the storage module. Import from "@/lib/storage" only —
 * never import "./r2" from features, pages or API routes.
 */
export {
  initiateUpload,
  initiateReplace,
  completeUpload,
  uploadFromServer,
  deleteMedia,
  getAccessUrl,
  getMedia,
  toPublicMedia,
  cleanupStaleMedia,
  type MediaRow,
  type UploadRequest,
  type PresignedUpload,
} from "./media-service";
export { StorageError } from "./validation";
export * from "./categories";
