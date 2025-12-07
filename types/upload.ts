/**
 * Types for Arweave upload requests and responses
 */

/**
 * Request to upload image to Arweave
 */
export interface UploadImageRequest {
  imageBase64: string; // Base64-encoded PNG with or without data URL prefix
  name?: string; // Optional filename for better organization
}

/**
 * Response from image upload endpoint
 */
export interface UploadImageResponse {
  success: boolean;
  imageUrl?: string; // Full Arweave URL (e.g., https://arweave.net/...)
  transactionId?: string; // Arweave transaction ID
  error?: string;
  message?: string;
}

/**
 * Request to upload metadata to Arweave
 */
export interface UploadMetadataRequest {
  name: string; // NFT name
  symbol: string; // NFT symbol (e.g., "MINTISTRY")
  description?: string; // NFT description
  imageUrl: string; // URL to the uploaded image on Arweave
  attributes?: Array<{ trait_type: string; value: string | number }>; // NFT attributes
  externalUrl?: string; // External URL for the NFT
  sellerFeeBasisPoints?: number; // Royalty percentage (e.g., 500 = 5%)
  creatorAddress?: string; // Creator's wallet address
}

/**
 * Response from metadata upload endpoint
 */
export interface UploadMetadataResponse {
  success: boolean;
  metadataUri?: string; // Full Arweave URL to metadata JSON
  transactionId?: string; // Arweave transaction ID
  metadata?: object; // The uploaded metadata object
  error?: string;
  message?: string;
}
