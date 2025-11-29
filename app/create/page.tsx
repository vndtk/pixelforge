"use client";

import dynamic from "next/dynamic";

const PixelCanvas = dynamic(() => import("../../components/PixelCanvas"), {
    ssr: false,
    loading: () => (
        <div className="flex justify-center items-center h-[600px] w-[800px] bg-muted/20 rounded-none border border-border animate-pulse">
            <span className="text-muted-foreground">Loading Canvas...</span>
        </div>
    ),
});

export default function CreatePage() {
    return (
        <div className="flex flex-col items-center space-y-8">
            <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                    Draw your masterpiece on the canvas below.
                </p>
            </div>

            <PixelCanvas />
        </div>
    );
}
