"use client";

import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Rect } from "react-konva";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eraser, Pencil, Trash2 } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";

const COLORS = [
    "#FFFFFF", "#000000", "#FF6B6B", "#4ECDC4",
    "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F",
    "#B287C2", "#C3C3C3", "#7F7F7F", "#3366CC",
    "#FF69B4", "#00FF00", "#FFFF00", "#FF4500"
];

const GRID_SIZE = 32;

export default function PixelCanvas() {
    const { connected } = useWallet();
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [tool, setTool] = useState<"draw" | "erase">("draw");
    const [pixels, setPixels] = useState<Record<string, string>>({});
    const [isDrawing, setIsDrawing] = useState(false);
    const [canvasSize, setCanvasSize] = useState(640);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                const newSize = Math.min(width, 640);
                setCanvasSize(newSize);
            }
        };

        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, []);

    const cellSize = canvasSize / GRID_SIZE;

    const handleStart = (e: any) => {
        setIsDrawing(true);
        if (e.evt.type === 'touchstart') {
            e.evt.preventDefault();
        }
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();
        if (point) {
            drawPixel(point.x, point.y);
        }
    };

    const handleMove = (e: any) => {
        if (!isDrawing) return;
        if (e.evt.type === 'touchmove') {
            e.evt.preventDefault();
        }
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();
        if (point) {
            drawPixel(point.x, point.y);
        }
    };

    const handleEnd = () => {
        setIsDrawing(false);
    };

    const drawPixel = (x: number, y: number) => {
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);

        if (col >= 0 && col < GRID_SIZE && row >= 0 && row < GRID_SIZE) {
            const key = `${col},${row}`;
            if (tool === "draw") {
                setPixels((prev) => ({ ...prev, [key]: selectedColor }));
            } else {
                setPixels((prev) => {
                    const newPixels = { ...prev };
                    delete newPixels[key];
                    return newPixels;
                });
            }
        }
    };

    const clearCanvas = () => {
        setPixels({});
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center p-4 w-full max-w-7xl mx-auto">
            {/* Canvas Area */}
            <div className="w-full overflow-hidden">
                <div
                    ref={containerRef}
                    className="flex justify-center bg-muted/20"
                >
                    <Stage
                        width={canvasSize}
                        height={canvasSize}
                        onMouseDown={handleStart}
                        onMouseMove={handleMove}
                        onMouseUp={handleEnd}
                        onMouseLeave={handleEnd}
                        onTouchStart={handleStart}
                        onTouchMove={handleMove}
                        onTouchEnd={handleEnd}
                        className="shadow-2xl rounded-none overflow-hidden border border-border bg-background"
                    >
                        <Layer>
                            {/* Background */}
                            <Rect
                                x={0}
                                y={0}
                                width={canvasSize}
                                height={canvasSize}
                                fill="#111"
                            />

                            {/* Pixels */}
                            {Object.entries(pixels).map(([key, color]) => {
                                const [col, row] = key.split(",").map(Number);
                                return (
                                    <Rect
                                        key={key}
                                        x={col * cellSize}
                                        y={row * cellSize}
                                        width={cellSize}
                                        height={cellSize}
                                        fill={color}
                                    />
                                );
                            })}

                            {/* Grid Lines */}
                            {Array.from({ length: GRID_SIZE }).map((_, i) => (
                                <React.Fragment key={i}>
                                    <Rect
                                        x={i * cellSize}
                                        y={0}
                                        width={1}
                                        height={canvasSize}
                                        fill="#e5e7eb"
                                        opacity={0.5}
                                    />
                                    <Rect
                                        x={0}
                                        y={i * cellSize}
                                        width={canvasSize}
                                        height={1}
                                        fill="#e5e7eb"
                                        opacity={0.5}
                                    />
                                </React.Fragment>
                            ))}
                        </Layer>
                    </Stage>
                </div>
            </div>

            {/* Controls Sidebar */}
            <div className="w-full lg:w-72 shrink-0 space-y-6">
                <div className="space-y-6">
                    {/* Tools */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Mode</h3>
                        <div className="flex gap-2">
                            <Button
                                variant={tool === "draw" ? "default" : "outline"}
                                className="flex-1"
                                onClick={() => setTool("draw")}
                            >
                                <Pencil className="w-4 h-4 mr-2" />
                                Draw
                            </Button>
                            <Button
                                variant={tool === "erase" ? "default" : "outline"}
                                className="flex-1"
                                onClick={() => setTool("erase")}
                            >
                                <Eraser className="w-4 h-4 mr-2" />
                                Erase
                            </Button>
                        </div>
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={clearCanvas}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear Canvas
                        </Button>
                    </div>

                    <Separator />

                    {/* Color Picker */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Colors</h3>
                        <div className="grid grid-cols-8 lg:grid-cols-4 gap-2">
                            {COLORS.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-8 h-8 lg:w-10 lg:h-10 rounded-none transition-transform hover:scale-110 border border-border ${selectedColor === color ? "ring-2 ring-primary scale-110" : ""
                                        }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <Separator />

                <Button
                    className="w-full h-12 text-lg font-bold tracking-wider uppercase"
                    disabled={!connected}
                >
                    Mint
                </Button>
            </div>
        </div>


    );
}
