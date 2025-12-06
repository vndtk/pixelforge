# PixelForge Devnet Testing Guide

This guide will help you test the complete NFT minting flow on Solana devnet.

## ✅ What's Been Implemented

All critical components are now in place:

### Backend API Endpoints
- ✅ `/api/upload-image` - Uploads pixel art to Arweave
- ✅ `/api/upload-metadata` - Uploads NFT metadata to Arweave
- ✅ `/api/mint-nft` - **NEW!** Creates NFT on Solana blockchain

### Features
- ✅ Pixel art canvas with drawing tools
- ✅ Undo/redo and canvas persistence
- ✅ Wallet connection (Phantom, Solflare, etc.)
- ✅ Real-time minting cost calculator
- ✅ **Rarity system** - Automatically assigns rarity based on artwork quality
- ✅ Preview and metadata form
- ✅ Complete end-to-end minting flow

## 🔧 Prerequisites

### 1. Environment Setup

Your `.env` file is already configured with:
```bash
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
TURBO_PRIVATE_KEY=[configured]
NEXT_PUBLIC_COLLECTION_MINT=DVgMx8qW7P9238p991viJdmsgMatnoLNJtobVeaQrHkP
COLLECTION_UPDATE_AUTHORITY=[configured]
COLLECTION_ADMIN_WALLET=6du3x3kdwJjLQJym98ESjnEk3oMRLNWmkjtYVcuqp8kZ
```

### 2. Fund Accounts

#### A. Fund Turbo Account (for Arweave uploads)
1. Visit: https://app.ardrive.io/#/turbo
2. Connect with the wallet matching your `TURBO_PRIVATE_KEY`
3. Add credits (SOL or AR tokens)
4. Estimated cost: ~0.0001 SOL per image upload

**Check Current Balance:**
```bash
# Start dev server and check console output
npm run dev
# The Turbo balance will be logged on startup
```

#### B. Fund Collection Authority Wallet
The wallet derived from `COLLECTION_UPDATE_AUTHORITY` needs SOL to:
- Pay for NFT creation transactions
- Verify NFTs into the collection

**Get the wallet address:**
```bash
# It's logged when you start the server or make a mint request
# Or derive it from the private key
```

**Fund from faucet:**
```bash
solana airdrop 2 <WALLET_ADDRESS> --url devnet
```

Or use: https://faucet.solana.com

#### C. Fund Your Test Wallet (User Wallet)
You need SOL in your Phantom/Solflare wallet for:
- Receiving the minted NFT
- Gas fees are paid by server, but you need a small amount

**Fund from faucet:**
```bash
solana airdrop 1 <YOUR_WALLET_ADDRESS> --url devnet
```

## 🚀 Testing Steps

### Step 1: Start the Application

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

Open http://localhost:3000

### Step 2: Connect Your Wallet

1. Click "Connect Wallet" in the header
2. Select your wallet (Phantom, Solflare, etc.)
3. Approve the connection
4. Verify you're on Solana Devnet in your wallet

### Step 3: Create Pixel Art

1. Navigate to `/create` (or click "Create" if redirected)
2. Select a color from the 16-color palette
3. Draw on the 32x32 canvas
4. Use eraser to remove pixels
5. Use undo/redo as needed
6. Your work auto-saves to localStorage

**Tips for Testing Rarity:**
- **Low rarity test**: Use only 10-20 pixels with 1-2 colors → Likely "Common"
- **Medium rarity test**: Use 300-500 pixels with 5-8 colors → "Uncommon" or "Rare"
- **High rarity test**: Fill most/all canvas (800+ pixels) with 12+ colors → "Epic" or "Legendary"

### Step 4: Preview & Configure NFT

1. Click "Preview & Mint"
2. Enter NFT details:
   - **Name**: Required, max 32 characters
   - **Creator Message**: Optional, max 80 characters
3. Review minting cost breakdown:
   - Transaction Fee: ~0.00001 SOL
   - Metadata Storage: ~0.01 SOL
   - Token Account: ~0.002 SOL
   - Master Edition: ~0.003 SOL
   - **Total**: ~0.015-0.020 SOL

### Step 5: Mint Your NFT

1. Click "Mint NFT"
2. Wait for the 3-step process:

   **Step 1: Uploading Image to Arweave**
   - Converts canvas to PNG
   - Uploads to permanent storage
   - Returns Arweave URL

   **Step 2: Uploading Metadata to Arweave**
   - Creates Metaplex-compatible JSON
   - Includes rarity attributes:
     - Rarity tier (Common/Uncommon/Rare/Epic/Legendary)
     - Pixels used
     - Colors used
     - Quality score
   - Uploads to Arweave

   **Step 3: Minting NFT on Solana**
   - Creates NFT on-chain
   - Verifies into collection
   - Transfers to your wallet

