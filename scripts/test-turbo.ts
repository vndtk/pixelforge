/**
 * Turbo Initialization Test
 *
 * This script verifies that:
 * 1. key.json can be loaded
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
    console.log("✅ key.json loaded successfully");
    console.log("\nYou can now use Turbo in your API routes.\n");

    process.exit(0);
  } catch (error) {
    console.error("\n=== TEST FAILED ===");
    console.error("❌ Error:", error);

    if (error instanceof Error) {
      if (error.message.includes("key.json")) {
        console.error("\n💡 Make sure key.json exists in the project root:");
        console.error("   - Download from ArDrive: https://app.ardrive.io");
        console.error("   - Place at: <project-root>/key.json");
        console.error("   - Verify it's valid JSON (Arweave JWK format)");
      }
    }

    console.error();
    process.exit(1);
  }
}

main();
