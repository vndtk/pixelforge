"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useMintingCost } from "@/hooks/useMintingCost";
import { MintingCostDisplay } from "@/components/MintingCostDisplay";
import {
  prepareMintData,
  getBase64ImageSize,
  formatBytes,
  prepareNFTAttributes,
} from "@/lib/prepare-mint-data";
import { signMintingRequest } from "@/lib/wallet-signature";
import type {
  MintNFTRequest,
  MintNFTResponse,
  UploadImageRequest,
  UploadImageResponse,
  UploadMetadataRequest,
  UploadMetadataResponse,
} from "@/types/minting";

const LAMPORTS_PER_SOL = 1_000_000_000;

export default function PreviewPage() {
  const router = useRouter();
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const { connection } = useConnection();

  const [imageData, setImageData] = useState<string>("");
  const [pixelData, setPixelData] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [canvasSize, setCanvasSize] = useState(32); // Default to 32x32
  const [userBalance, setUserBalance] = useState(0);
  const [isMinting, setIsMinting] = useState(false);
  const [mintingError, setMintingError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  // Use minting cost hook
  const mintingCost = useMintingCost({
    nftName: name,
    creatorMessage: message,
    canvasSize: canvasSize,
  });

  useEffect(() => {
    // Load image data from sessionStorage
    const savedImage = sessionStorage.getItem("canvasImage");
    if (!savedImage) {
      // Redirect back to create page if no image data
      router.push("/create");
      return;
    }
    setImageData(savedImage);

    // Load pixel data from sessionStorage
    const savedPixels = sessionStorage.getItem("canvasPixels");
    if (savedPixels) {
      try {
        const parsed = JSON.parse(savedPixels);
        setPixelData(parsed);
        // You could parse this to determine actual size, for now default to 32
        setCanvasSize(32);
      } catch (error) {
        console.error("Failed to parse pixel data:", error);
      }
    }
  }, [router]);

  // Fetch user balance
  useEffect(() => {
    if (!publicKey || !connected) {
      setUserBalance(0);
      return;
    }

    const fetchBalance = async () => {
      try {
        const balance = await connection.getBalance(publicKey);
        setUserBalance(balance / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error("Failed to fetch balance:", error);
        setUserBalance(0);
      }
    };

    fetchBalance();

    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [publicKey, connected, connection]);

  const handleMint = async () => {
    if (!publicKey || !connected) {
      setMintingError("Please connect your wallet to mint");
      return;
    }

    setIsMinting(true);
    setMintingError(null);
    setUploadStatus("Preparing data...");

    try {
      // Prepare minting data
      const prepared = prepareMintData({
        name,
        creatorMessage: message,
        imageData,
        pixelData,
        canvasSize,
        walletAddress: publicKey.toBase58(),
        network: "devnet", // Change to "mainnet-beta" when ready
      });

      // Validate data
      if (!prepared.isValid) {
        setMintingError(prepared.validationErrors.join(", "));
        setIsMinting(false);
        return;
      }

      // Log prepared data for debugging
      console.log("=== MINTING REQUEST PREPARED ===");
      console.log("Wallet Address:", prepared.request.walletAddress);
      console.log("NFT Name:", prepared.request.name);
      console.log("Symbol:", prepared.request.symbol);
      console.log(
        "Creator Message:",
        prepared.request.creatorMessage || "None",
      );
      console.log("Canvas Size:", prepared.request.canvasSize);
      console.log(
        "Pixel Count:",
        Object.keys(prepared.request.pixelData).length,
      );
      console.log(
        "Image Size:",
        formatBytes(getBase64ImageSize(prepared.request.imageBase64)),
      );
      console.log(
        "Image Data (first 100 chars):",
        prepared.request.imageBase64.substring(0, 100) + "...",
      );
      console.log("Network:", prepared.request.network);

      // Optional: Sign the request for backend verification
      const signatureData = await signMintingRequest(wallet, name);
      if (signatureData) {
        prepared.request.signature = signatureData.signature;
        console.log("Request Signature:", signatureData.signature);
        console.log("Signature Timestamp:", signatureData.timestamp);
      } else {
        console.log(
          "Note: Signature creation skipped (wallet may not support signMessage)",
        );
      }

      console.log("\n=== STEP 1: UPLOADING IMAGE TO ARWEAVE ===");
      setUploadStatus("Uploading image to Arweave...");

      // Step 1: Upload image to Arweave
      const imageUploadRequest: UploadImageRequest = {
        imageBase64: prepared.request.imageBase64,
        name: `${prepared.request.name}.png`,
      };

      const imageResponse = await fetch("/api/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(imageUploadRequest),
      });

      const imageResult: UploadImageResponse = await imageResponse.json();

      console.log("\n=== IMAGE UPLOAD RESPONSE ===");
      console.log(JSON.stringify(imageResult, null, 2));

      if (!imageResult.success || !imageResult.imageUrl) {
        setMintingError(
          imageResult.error || "Failed to upload image to Arweave",
        );
        console.error("❌ Image upload failed:", imageResult.error);
        return;
      }

      console.log("✅ Image uploaded successfully!");
      console.log("Image URL:", imageResult.imageUrl);

      // Step 2: Upload metadata to Arweave
      console.log("\n=== STEP 2: UPLOADING METADATA TO ARWEAVE ===");
      setUploadStatus("Uploading metadata to Arweave...");

      // Prepare NFT attributes with rarity calculation
      const attributes = prepareNFTAttributes(
        prepared.request.pixelData,
        prepared.request.canvasSize,
        prepared.request.creatorMessage
      );

      console.log("✨ NFT Attributes (with rarity):", attributes);

      const metadataUploadRequest: UploadMetadataRequest = {
        name: prepared.request.name,
        symbol: prepared.request.symbol || "FORGE",
        description: prepared.request.creatorMessage,
        imageUrl: imageResult.imageUrl,
        attributes: attributes,
        externalUrl: "https://pixelforge.app",
        sellerFeeBasisPoints: 500, // 5% royalty
        creatorAddress: prepared.request.walletAddress,
      };

      const metadataResponse = await fetch("/api/upload-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadataUploadRequest),
      });

      const metadataResult: UploadMetadataResponse =
        await metadataResponse.json();

      console.log("\n=== METADATA UPLOAD RESPONSE ===");
      console.log(JSON.stringify(metadataResult, null, 2));

      if (!metadataResult.success || !metadataResult.metadataUri) {
        setMintingError(
          metadataResult.error || "Failed to upload metadata to Arweave",
        );
        console.error("❌ Metadata upload failed:", metadataResult.error);
        return;
      }

      console.log("✅ Metadata uploaded successfully!");
      console.log("Metadata URI:", metadataResult.metadataUri);

      // Step 3: Mint NFT on Solana
      console.log("\n=== STEP 3: MINTING NFT ON SOLANA ===");
      setUploadStatus("Minting NFT on Solana...");

      const mintRequest = {
        metadataUri: metadataResult.metadataUri,
        name: prepared.request.name,
        symbol: prepared.request.symbol || "FORGE",
        sellerFeeBasisPoints: 500, // 5% royalty
        recipientAddress: prepared.request.walletAddress,
      };

      const mintResponse = await fetch("/api/mint-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mintRequest),
      });

      const mintResult = await mintResponse.json();

      console.log("\n=== MINT RESPONSE ===");
      console.log(JSON.stringify(mintResult, null, 2));

      if (!mintResult.success) {
        setMintingError(mintResult.error || "Failed to mint NFT");
        console.error("❌ Minting failed:", mintResult.error);
        return;
      }

      console.log("\n🎉 NFT MINTED SUCCESSFULLY!");
      console.log("Transaction:", mintResult.signature);
      console.log("Mint Address:", mintResult.mintAddress);
      console.log("Image URL:", imageResult.imageUrl);
      console.log("Metadata URI:", metadataResult.metadataUri);

      const explorerUrl = `https://explorer.solana.com/tx/${mintResult.signature}?cluster=devnet`;

      alert(
        `🎉 NFT Minted Successfully!\n\n` +
          `Name: ${prepared.request.name}\n` +
          `Mint Address: ${mintResult.mintAddress}\n\n` +
          `Transaction: ${mintResult.signature}\n\n` +
          `View on Explorer:\n${explorerUrl}`,
      );

      // TODO: Redirect to success page or show NFT
      // router.push(`/success?mint=${mintResult.mintAddress}`);

      setUploadStatus("Complete! ✅");
    } catch (error) {
      console.error("Error preparing minting data:", error);
      setMintingError(
        error instanceof Error
          ? error.message
          : "Failed to prepare minting data",
      );
    } finally {
      setIsMinting(false);
      setUploadStatus("");
    }
  };

  if (!imageData) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 w-full max-w-5xl mx-auto space-y-8">
      <div className="w-full flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/create")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Editor
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        {/* Image Preview */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-primary">Preview</h2>
          <div className="bg-muted/20 border border-border rounded-none p-8 flex items-center justify-center">
            <img
              src={imageData}
              alt="Pixel art preview"
              className="max-w-full h-auto"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-primary">NFT Details</h2>

          <Card className="rounded-none">
            <CardContent className="pt-6 space-y-6">
              {/* Name Input */}
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  maxLength={32}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter NFT name"
                  className="w-full h-10 px-4 py-2 bg-background border border-border rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {name.length}/32 characters
                </p>
              </div>

              <Separator />

              {/* Message/Inscription */}
              <div className="space-y-2">
                <label
                  htmlFor="message"
                  className="text-sm font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Creator Message (Optional)
                </label>
                <textarea
                  id="message"
                  maxLength={80}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a message or inscription..."
                  rows={3}
                  className="w-full px-4 py-2 bg-background border border-border rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {message.length}/80 characters
                </p>
              </div>

              <Separator />

              {/* Minting Cost Display */}
              {connected ? (
                <MintingCostDisplay
                  cost={mintingCost}
                  userBalance={userBalance}
                />
              ) : (
                <Card className="border-yellow-500/50 bg-yellow-500/10">
                  <CardContent className="pt-4">
                    <p className="text-sm text-yellow-500">
                      Connect your wallet to see minting cost
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Error Display */}
              {mintingError && (
                <Card className="border-red-500/50 bg-red-500/10">
                  <CardContent className="pt-4">
                    <p className="text-sm text-red-500">{mintingError}</p>
                  </CardContent>
                </Card>
              )}

              {/* Mint Button */}
              <Button
                className="w-full h-12 text-lg font-bold tracking-wider uppercase"
                disabled={
                  !name.trim() ||
                  !connected ||
                  isMinting ||
                  mintingCost.isLoading ||
                  userBalance < mintingCost.total ||
                  Object.keys(pixelData).length === 0
                }
                onClick={handleMint}
                title={
                  !connected
                    ? "Connect wallet to mint"
                    : userBalance < mintingCost.total
                      ? "Insufficient SOL balance"
                      : Object.keys(pixelData).length === 0
                        ? "Canvas is empty"
                        : ""
                }
              >
                {!connected
                  ? "Connect Wallet to Mint"
                  : isMinting
                    ? uploadStatus || "Processing..."
                    : mintingCost.isLoading
                      ? "Calculating cost..."
                      : "Mint NFT"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
