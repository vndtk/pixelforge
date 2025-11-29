"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";

const VIBES = ["Retro", "Neon", "Punk", "Minimal", "Chaos", "Based", "Cute", "Dark"];

export default function PreviewPage() {
  const router = useRouter();
  const [imageData, setImageData] = useState<string>("");
  const [name, setName] = useState("");
  const [vibe, setVibe] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Load image data from sessionStorage
    const savedImage = sessionStorage.getItem("canvasImage");
    if (!savedImage) {
      // Redirect back to create page if no image data
      router.push("/create");
      return;
    }
    setImageData(savedImage);
  }, [router]);

  const handleMint = () => {
    // TODO: Implement actual minting logic
    console.log("Minting with data:", {
      name,
      vibe,
      message,
      imageData,
    });
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
                <label htmlFor="name" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
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

              {/* Vibe Dropdown */}
              <div className="space-y-2">
                <label htmlFor="vibe" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Vibe (Optional)
                </label>
                <select
                  id="vibe"
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value)}
                  className="w-full h-10 px-4 py-2 bg-background border border-border rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                >
                  <option value="">Select a vibe...</option>
                  {VIBES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <Separator />

              {/* Message/Inscription */}
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
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

              {/* Mint Button */}
              <Button
                className="w-full h-12 text-lg font-bold tracking-wider uppercase"
                disabled={!name.trim()}
                onClick={handleMint}
              >
                Mint NFT
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
