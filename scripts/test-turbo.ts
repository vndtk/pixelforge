/**
 * Turbo Initialization Test
 *
 * This script verifies that:
 * 1. JWK can be loaded (from env vars or key.json)
 * 2. ArweaveSigner is created successfully
 * 3. Turbo instance is initialized
 * 4. Balance can be fetched (if funded)
 *
 * Run with: npx tsx scripts/test-turbo.ts
 *
 * IMPORTANT: This does NOT start the Next.js dev server.
 * It's a standalone Node.js script for verification only.
 */

import { turbo, getTurboBalance, logTurboInfo } from "../lib/turbo";

async function main() {
  console.log("\n=== TURBO INITIALIZATION TEST ===\n");

  try {
    // Step 1: Verify turbo instance exists
    console.log("1. Checking Turbo instance...");
    if (!turbo) {
      throw new Error("Turbo instance is undefined");
    }
    console.log("   ✅ Turbo instance created successfully\n");

    // Step 2: Try to get balance (this verifies the signer works)
    console.log("2. Fetching Turbo balance...");
    const balance = await getTurboBalance();
    console.log(`   ✅ Balance: ${balance.winc} winc\n`);

    if (balance.winc === "0") {
      console.warn("   ⚠️  WARNING: Balance is 0");
      console.warn("   You need to fund your Turbo wallet to upload files");
      console.warn("   Visit: https://app.ardrive.io/#/turbo\n");
    } else {
      console.log("   ✅ Wallet has credits and is ready to use\n");
    }

    // Step 3: Display full info
    await logTurboInfo();

    console.log("\n=== TEST RESULT ===");
    console.log("✅ All checks passed!");
    console.log("✅ Turbo is configured correctly with ArweaveSigner");
    console.log("✅ JWK loaded successfully");
    console.log("\nYou can now use Turbo in your API routes.\n");

    process.exit(0);
  } catch (error) {
    console.error("\n=== TEST FAILED ===");
    console.error("❌ Error:", error);

    if (error instanceof Error) {
      if (error.message.includes("No Turbo JWK found")) {
        console.error("\n💡 Turbo JWK not configured. Choose one option:");
        console.error("\n   Option 1: Environment Variables (Production/Vercel)");
        console.error("   - Set TURBO_JWK_BASE64 with base64-encoded JWK");
        console.error("   - Or set TURBO_JWK_JSON with raw JSON string");
        console.error("\n   Option 2: Local Development");
        console.error("   - Download JWK from ArDrive: https://app.ardrive.io");
        console.error("   - Place as key.json in project root");
        console.error("   - Verify it's valid JSON (Arweave JWK format)");
      }
    }

    console.error();
    process.exit(1);
  }
}

main();
