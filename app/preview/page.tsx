"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import {
  prepareNFTAttributes,
  getBase64ImageSize,
  formatBytes,
} from "@/lib/prepare-upload-data";
import type {
  UploadImageRequest,
  UploadImageResponse,
  UploadMetadataRequest,
  UploadMetadataResponse,
} from "@/types/upload";

export default function PreviewPage() {
  const router = useRouter();

  const [imageData, setImageData] = useState<string>("");
  const [pixelData, setPixelData] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [canvasSize, setCanvasSize] = useState(32);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [uploadedUrls, setUploadedUrls] = useState<{
    imageUrl?: string;
    metadataUri?: string;
  }>({});

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
        setCanvasSize(32);
      } catch (error) {
        console.error("Failed to parse pixel data:", error);
      }
    }
  }, [router]);

  const handleUpload = async () => {
    if (!name.trim()) {
      setUploadError("Please enter a name");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadStatus("Preparing data...");

    try {
      // Step 1: Upload image to Arweave
      console.log("\n=== STEP 1: UPLOADING IMAGE TO ARWEAVE ===");
      setUploadStatus("Uploading image to Arweave...");

      const imageUploadRequest: UploadImageRequest = {
        imageBase64: imageData,
        name: `${name}.png`,
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
        setUploadError(
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
        pixelData,
        canvasSize,
        message
      );

      console.log("✨ Attributes (with rarity):", attributes);

      const metadataUploadRequest: UploadMetadataRequest = {
        name: name,
        symbol: "MINTISTRY",
        description: message || `${name} - Pixel art created on Mintistry`,
        imageUrl: imageResult.imageUrl,
        attributes: attributes,
        externalUrl: "https://mintistry.app",
        sellerFeeBasisPoints: 500,
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
        setUploadError(
          metadataResult.error || "Failed to upload metadata to Arweave",
        );
        console.error("❌ Metadata upload failed:", metadataResult.error);
        return;
      }

      console.log("✅ Metadata uploaded successfully!");
      console.log("Metadata URI:", metadataResult.metadataUri);

      setUploadedUrls({
        imageUrl: imageResult.imageUrl,
        metadataUri: metadataResult.metadataUri,
      });

      setUploadStatus("Complete! ✅");
    } catch (error) {
      console.error("Error uploading:", error);
      setUploadError(
        error instanceof Error
          ? error.message
          : "Failed to upload files",
      );
    } finally {
      setIsUploading(false);
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
          <h2 className="text-2xl font-bold text-primary">Upload Details</h2>

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
                  placeholder="Enter name"
                  className="w-full h-10 px-4 py-2 bg-background border border-border rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {name.length}/32 characters
                </p>
              </div>

              <Separator />

              {/* Message/Description */}
              <div className="space-y-2">
                <label
                  htmlFor="message"
                  className="text-sm font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="message"
                  maxLength={80}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a description..."
                  rows={3}
                  className="w-full px-4 py-2 bg-background border border-border rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {message.length}/80 characters
                </p>
              </div>

              <Separator />

              {/* Image Size Info */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Image Size:</span>
                  <span className="font-medium">
                    {formatBytes(getBase64ImageSize(imageData))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pixels Used:</span>
                  <span className="font-medium">
                    {Object.keys(pixelData).length}
                  </span>
                </div>
              </div>

              {/* Success Display */}
              {uploadedUrls.imageUrl && uploadedUrls.metadataUri && (
                <>
                  <Separator />
                  <Card className="border-green-500/50 bg-green-500/10">
                    <CardContent className="pt-4">
                      <p className="text-sm font-medium text-green-500 mb-2">
                        ✅ Upload Successful!
                      </p>
                      <div className="space-y-1 text-xs">
                        <div>
                          <span className="text-muted-foreground">Image: </span>
                          <a
                            href={uploadedUrls.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline break-all"
                          >
                            {uploadedUrls.imageUrl}
                          </a>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Metadata:{" "}
                          </span>
                          <a
                            href={uploadedUrls.metadataUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline break-all"
                          >
                            {uploadedUrls.metadataUri}
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Error Display */}
              {uploadError && (
                <Card className="border-red-500/50 bg-red-500/10">
                  <CardContent className="pt-4">
                    <p className="text-sm text-red-500">{uploadError}</p>
                  </CardContent>
                </Card>
              )}

              {/* Upload Button */}
              <Button
                className="w-full h-12 text-lg font-bold tracking-wider uppercase"
                disabled={
                  !name.trim() ||
                  isUploading ||
                  Object.keys(pixelData).length === 0
                }
                onClick={handleUpload}
                title={
                  Object.keys(pixelData).length === 0
                    ? "Canvas is empty"
                    : ""
                }
              >
                {isUploading
                  ? uploadStatus || "Uploading..."
                  : "Upload to Arweave"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
