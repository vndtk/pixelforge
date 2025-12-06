# Production Deployment Guide

This guide explains how to deploy PixelForge to production (Vercel) with proper Turbo configuration.

## Overview

PixelForge uses ArDrive Turbo for uploading images and metadata to Arweave. The setup supports:

- **Local Development**: Uses `key.json` file
- **Production (Vercel)**: Uses environment variables

## Environment Variables

### TURBO_JWK_BASE64 (Recommended)

Base64-encoded Arweave JWK for production use.

**How to generate:**

```bash
# Run the helper script
npx tsx scripts/generate-turbo-env.ts

# Copy the output TURBO_JWK_BASE64 value
```

**Add to Vercel:**

1. Go to your Vercel project
2. Settings → Environment Variables
3. Add new variable:
   - **Name**: `TURBO_JWK_BASE64`
   - **Value**: (paste the base64 string)
   - **Environment**: Production (or All)
4. Redeploy

### TURBO_JWK_JSON (Alternative)

Raw JSON string of your Arweave JWK.

**Not recommended** because JSON special characters can cause issues in env vars.

## Local Development

### Prerequisites

1. **Get your Arweave JWK**:
   - Download from ArDrive: https://app.ardrive.io
   - Or export from your Arweave wallet

2. **Place key.json in project root**:
   ```bash
   # Project structure:
   pixelforge/
   ├── key.json          ← Your Arweave JWK
   ├── app/
   ├── lib/
   └── ...
   ```

3. **Verify it's gitignored**:
   ```bash
   # Check .gitignore contains:
   key.json
   ```

### Test Locally

```bash
# Test Turbo initialization
npx tsx scripts/test-turbo.ts

# Expected output:
# ✅ Loading JWK from key.json (local development)
# ✅ Turbo initialized successfully
# ✅ All checks passed!
```

### Start Development Server

```bash
npm run dev
```

The app will automatically load JWK from `key.json`.

## Production Deployment (Vercel)

### Step 1: Generate Environment Variable

```bash
npx tsx scripts/generate-turbo-env.ts
```

This outputs a `TURBO_JWK_BASE64` value. **Copy it.**

### Step 2: Configure Vercel

1. **Go to Vercel Dashboard**
   - Open your project
   - Navigate to: Settings → Environment Variables

2. **Add TURBO_JWK_BASE64**
   - Click "Add New"
   - Name: `TURBO_JWK_BASE64`
   - Value: (paste the base64 string)
   - Environment: Select **Production** (or All if you want staging too)
   - Save

3. **Add Other Required Variables**

   You'll also need these (already in your `.env.example`):

   ```
   NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
   NEXT_PUBLIC_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
   NEXT_PUBLIC_COLLECTION_MINT=<your-collection-mint>
   COLLECTION_UPDATE_AUTHORITY=<your-authority-keypair>
   COLLECTION_ADMIN_WALLET=<your-admin-wallet>
   ```

### Step 3: Deploy

```bash
# If using Vercel CLI:
vercel --prod

# Or push to git (if auto-deploy is enabled)
git push origin main
```

### Step 4: Verify Deployment

1. **Check Build Logs**:
   - Look for: `✅ Loading JWK from TURBO_JWK_BASE64 environment variable`
   - Should **not** see: "Loading JWK from key.json"

2. **Test Upload**:
   - Create pixel art
   - Try minting an NFT
   - Verify image uploads to Arweave

## How It Works

### Loading Priority (lib/turbo.ts)

The system tries to load JWK in this order:

1. **TURBO_JWK_BASE64** env var (production)
2. **TURBO_JWK_JSON** env var (alternative)
3. **key.json** file (local dev fallback)

```typescript
// Simplified logic:
function loadJwk() {
  if (process.env.TURBO_JWK_BASE64) {
    return decodeBase64(process.env.TURBO_JWK_BASE64);
  }
  if (process.env.TURBO_JWK_JSON) {
    return JSON.parse(process.env.TURBO_JWK_JSON);
  }
  return fs.readFileSync("key.json", "utf8");
}
```

### Build Independence

The build **does not require** `key.json` to exist:

- ✅ Builds succeed without `key.json`
- ✅ Runtime loads JWK from env vars in production
- ✅ Only local dev uses `key.json` (via fallback)

## Troubleshooting

### Error: "No Turbo JWK found"

**Cause**: Neither env vars nor key.json are available.

**Solution**:
- **Local**: Ensure `key.json` exists in project root
- **Production**: Set `TURBO_JWK_BASE64` in Vercel

### Build fails with "Cannot find module 'fs'"

**Cause**: Trying to import `lib/turbo.ts` in a client component.

**Solution**: Only import Turbo in:
- ✅ API routes (`app/api/**/route.ts`)
- ✅ Server components
- ❌ NOT in client components (use "use client")

### Uploads fail in production

**Possible causes**:

1. **Turbo wallet has no credits**
   - Check balance: Visit https://app.ardrive.io/#/turbo
   - Fund with SOL/AR/ETH/POL

2. **Invalid JWK format**
   - Regenerate: `npx tsx scripts/generate-turbo-env.ts`
   - Update Vercel env var
   - Redeploy

3. **Wrong environment variable name**
   - Must be exactly: `TURBO_JWK_BASE64`
   - Case-sensitive

## Security Best Practices

### ✅ DO

- Store `key.json` only on your local machine
- Keep `key.json` in `.gitignore`
- Use environment variables for production
- Rotate keys if compromised
- Use separate wallets for dev/prod

### ❌ DON'T

- Commit `key.json` to git
- Share your JWK publicly
- Hardcode JWK in source code
- Use the same wallet for multiple projects
- Store JWK in client-side code

## Verification Checklist

Before deploying to production:

- [ ] `key.json` is in `.gitignore`
- [ ] Generated `TURBO_JWK_BASE64` value
- [ ] Added env var to Vercel
- [ ] Tested build locally: `npm run build`
- [ ] Tested Turbo init: `npx tsx scripts/test-turbo.ts`
- [ ] Funded Turbo wallet with credits
- [ ] Set all required Solana env vars
- [ ] Verified uploads work in production

## Scripts

| Script | Purpose | Environment |
|--------|---------|-------------|
| `test-turbo.ts` | Test Turbo initialization | Local/Vercel |
| `generate-turbo-env.ts` | Generate base64 env var | Local only |
| `check-keypair.ts` | Verify Solana keypairs | Local only |

## Environment Variables Reference

### Required for Production

```bash
# Turbo (Arweave uploads)
TURBO_JWK_BASE64=<base64-encoded-jwk>

# Solana Network
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_RPC_ENDPOINT=https://api.mainnet-beta.solana.com

# NFT Collection
NEXT_PUBLIC_COLLECTION_MINT=<collection-mint-address>
COLLECTION_UPDATE_AUTHORITY=<authority-keypair-array>
COLLECTION_ADMIN_WALLET=<admin-public-key>
```

### Optional

```bash
# Alternative to base64 (not recommended)
TURBO_JWK_JSON=<raw-json-string>
```

## Additional Resources

- **ArDrive Turbo Docs**: https://docs.ardrive.io/docs/turbo/
- **Vercel Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables
- **Arweave JWK Format**: https://docs.arweave.org/developers/server/http-api#key-format

## Support

If you encounter issues:

1. Check Vercel build logs
2. Verify environment variables are set
3. Test locally with `npx tsx scripts/test-turbo.ts`
4. Check Turbo balance at https://app.ardrive.io/#/turbo

Your PixelForge app is now ready for production deployment! 🚀
