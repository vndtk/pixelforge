import type { MintNFTRequest, PreparedMintData } from "@/types/minting";
import { computeRarityStats, type RarityTier } from "./rarity";

interface PrepareMintDataParams {
  name: string;
  creatorMessage?: string;
  imageData: string; // Base64 data URL from canvas
  pixelData: Record<string, string>;
  canvasSize: number;
  walletAddress: string;
  network?: "devnet" | "mainnet-beta";
}

/**
 * Validates and prepares minting data for backend API
 */
export function prepareMintData(
  params: PrepareMintDataParams
): PreparedMintData {
  const validationErrors: string[] = [];
  const {
    name,
    creatorMessage,
    imageData,
    pixelData,
    canvasSize,
    walletAddress,
    network = "devnet",
  } = params;

  // Validate name
  if (!name || name.trim().length === 0) {
    validationErrors.push("NFT name is required");
  } else if (name.length > 32) {
    validationErrors.push("NFT name must be 32 characters or less");
  }

  // Validate creator message
  if (creatorMessage && creatorMessage.length > 80) {
    validationErrors.push("Creator message must be 80 characters or less");
  }

  // Validate image data
  if (!imageData || !imageData.startsWith("data:image/")) {
    validationErrors.push("Invalid image data format");
  }

  // Validate wallet address
  if (!walletAddress || walletAddress.length < 32) {
    validationErrors.push("Invalid wallet address");
  }

  // Validate pixel data
  if (!pixelData || Object.keys(pixelData).length === 0) {
    validationErrors.push("Canvas is empty - please create some pixel art first");
  }

  // Prepare the request object
  const request: MintNFTRequest = {
    name: name.trim(),
    symbol: "FORGE",
    creatorMessage: creatorMessage?.trim() || undefined,
    imageBase64: imageData, // Keep full data URL with MIME type
    canvasSize,
    pixelData,
    walletAddress,
    network,
  };

  return {
    request,
    isValid: validationErrors.length === 0,
    validationErrors,
  };
}

/**
 * Extracts pure base64 string from data URL (removes "data:image/png;base64," prefix)
 */
export function extractBase64FromDataURL(dataURL: string): string {
  const base64Prefix = "data:image/png;base64,";
  if (dataURL.startsWith(base64Prefix)) {
    return dataURL.slice(base64Prefix.length);
  }
  // If it's already pure base64, return as-is
  return dataURL;
}

/**
 * Calculates the size of the base64 image in bytes
 */
export function getBase64ImageSize(base64String: string): number {
  const base64 = extractBase64FromDataURL(base64String);
  // Each base64 character represents 6 bits, and padding is considered
  const padding = (base64.match(/=/g) || []).length;
  return Math.floor((base64.length * 3) / 4 - padding);
}

/**
 * Formats bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Validates that the base64 string is a valid PNG image
 */
export function isValidPNGBase64(dataURL: string): boolean {
  // Check if it starts with data URL prefix
  if (!dataURL.startsWith("data:image/png;base64,")) {
    return false;
  }

  try {
    const base64 = extractBase64FromDataURL(dataURL);
    // Try to decode to verify it's valid base64
    atob(base64);
    return true;
  } catch {
    return false;
  }
}

/**
 * Prepares NFT attributes including rarity calculation
 */
export function prepareNFTAttributes(
  pixelData: Record<string, string>,
  canvasSize: number,
  creatorMessage?: string
): Array<{ trait_type: string; value: string | number }> {
  // Compute rarity stats
  const { rarity, stats } = computeRarityStats(pixelData, canvasSize);

  // Build attributes array
  const attributes: Array<{ trait_type: string; value: string | number }> = [
    {
      trait_type: "Rarity",
      value: rarity,
    },
    {
      trait_type: "Pixels Used",
      value: stats.pixelsUsed,
    },
    {
      trait_type: "Colors Used",
      value: stats.colorsUsed,
    },
    {
      trait_type: "Quality Score",
      value: stats.qualityScore,
    },
    {
      trait_type: "Canvas Size",
      value: `${canvasSize}x${canvasSize}`,
    },
  ];

  // Add creator message as an attribute if provided
  if (creatorMessage && creatorMessage.trim().length > 0) {
    attributes.push({
      trait_type: "Creator Message",
      value: creatorMessage.trim(),
    });
  }

  return attributes;
}
