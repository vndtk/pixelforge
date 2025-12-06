/**
 * Types for NFT minting requests and responses
 */

/**
 * Payload sent to backend minting API
 */
export interface MintNFTRequest {
  // NFT Metadata
  name: string; // Max 32 characters
  symbol?: string; // Default: "FORGE"
  creatorMessage?: string; // Max 80 characters

  // Canvas data
  imageBase64: string; // Base64-encoded PNG (data URL format)
  canvasSize: number; // Grid size (e.g., 32 for 32x32)
  pixelData: Record<string, string>; // Raw pixel data for on-chain storage

  // Wallet & signing
  walletAddress: string; // User's wallet public key
  signature?: string; // Optional: signature for verification

  // Network
  network?: "devnet" | "mainnet-beta";
}

/**
 * Response from backend minting API
 */
export interface MintNFTResponse {
  success: boolean;
  transactionSignature?: string;
  mintAddress?: string; // NFT mint address
  metadataUri?: string; // URI to uploaded metadata
  imageUri?: string; // URI to uploaded image
  error?: string;
  message?: string;
}

/**
 * Data prepared for minting (before sending to backend)
 */
export interface PreparedMintData {
  request: MintNFTRequest;
  isValid: boolean;
  validationErrors: string[];
}

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
  symbol: string; // NFT symbol (e.g., "FORGE")
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
