# PixelForge

A pixel art NFT creation and minting platform built on Solana. Create pixel art directly in your browser and mint it as an NFT with permanent decentralized storage.

## Overview

PixelForge is a Next.js application that enables users to create pixel art on a 32x32 canvas and mint their creations as NFTs on the Solana blockchain. The application uses Metaplex Core for NFT creation, Arweave for permanent decentralized storage, and integrates with Solana wallet adapters for seamless user experience.

## Features

### Canvas & Drawing Tools
- **32x32 Pixel Grid** - High-resolution pixel art canvas
- **Draw & Erase Modes** - Switch between drawing and erasing tools
- **16-Color Palette** - Curated color selection for pixel art creation
- **Undo/Redo** - Full history management for your artwork
- **Canvas Persistence** - Automatically saves your work to localStorage
- **Touch Support** - Works on mobile and tablet devices

### NFT Minting
- **Solana Wallet Integration** - Connect via Phantom and other popular Solana wallets
- **Metaplex Core NFTs** - Modern, efficient NFT standard
- **Arweave Storage** - Permanent, decentralized image and metadata storage
- **Real-time Cost Calculator** - See minting costs before you commit
- **Balance Validation** - Checks your SOL balance before minting
- **NFT Metadata** - Add custom name and creator message (up to 80 characters)
- **Royalty Support** - Automatic 5% creator royalty configuration
- **Preview Before Mint** - Review your NFT details before finalizing

### Additional Features
- **Wallet Error Handling** - Helpful error messages and connection guidance
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Network Support** - Configured for Solana Devnet (ready for mainnet)
- **Transaction Explorer Links** - Direct links to view your minted NFTs

## Tech Stack

### Frontend
- **Next.js 16.0.4** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **React Konva** - Canvas rendering engine
- **Konva 10** - 2D graphics library

### Blockchain & Web3
- **@solana/web3.js** - Solana blockchain interaction
- **@solana/wallet-adapter-react** - Wallet connection management
- **@metaplex-foundation/mpl-core** - NFT standard implementation
- **@metaplex-foundation/umi** - Metaplex framework

### Storage
- **@ardrive/turbo-sdk** - Arweave upload service
- **Arweave** - Permanent decentralized storage

### UI Components
- **Radix UI** - Accessible component primitives (Separator, Slider, Slot)
- **Lucide React** - Icon library
- **class-variance-authority** - Component variants
- **clsx & tailwind-merge** - Utility class management

## Getting Started

### Prerequisites
- Node.js 20+ installed
- A Solana wallet (Phantom, Solflare, etc.)
- SOL tokens (for devnet, use the Solana faucet)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pixelforge
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. **Connect Your Wallet**
   - Click the wallet button in the header
   - Select your Solana wallet (e.g., Phantom)
   - Approve the connection

2. **Create Your Pixel Art**
   - Select a color from the palette
   - Click or drag on the canvas to draw
   - Use the eraser tool to remove pixels
   - Use undo/redo to refine your artwork
   - Your work is automatically saved

3. **Preview & Mint**
   - Click "Preview & Mint" when ready
   - Add an NFT name (required, max 32 characters)
   - Optionally add a creator message (max 80 characters)
   - Review the minting cost
   - Click "Mint NFT" to create your NFT

4. **View Your NFT**
   - After minting, you'll receive a transaction signature
   - View it on Solana Explorer (devnet)
   - Your NFT will appear in your wallet

## Project Structure

```
pixelforge/
├── app/
│   ├── api/               # API routes for minting operations
│   ├── create/            # Canvas creation page
│   ├── preview/           # NFT preview and minting page
│   ├── layout.tsx         # Root layout with wallet provider
│   └── page.tsx           # Home page (redirects to canvas)
├── components/
│   ├── ui/                # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── separator.tsx
│   │   └── slider.tsx
│   ├── AppWalletProvider.tsx
│   ├── Header.tsx
│   ├── MintingCostDisplay.tsx
│   └── PixelCanvas.tsx    # Main canvas component
├── constants/             # App constants and configuration
├── hooks/
│   └── useMintingCost.ts  # Cost calculation hook
├── lib/
│   ├── irys.ts            # Arweave upload utilities
│   ├── prepare-mint-data.ts
│   ├── turbo.ts
│   └── wallet-signature.ts
└── types/                 # TypeScript type definitions
```

## Development Notes

### Network Configuration
The application is currently configured for **Solana Devnet**. To switch to mainnet:
1. Update network references in API routes
2. Update wallet adapter configuration
3. Ensure sufficient SOL for mainnet minting costs

### Storage Provider
The app uses **ArDrive Turbo SDK** for uploading images and metadata to Arweave.

### Minting Flow
1. Image uploaded to Arweave (permanent storage)
2. Metadata JSON uploaded to Arweave
3. Metaplex Core NFT created on Solana
4. NFT transferred to user's wallet

### Local Storage
Canvas state is persisted in localStorage:
- `pixelforge_pixels` - Current pixel data
- `pixelforge_history` - Undo/redo history
- `pixelforge_historyIndex` - Current history position

Canvas image and pixel data for minting is stored in sessionStorage when navigating to preview.

## License

This project is private and not licensed for public use.

## Contributing

This is a private project. Contributions are not currently accepted.
