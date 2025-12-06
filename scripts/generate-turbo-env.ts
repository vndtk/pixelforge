/**
 * Generate TURBO_JWK_BASE64 environment variable for production
 *
 * This script reads your local key.json and outputs a base64-encoded
 * version that you can set as an environment variable on Vercel.
 *
 * Run with: npx tsx scripts/generate-turbo-env.ts
 */

import fs from "fs";
import path from "path";

function main() {
  console.log("\n=== GENERATE TURBO ENV VARIABLE ===\n");

  const jwkPath = path.join(process.cwd(), "key.json");

  // Check if key.json exists
  if (!fs.existsSync(jwkPath)) {
    console.error("❌ Error: key.json not found in project root");
    console.error("\n💡 Make sure you have key.json in the project root:");
    console.error("   - Download from ArDrive: https://app.ardrive.io");
    console.error("   - Place at: <project-root>/key.json");
    process.exit(1);
  }

  try {
    // Read and validate key.json
    const jwkRaw = fs.readFileSync(jwkPath, "utf8");
    const jwk = JSON.parse(jwkRaw);

    // Basic validation
    if (!jwk.kty || !jwk.n) {
      throw new Error("Invalid JWK format - missing required fields");
    }

    // Convert to base64
    const base64 = Buffer.from(jwkRaw).toString("base64");

    console.log("✅ Successfully read and validated key.json\n");
    console.log("📋 Copy this environment variable to your Vercel project:\n");
    console.log("─".repeat(60));
    console.log(`TURBO_JWK_BASE64=${base64}`);
    console.log("─".repeat(60));
    console.log("\n📝 Steps to deploy on Vercel:\n");
    console.log("1. Go to your Vercel project settings");
    console.log("2. Navigate to: Settings → Environment Variables");
    console.log("3. Add new variable:");
    console.log("   Name: TURBO_JWK_BASE64");
    console.log("   Value: [paste the value above]");
    console.log("   Environment: Production (or All)");
    console.log("4. Redeploy your application");
    console.log("\n✅ Your production app will now use this JWK!\n");
    console.log("⚠️  Security reminder:");
    console.log("   - Never commit this value to git");
    console.log("   - Keep key.json in .gitignore");
    console.log("   - Only set this in Vercel's environment variables\n");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();
