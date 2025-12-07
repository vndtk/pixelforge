# Mintistry

A pixel art creation platform with permanent decentralized storage on Arweave. Create pixel art directly in your browser and upload it to Arweave for permanent storage.

## Overview

Mintistry is a Next.js application that enables users to create pixel art on a 32x32 canvas and upload their creations to Arweave for permanent decentralized storage. The application uses ArDrive Turbo for fast, cost-effective uploads to Arweave.

## Features

### Canvas & Drawing Tools
- **32x32 Pixel Grid** - High-resolution pixel art canvas
- **Draw & Erase Modes** - Switch between drawing and erasing tools
- **16-Color Palette** - Curated color selection for pixel art creation
- **Undo/Redo** - Full history management for your artwork
- **Canvas Persistence** - Automatically saves your work to localStorage
- **Touch Support** - Works on mobile and tablet devices
- **Clear Canvas** - Reset your artwork with one click

### Arweave Upload
- **Permanent Storage** - Upload images and metadata to Arweave via ArDrive Turbo
- **Metadata Support** - Add custom name (max 32 characters) and description (max 80 characters)
- **Rarity System** - Automatic rarity tier calculation (Common, Uncommon, Rare, Epic, Legendary) based on pixel usage and color diversity
- **Preview Before Upload** - Review your artwork details before uploading
- **Permanent URLs** - Get permanent Arweave URLs for your uploaded content

### Additional Features
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Image Size Display** - See the size of your artwork before uploading

## Tech Stack

### Frontend
- **Next.js 16.0.4** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **React Konva** - Canvas rendering engine
- **Konva 10** - 2D graphics library

### Storage
- **@ardrive/turbo-sdk** - ArDrive Turbo SDK for Arweave uploads
- **ArweaveSigner** - Authentication for Turbo uploads

### UI Components
- **Radix UI** - Accessible component primitives (Separator, Slider, Slot)
- **Lucide React** - Icon library
- **class-variance-authority** - Component variants
- **clsx & tailwind-merge** - Utility class management

## Getting Started

### Prerequisites
- Node.js 20+ installed
- Arweave JWK file (`key.json`) for Turbo uploads (see [TURBO_SETUP.md](./TURBO_SETUP.md))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mintistry
```

2. Install dependencies:
```bash
npm install
```

3. Set up Arweave Turbo:
   - Place your Arweave JWK file as `key.json` in the project root
   - Ensure `key.json` is in `.gitignore`
   - Test the setup: `npx tsx scripts/test-turbo.ts`
   - Fund your Turbo wallet at https://app.ardrive.io/#/turbo

4. Configure environment variables (optional for local dev):
   - See [Environment Variables](#environment-variables) section below
   - For production, see [DEPLOYMENT.md](./DEPLOYMENT.md)

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. **Create Your Pixel Art**
   - Select a color from the palette
   - Click or drag on the canvas to draw
   - Use the eraser tool to remove pixels
   - Use undo/redo to refine your artwork
   - Your work is automatically saved

2. **Preview & Upload**
   - Click "Preview & Upload" when ready
   - Add a name (required, max 32 characters)
   - Optionally add a description (max 80 characters)
   - Click "Upload to Arweave" to upload your artwork

3. **View Your Upload**
   - After uploading, you'll receive permanent Arweave URLs
   - Image URL: Direct link to your PNG image
   - Metadata URI: Link to your metadata JSON

## Project Structure

```
mintistry/
├── app/
│   ├── api/                    # API routes for upload operations
│   │   ├── upload-image/       # Upload image to Arweave
│   │   └── upload-metadata/    # Upload metadata to Arweave
│   ├── create/                 # Canvas creation page
│   ├── preview/                # Preview and upload page
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page (redirects to canvas)
├── components/
│   ├── ui/                     # Reusable UI components (Radix UI)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── separator.tsx
│   │   └── slider.tsx
│   ├── Header.tsx              # App header
│   └── PixelCanvas.tsx         # Main canvas component
├── lib/
│   ├── prepare-upload-data.ts  # Upload data preparation and validation
│   ├── rarity.ts               # Rarity tier calculation system
│   ├── turbo.ts                # ArDrive Turbo SDK integration
│   └── utils.ts                # Utility functions
├── scripts/
│   ├── generate-turbo-env.ts   # Generate Turbo env vars
│   └── test-turbo.ts           # Test Turbo initialization
└── types/
    └── upload.ts                # TypeScript type definitions
```

## Environment Variables

### Required for Production

```bash
# ArDrive Turbo (Arweave uploads)
TURBO_JWK_BASE64=<base64-encoded-arweave-jwk>
```

### Optional

```bash
# Alternative Turbo JWK format (not recommended)
TURBO_JWK_JSON=<raw-json-string>
```

### Local Development

For local development, place your Arweave JWK as `key.json` in the project root. The app will automatically use it if environment variables are not set.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup instructions.

## Development Notes

### Storage Provider
The app uses **ArDrive Turbo SDK** with ArweaveSigner for uploading images and metadata to Arweave. Turbo provides:
- Fast uploads with prepaid credits
- Permanent decentralized storage
- Cost-effective pricing

### Upload Flow
1. User creates pixel art on canvas
2. User navigates to preview page
3. Image uploaded to Arweave via Turbo (permanent storage)
4. Metadata JSON (with rarity attributes) uploaded to Arweave
5. Permanent URLs returned for both image and metadata

### Rarity System
Artwork is automatically assigned rarity tiers based on:
- **Pixel Usage**: Number of filled pixels (0 to canvasSize²)
- **Color Diversity**: Number of unique colors used (0 to 16)

Quality score calculation: `0.7 * pixelFactor + 0.3 * colorFactor`

Rarity tiers (with probability adjustments):
- **Common** (60% base, decreases with quality)
- **Uncommon** (25% base, slight increase)
- **Rare** (10% base, moderate increase)
- **Epic** (4% base, significant increase)
- **Legendary** (1% base, highest increase)

### Local Storage
Canvas state is persisted in localStorage:
- `mintistry_pixels` - Current pixel data (coordinate → color mapping)
- `mintistry_history` - Undo/redo history array
- `mintistry_historyIndex` - Current history position

Canvas image and pixel data for upload is stored in sessionStorage when navigating to preview:
- `canvasImage` - Base64 encoded PNG image
- `canvasPixels` - JSON string of pixel data

## API Routes

### `/api/upload-image`
Uploads pixel art image to Arweave via Turbo.
- **Method**: POST
- **Body**: `{ imageBase64: string, name?: string }`
- **Returns**: `{ success: boolean, imageUrl?: string, transactionId?: string }`

### `/api/upload-metadata`
Uploads metadata JSON to Arweave via Turbo.
- **Method**: POST
- **Body**: `{ name, symbol, description, imageUrl, attributes, sellerFeeBasisPoints, creatorAddress }`
- **Returns**: `{ success: boolean, metadataUri?: string, transactionId?: string, metadata?: object }`

## Scripts

### Test Turbo Setup
```bash
npx tsx scripts/test-turbo.ts
```
Verifies Turbo initialization and displays wallet balance.

### Generate Turbo Environment Variable
```bash
npx tsx scripts/generate-turbo-env.ts
```
Generates `TURBO_JWK_BASE64` value for production deployment.

## Additional Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide for Vercel
- **[TURBO_SETUP.md](./TURBO_SETUP.md)** - Detailed ArDrive Turbo setup instructions
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing procedures and guidelines

## License

This project is private and not licensed for public use.

## Contributing

This is a private project. Contributions are not currently accepted.
