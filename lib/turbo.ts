/**
 * ArDrive Turbo SDK initialization using ArweaveSigner
 *
 * This module loads the Arweave JWK from key.json and creates
 * a Turbo instance for uploading files to Arweave.
 *
 * IMPORTANT: This is SERVER-SIDE ONLY code.
 * Do not import this in client components.
 */

import { TurboFactory, ArweaveSigner } from "@ardrive/turbo-sdk";
import fs from "fs";
import path from "path";

// Load Arweave JWK from key.json
const jwkPath = path.join(process.cwd(), "key.json");

let jwk: any;
try {
  const jwkRaw = fs.readFileSync(jwkPath, "utf8");
  jwk = JSON.parse(jwkRaw);
  console.log("✅ Loaded Arweave JWK from key.json");
} catch (error) {
  console.error("❌ Failed to load key.json:", error);
  throw new Error(
    `Cannot load key.json from ${jwkPath}. Ensure the file exists and is valid JSON.`
  );
}

// Create ArweaveSigner
const signer = new ArweaveSigner(jwk);

// Initialize Turbo with authenticated signer
export const turbo = TurboFactory.authenticated({ signer });

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
    { name: "App-Name", value: "PixelForge" },
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