3. Success! You'll see:
   - Transaction signature
   - Mint address
   - Link to Solana Explorer

### Step 6: Verify Your NFT

1. **View on Solana Explorer:**
   ```
   https://explorer.solana.com/address/<MINT_ADDRESS>?cluster=devnet
   ```

2. **Check in Wallet:**
   - Open Phantom/Solflare
   - Go to Collectibles/NFTs tab
   - Your NFT should appear with:
     - Name
     - Image
     - Attributes (including rarity!)

3. **Check Metadata:**
   - Visit the metadata URI shown in explorer
   - Verify all attributes are present

## 🐛 Troubleshooting

### Issue: "Failed to upload image to Arweave"
**Solution:**
- Check Turbo account balance
- Verify `TURBO_PRIVATE_KEY` is correct
- Check console for detailed error

### Issue: "Failed to mint NFT"
**Solution:**
- Ensure collection authority wallet has SOL
- Verify `COLLECTION_UPDATE_AUTHORITY` is correct
- Check RPC endpoint is responsive

### Issue: "Insufficient balance"
**Solution:**
- Fund your wallet from faucet
- Wait for transaction confirmation
- Refresh the page

### Issue: Wallet connection errors
**Solution:**
- Switch wallet to Devnet
- Try disconnecting and reconnecting
- Clear browser cache

## 📊 Monitoring & Logs

### Server Logs (Terminal)
The server provides detailed logging:
```
=== METADATA UPLOAD REQUEST ===
Name: My Pixel Art
Attributes: 6

=== MINT NFT API REQUEST ===
Metadata URI: https://arweave.net/...
Payer Wallet: ...

=== MINTING NFT WITH METAPLEX ===
Generated Mint Address: ...
✅ NFT Created!
✅ Collection verified!
```

### Browser Console
Check browser DevTools console for:
- Minting request details
- Transaction signatures
- Error messages

## 🎯 Testing Checklist

- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Turbo account funded
- [ ] Collection authority wallet funded
- [ ] User wallet connected
- [ ] User wallet has devnet SOL
- [ ] Server running (`npm run dev`)
- [ ] Canvas loads and drawing works
- [ ] Undo/redo works
- [ ] Preview shows correct image
- [ ] Minting cost displays
- [ ] Can enter NFT name and message
- [ ] Mint button enabled when ready
- [ ] Image uploads to Arweave successfully
- [ ] Metadata uploads to Arweave successfully
- [ ] NFT mints on Solana successfully
- [ ] NFT appears in wallet
- [ ] Rarity attributes present in metadata
- [ ] Transaction visible on Solana Explorer

## 🎨 Rarity System Testing

Create different artworks to test rarity distribution:

| Pixels | Colors | Expected Quality Score | Likely Rarity |
|--------|--------|----------------------|---------------|
| 10 | 2 | 0.04 | Common (59%) |
| 200 | 5 | 0.23 | Common (55%) |
| 500 | 8 | 0.49 | Common/Uncommon (50%) |
| 800 | 12 | 0.78 | Uncommon/Rare (35%) |
| 1024 | 16 | 1.0 | Uncommon/Rare/Epic (39% Common) |

## 📝 Example Test Scenario

1. **Low Quality Test:**
   - Draw a simple smiley face (20 pixels, 2 colors)
   - Expected: Common or Uncommon rarity
   - Minting cost: ~0.015 SOL

2. **High Quality Test:**
   - Create detailed pixel art (800+ pixels, 10+ colors)
   - Expected: Rare, Epic, or Legendary
   - Minting cost: ~0.020 SOL (more metadata storage)

3. **Collection Verification Test:**
   - Mint multiple NFTs
   - Verify all are part of the collection
   - Check collection mint: `DVgMx8qW7P9238p991viJdmsgMatnoLNJtobVeaQrHkP`

## 🔗 Useful Links

- **Solana Devnet Faucet**: https://faucet.solana.com
- **Solana Explorer**: https://explorer.solana.com/?cluster=devnet
- **ArDrive Turbo**: https://app.ardrive.io/#/turbo
- **Phantom Wallet**: https://phantom.app
- **Solflare Wallet**: https://solflare.com

## 🚀 Ready for Mainnet?

Before deploying to mainnet:

1. Update `.env`:
   ```bash
   NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
   NEXT_PUBLIC_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
   ```

2. Create mainnet collection

3. Fund production wallets with real SOL

4. Test thoroughly on devnet first!

5. Update references in code from `devnet` to `mainnet-beta`

## 💡 Notes

- All transactions on devnet are free (faucet SOL)
- Devnet can be reset, NFTs may disappear
- Metadata on Arweave is permanent (even on devnet)
- The rarity system uses cryptographically secure randomness
- Each mint creates a unique 1/1 NFT (Master Edition)
