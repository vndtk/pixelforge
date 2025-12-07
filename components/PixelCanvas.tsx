"use client";

import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Rect } from "react-konva";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Eraser,
  Pencil,
  Trash2,
  Undo2,
  Redo2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type Konva from "konva";

const COLORS = [
  "#FFFFFF",
  "#000000",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F7DC6F",
  "#B287C2",
  "#C3C3C3",
  "#7F7F7F",
  "#3366CC",
  "#FF69B4",
  "#00FF00",
  "#FFFF00",
  "#FF4500",
];

const GRID_SIZE = 32;

export default function PixelCanvas() {
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [tool, setTool] = useState<"draw" | "erase">("draw");
  const [pixels, setPixels] = useState<Record<string, string>>({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasSize, setCanvasSize] = useState(640);
  const [history, setHistory] = useState<Record<string, string>[]>([{}]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const hasLoadedFromStorage = useRef(false);

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

  // Load canvas state from localStorage on mount
  useEffect(() => {
    if (hasLoadedFromStorage.current) return;

    try {
      const savedPixels = localStorage.getItem("mintistry_pixels");
      const savedHistory = localStorage.getItem("mintistry_history");
      const savedHistoryIndex = localStorage.getItem("mintistry_historyIndex");

      if (savedPixels) {
        const parsedPixels = JSON.parse(savedPixels);
        setPixels(parsedPixels);
      }

      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);
      }

      if (savedHistoryIndex) {
        const parsedIndex = JSON.parse(savedHistoryIndex);
        setHistoryIndex(parsedIndex);
      }

      hasLoadedFromStorage.current = true;
    } catch (error) {
      console.error("Failed to load canvas state from localStorage:", error);
      hasLoadedFromStorage.current = true;
    }
  }, []);

  // Save canvas state to localStorage whenever it changes
  useEffect(() => {
    if (!hasLoadedFromStorage.current) return;

    try {
      localStorage.setItem("mintistry_pixels", JSON.stringify(pixels));
      localStorage.setItem("mintistry_history", JSON.stringify(history));
      localStorage.setItem(
        "mintistry_historyIndex",
        JSON.stringify(historyIndex),
      );
    } catch (error) {
      console.error("Failed to save canvas state to localStorage:", error);
    }
  }, [pixels, history, historyIndex]);


  const cellSize = canvasSize / GRID_SIZE;

  const handleStart = (e: any) => {
    setIsDrawing(true);
    if (e.evt.type === "touchstart") {
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
    if (e.evt.type === "touchmove") {
      e.evt.preventDefault();
    }
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (point) {
      drawPixel(point.x, point.y);
    }
  };

  const handleEnd = () => {
    if (isDrawing) {
      saveToHistory(pixels);
    }
    setIsDrawing(false);
  };

  const saveToHistory = (newPixels: Record<string, string>) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ ...newPixels });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setPixels(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setPixels(history[newIndex]);
    }
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
    const newPixels = {};
    setPixels(newPixels);
    saveToHistory(newPixels);
  };

  const handlePreviewAndUpload = () => {
    if (!stageRef.current) return;

    // Create a temporary stage for export without grid lines
    const stage = stageRef.current;
    const layer = stage.getLayers()[0];

    // Hide grid lines temporarily by setting their opacity to 0
    const gridRects = layer.find((node: Konva.Node) => {
      return node.getAttr("opacity") === 0.5;
    });

    gridRects.forEach((rect) => rect.opacity(0));

    // Generate PNG
    const dataURL = stage.toDataURL({
      pixelRatio: 2, // Higher quality
    });

    // Restore grid lines
    gridRects.forEach((rect) => rect.opacity(0.5));

    // Store the image data and pixels in sessionStorage
    sessionStorage.setItem("canvasImage", dataURL);
    sessionStorage.setItem("canvasPixels", JSON.stringify(pixels));

    // Navigate to preview page
    router.push("/preview");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center p-4 w-full max-w-7xl mx-auto">
      {/* Canvas Area */}
      <div className="w-full overflow-hidden space-y-0">
        {/* Canvas Info Header */}
        <div className="py-2 flex items-center justify-start text-xs font-mono">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              {GRID_SIZE}×{GRID_SIZE} Grid
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">
              {GRID_SIZE * GRID_SIZE} pixels
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">Zoom: 100%</span>
          </div>
          <div className="flex items-center gap-2"></div>
        </div>
        <div ref={containerRef} className="flex justify-start">
          <Stage
            ref={stageRef}
            width={canvasSize}
            height={canvasSize}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            className="rounded-none overflow-hidden border border-border"
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
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Mode
            </h3>
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={undo}
                disabled={historyIndex <= 0}
              >
                <Undo2 className="w-4 h-4 mr-2" />
                Undo
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
              >
                <Redo2 className="w-4 h-4 mr-2" />
                Redo
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
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Colors
            </h3>
            <div className="grid grid-cols-8 lg:grid-cols-4 gap-2">
              {COLORS.map((color) => (
                <Button
                  key={color}
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 lg:w-10 lg:h-10 p-0 transition-transform hover:scale-110 ${
                    selectedColor === color
                      ? "ring-4 ring-primary scale-110"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>

        <Button
          className="w-full h-12 text-lg font-bold tracking-wider uppercase"
          disabled={Object.keys(pixels).length === 0}
          onClick={handlePreviewAndUpload}
        >
          Preview & Upload
        </Button>
      </div>
    </div>
  );
}
