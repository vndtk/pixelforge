/**
 * Debug script to check keypair configuration
 *
 * Run with: npx tsx scripts/check-keypair.ts
 */

import { Keypair } from '@solana/web3.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env file manually
function loadEnv() {
  const envPath = join(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  }
}

loadEnv();

console.log('\n=== KEYPAIR CONFIGURATION CHECK ===\n');

// Check COLLECTION_UPDATE_AUTHORITY
const authorityKey = process.env.COLLECTION_UPDATE_AUTHORITY;

if (!authorityKey) {
  console.error('❌ COLLECTION_UPDATE_AUTHORITY not set in .env');
  process.exit(1);
}

console.log('1. COLLECTION_UPDATE_AUTHORITY:');
console.log(`   Length: ${authorityKey.length} characters`);

try {
  // Try to parse as JSON first
  const parsed = JSON.parse(authorityKey);

  if (Array.isArray(parsed)) {
    console.log(`   ✅ Valid JSON array`);
    console.log(`   Array length: ${parsed.length} elements`);

    if (parsed.length === 64) {
      console.log('   ✅ Correct length (64 bytes)');

      // Try to create keypair
      try {
        const keypair = Keypair.fromSecretKey(Uint8Array.from(parsed));
        console.log(`   ✅ Successfully created keypair`);
        console.log(`   Public Key: ${keypair.publicKey.toBase58()}`);
      } catch (error) {
        console.error('   ❌ Failed to create keypair:', error);
      }
    } else {
      console.error(`   ❌ Wrong length: ${parsed.length} (expected 64)`);
    }
  } else {
    console.error('   ❌ Not an array, it\'s an object');
    console.log('   This looks like a JWK (JSON Web Key), not a Solana keypair');
    console.log('   Solana keypairs should be: [1,2,3,...] (64 numbers)');
  }
} catch (error) {
  console.log('   Not valid JSON, trying as base64...');

  try {
    const decoded = Buffer.from(authorityKey, 'base64');
    console.log(`   Decoded base64 length: ${decoded.length} bytes`);

    if (decoded.length === 64) {
      console.log('   ✅ Correct length (64 bytes)');
      const keypair = Keypair.fromSecretKey(decoded);
      console.log(`   ✅ Successfully created keypair`);
      console.log(`   Public Key: ${keypair.publicKey.toBase58()}`);
    } else {
      console.error(`   ❌ Wrong length: ${decoded.length} (expected 64)`);
    }
  } catch (base64Error) {
    console.error('   ❌ Not valid base64 either');
  }
}

console.log('\n=== TROUBLESHOOTING ===\n');
console.log('If you see errors above, your COLLECTION_UPDATE_AUTHORITY is not in the correct format.');
console.log('\nCorrect formats:');
console.log('1. JSON array: [12,34,56,...] (64 numbers)');
console.log('2. Base64 string: "AB12cd34..." (88 characters)');
console.log('\nTo generate a new keypair:');
console.log('  solana-keygen new --outfile keypair.json --no-bip39-passphrase');
console.log('  cat keypair.json');
console.log('\nThen copy the array into your .env file:');
console.log('  COLLECTION_UPDATE_AUTHORITY=[1,2,3,...]');
console.log();
