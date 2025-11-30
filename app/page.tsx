"use client";

import dynamic from "next/dynamic";

const PixelCanvas = dynamic(() => import("../components/PixelCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-[600px] w-[800px] bg-muted/20 rounded-none border border-border animate-pulse">
      <span className="text-muted-foreground">Loading Canvas...</span>
    </div>
  ),
});

export default function Home() {
  return <PixelCanvas />;
}
