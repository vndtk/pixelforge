# ArDrive Turbo Setup with ArweaveSigner

This document explains how Mintistry uses ArDrive Turbo with your existing Arweave wallet (key.json).

## ✅ Configuration Complete

Your Turbo setup has been migrated to use `ArweaveSigner` with `key.json`.

### What Changed

**Before:**
- Used `TURBO_PRIVATE_KEY` environment variable
- Required Solana keypair format
- Complex key parsing logic

**After:**
- Uses `key.json` file (Arweave JWK format)
- Direct ArweaveSigner integration
- Cleaner, more secure implementation

## 📁 File Structure

```
mintistry/
├── key.json                    ← Your Arweave JWK (gitignored)
├── lib/
│   └── turbo.ts               ← Turbo initialization with ArweaveSigner
├── app/api/
│   ├── upload-image/          ← Uses turbo for image uploads
│   └── upload-metadata/       ← Uses turbo for metadata uploads
└── scripts/
    └── test-turbo.ts          ← Verification script
```

## 🔑 key.json Format

Your `key.json` should be an Arweave JWK with this structure:

```json
{
  "kty": "RSA",
  "n": "...",
  "e": "AQAB",
  "d": "...",
  "p": "...",
  "q": "...",
  "dp": "...",
  "dq": "...",
  "qi": "..."
}
```

**Where to get it:**
- Download from ArDrive: https://app.ardrive.io
- Export from your Arweave wallet
- Generate with Arweave CLI

**Security:**
- ✅ `key.json` is in `.gitignore`
- ✅ Never commit this file to git
- ✅ Only used server-side (API routes)

## 🧪 Testing

### Test Turbo Initialization (No Server Required)

```bash
# Run the verification script
npx tsx scripts/test-turbo.ts
```

**Expected output:**
```
✅ Loaded Arweave JWK from key.json
✅ Turbo instance created successfully
✅ Balance: <winc amount> winc
✅ All checks passed!
```

**If you see errors:**
- Verify `key.json` exists in project root
- Check that `key.json` is valid JSON
- Ensure it's an Arweave JWK format (not Solana keypair)

### What the Test Checks

1. ✅ `key.json` can be loaded
2. ✅ JSON is valid and parseable
3. ✅ `ArweaveSigner` is created successfully
4. ✅ Turbo instance is initialized
5. ✅ Balance can be fetched from Turbo API

## 💰 Funding Your Turbo Wallet

Your Turbo wallet needs credits to upload files to Arweave.

### Check Balance

```bash
# Run the test script to see current balance
npx tsx scripts/test-turbo.ts
```

### Add Funds

1. Visit: https://app.ardrive.io/#/turbo
2. Connect with the same wallet as your `key.json`
3. Purchase Turbo credits with:
   - SOL (Solana)
   - AR (Arweave)
   - ETH (Ethereum)
   - POL (Polygon)

**How much do you need?**
- ~0.0001 SOL per image upload (~2-5 KB)
- ~0.00005 SOL per metadata upload (~1 KB)
- Estimate: 0.001 SOL = ~6-7 NFT mints

## 📝 Code Usage

### In API Routes

```typescript
// Import the turbo instance
import { turbo, uploadToTurbo } from "@/lib/turbo";

// Upload a file
const { url, id } = await uploadToTurbo(
  buffer,
  "image/png",
  [{ name: "File-Name", value: "artwork.png" }]
);
```

### Available Functions

```typescript
// Upload file to Arweave
uploadToTurbo(data: Buffer, contentType: string, tags?: Tag[]): Promise<{url, id}>

// Get upload cost estimate
getUploadCost(bytes: number): Promise<{winc: string}>

// Get current balance
getTurboBalance(): Promise<{winc: string}>

// Log wallet info (for debugging)
logTurboInfo(): Promise<void>
```

## 🚫 What Was Removed

- ❌ `TURBO_PRIVATE_KEY` environment variable
- ❌ `scripts/generate-turbo-keypair.ts` (obsolete)
- ❌ Solana Keypair parsing logic
- ❌ Complex key format conversions

## ✅ What's Working

- ✅ `/api/upload-image` - Uploads pixel art to Arweave
- ✅ `/api/upload-metadata` - Uploads NFT metadata to Arweave
- ✅ ArweaveSigner authentication
- ✅ Turbo balance checking
- ✅ Upload cost estimation

## 🔧 Troubleshooting

### Error: "Cannot load key.json"

**Solution:**
```bash
# Verify file exists
ls -la key.json

# Check it's valid JSON
cat key.json | jq .

# Ensure it's in project root
pwd  # Should be /path/to/mintistry
```

### Error: "bad secret key size"

This error is **gone** with the new setup! It was caused by trying to parse an Arweave JWK as a Solana keypair.

### Error: "Failed to fetch Turbo balance"

**Possible causes:**
- No internet connection
- Turbo API is down
- Invalid JWK format

**Solution:**
- Check internet connection
- Verify `key.json` format
- Try again in a few minutes

### Balance is 0

**This is expected if you haven't funded yet.**

**Solution:**
1. Visit https://app.ardrive.io/#/turbo
2. Connect your wallet
3. Purchase credits

## 📚 References

- **ArDrive Turbo Docs**: https://docs.ardrive.io/docs/turbo/
- **Turbo SDK**: https://github.com/ardriveapp/turbo-sdk
- **ArweaveSigner**: https://docs.ardrive.io/docs/turbo/sdk/authentication/

## ✨ Next Steps

1. ✅ Verify test passes: `npx tsx scripts/test-turbo.ts`
2. ⚠️  Fund your Turbo wallet (if balance is 0)
3. ✅ Try minting an NFT through the app
4. ✅ Check that images/metadata upload successfully

Your Turbo setup is complete and ready to use!
