/**
 * ArDrive Turbo SDK initialization using ArweaveSigner
 *
 * Supports both environment variables (production) and local key.json (development).
 *
 * Environment variables (priority order):
 * 1. TURBO_JWK_BASE64 - Base64-encoded JWK string
 * 2. TURBO_JWK_JSON - Raw JSON string of JWK
 * 3. Fallback: key.json file in project root (local dev only)
 *
 * IMPORTANT: This is SERVER-SIDE ONLY code.
 * Do not import this in client components.
 */

import { TurboFactory, ArweaveSigner } from "@ardrive/turbo-sdk";
import fs from "fs";
import path from "path";

/**
 * Loads Arweave JWK from environment variables or local file
 */
function loadJwk() {
  // 1. Try Base64-encoded JWK from env (recommended for production)
  const base64 = process.env.TURBO_JWK_BASE64;
  if (base64 && base64.length > 0) {
    console.log("✅ Loading JWK from TURBO_JWK_BASE64 environment variable");
    const decoded = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(decoded);
  }

  // 2. Try JSON JWK from env (alternative for production)
  const json = process.env.TURBO_JWK_JSON;
  if (json && json.length > 0) {
    console.log("✅ Loading JWK from TURBO_JWK_JSON environment variable");
    return JSON.parse(json);
  }

  // 3. Fallback: load key.json from local filesystem (for local dev)
  const jwkPath = path.join(process.cwd(), "key.json");

  if (!fs.existsSync(jwkPath)) {
    throw new Error(
      "No Turbo JWK found. Please set TURBO_JWK_BASE64 or TURBO_JWK_JSON " +
      "environment variable, or place key.json in the project root."
    );
  }

  console.log("✅ Loading JWK from key.json (local development)");
  const jwkRaw = fs.readFileSync(jwkPath, "utf8");
  return JSON.parse(jwkRaw);
}

// Load JWK and create signer
const jwk = loadJwk();
const signer = new ArweaveSigner(jwk);

// Initialize Turbo with authenticated signer
export const turbo = TurboFactory.authenticated({ signer });

console.log("✅ Turbo initialized successfully");

/**
 * Upload data to Arweave via ArDrive Turbo
 */
export async function uploadToTurbo(
  data: Buffer,
  contentType: string,
  tags: { name: string; value: string }[] = []
): Promise<{ url: string; id: string }> {
  // Add content type tag
  const allTags = [
    { name: "Content-Type", value: contentType },
    { name: "App-Name", value: "Mintistry" },
    ...tags,
  ];

  console.log(`📤 Uploading ${data.length} bytes to ArDrive Turbo...`);
  console.log(`   Content-Type: ${contentType}`);

  // Upload using Turbo SDK
  const uploadResult = await turbo.uploadFile({
    fileStreamFactory: () => data,
    fileSizeFactory: () => data.length,
    dataItemOpts: {
      tags: allTags,
    },
  });

  const id = uploadResult.id;
  const url = `https://arweave.net/${id}`;

  console.log(`✅ Upload successful!`);
  console.log(`   Transaction ID: ${id}`);
  console.log(`   URL: ${url}`);

  return {
    url,
    id,
  };
}

/**
 * Get upload cost estimate
 */
export async function getUploadCost(bytes: number): Promise<{
  winc: string;
}> {
  const costs = await turbo.getUploadCosts({
    bytes: [bytes],
  });

  // getUploadCosts returns an array of cost estimates
  const cost = costs[0];

  return {
    winc: cost.winc,
  };
}

/**
 * Get current Turbo balance
 */
export async function getTurboBalance(): Promise<{
  winc: string;
}> {
  const balance = await turbo.getBalance();

  return {
    winc: balance.winc,
  };
}

/**
 * Log Turbo wallet info and balance (for debugging)
 */
export async function logTurboInfo() {
  try {
    console.log("\n=== TURBO WALLET INFO ===");

    const balance = await getTurboBalance();
    console.log(`Balance: ${balance.winc} winc`);

    if (balance.winc === "0") {
      console.warn("⚠️  WARNING: Turbo balance is 0.");
      console.warn("   Fund your account at: https://app.ardrive.io/#/turbo");
    } else {
      console.log("✅ Turbo wallet has credits");
    }
  } catch (error) {
    console.error("Failed to fetch Turbo info:", error);
  }
}
