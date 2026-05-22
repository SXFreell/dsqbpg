import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getBuildingSize } from "@/lib/layout";
import type { LayoutResult, PlacedDevice } from "@/lib/layout";

export interface BlueprintCanvasProps {
  layoutResult: LayoutResult | null;
}

// Building type → color mapping (Tailwind CSS classes)
const BUILDING_COLORS: Record<number, string> = {
  // Mining
  2301: "bg-amber-600/80 border-amber-700",
  2316: "bg-amber-500/80 border-amber-600",
  // Smelting
  2302: "bg-orange-600/80 border-orange-700",
  2315: "bg-orange-500/80 border-orange-600",
  2319: "bg-orange-400/80 border-orange-500",
  // Assembly
  2303: "bg-blue-600/80 border-blue-700",
  2304: "bg-blue-500/80 border-blue-600",
  2305: "bg-blue-400/80 border-blue-500",
  2318: "bg-indigo-500/80 border-indigo-600",
  // Chemical
  2309: "bg-emerald-600/80 border-emerald-700",
  2317: "bg-emerald-500/80 border-emerald-600",
  // Refinery
  2308: "bg-red-600/80 border-red-700",
  // Extractor
  2306: "bg-slate-500/80 border-slate-600",
  2307: "bg-slate-600/80 border-slate-700",
  // Particle
  2310: "bg-purple-600/80 border-purple-700",
  // Fractionator
  2314: "bg-yellow-500/80 border-yellow-600",
  // Research
  2901: "bg-cyan-500/80 border-cyan-600",
  2902: "bg-cyan-400/80 border-cyan-500",
};

const BUILDING_LABELS: Record<number, string> = {
  2301: "采矿机",
  2316: "大型采矿机",
  2302: "电弧熔炉",
  2315: "位面熔炉",
  2319: "负熵熔炉",
  2303: "制造台 Mk.I",
  2304: "制造台 Mk.II",
  2305: "制造台 Mk.III",
  2318: "重组式制造台",
  2309: "化工厂",
  2317: "量子化工厂",
  2308: "原油精炼厂",
  2306: "抽水站",
  2307: "原油萃取站",
  2310: "粒子对撞机",
  2314: "分馏塔",
  2901: "矩阵研究站",
  2902: "矩阵研究站",
};

function getBuildingColor(buildingId: number): string {
  return BUILDING_COLORS[buildingId] ?? "bg-gray-500/80 border-gray-600";
}

function getBuildingLabel(buildingId: number): string {
  return BUILDING_LABELS[buildingId] ?? `建筑#${buildingId}`;
}

const GRID_CELL = 32; // pixels per grid tile
const PADDING = 12; // padding around grid

export function BlueprintCanvas({ layoutResult }: BlueprintCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      const obs = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          setContainerSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      });
      obs.observe(containerRef.current);
      return () => obs.disconnect();
    }
  }, []);

  const { devices, scale, canvasWidth, canvasHeight, bounds } = useMemo(() => {
    if (!layoutResult || layoutResult.devices.length === 0) {
      return {
        devices: [] as PlacedDevice[],
        scale: GRID_CELL,
        canvasWidth: 400,
        canvasHeight: 300,
        bounds: { minX: 0, minY: 0, maxX: 20, maxY: 20 },
      };
    }

    const bounds = layoutResult.bounds;
    const totalW = layoutResult.totalWidth;
    const totalH = layoutResult.totalHeight;

    // Calculate scale to fit container
    const availableW = Math.max(containerSize.width - PADDING * 2, 200);
    const availableH = Math.max(containerSize.height - PADDING * 2, 150);

    const scaleX = availableW / (totalW > 0 ? totalW : 20);
    const scaleY = availableH / (totalH > 0 ? totalH : 20);
    const scale = Math.min(scaleX, scaleY, GRID_CELL);

    const canvasWidth = Math.max(totalW * scale + PADDING * 2, availableW);
    const canvasHeight = Math.max(totalH * scale + PADDING * 2, availableH);

    return {
      devices: layoutResult.devices,
      scale,
      canvasWidth,
      canvasHeight,
      bounds,
    };
  }, [layoutResult, containerSize]);

  if (!layoutResult || layoutResult.devices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">蓝图预览</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-12">
            暂无蓝图数据，请先生成计算结果
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">蓝图预览</CardTitle>
        <p className="text-sm text-muted-foreground">
          {devices.length} 个建筑 · 占地 {layoutResult.totalWidth.toFixed(0)}×{layoutResult.totalHeight.toFixed(0)} 格
        </p>
      </CardHeader>
      <CardContent>
        <div
          ref={containerRef}
          className="rounded-lg border bg-muted/30 overflow-hidden"
        >
          <div
            className="relative"
            style={{
              width: canvasWidth,
              height: canvasHeight,
              minWidth: "100%",
              minHeight: 300,
            }}
          >
            {/* Grid background */}
            <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08]">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `repeating-linear-gradient(0deg, currentColor 0px, currentColor 1px, transparent 1px, transparent ${scale}px), repeating-linear-gradient(90deg, currentColor 0px, currentColor 1px, transparent 1px, transparent ${scale}px)`,
                }}
              />
            </div>

            {/* Buildings */}
            {devices.map((device, i) => {
              const size = getBuildingSize(device.buildingId);
              const x = PADDING + (device.position.x - bounds.minX) * scale;
              const y = PADDING + (device.position.y - bounds.minY) * scale;
              const w = size.width * scale;
              const h = size.height * scale;

              return (
                <div
                  key={i}
                  className={cn(
                    "absolute rounded border-2 cursor-pointer transition-opacity",
                    getBuildingColor(device.buildingId),
                    hoveredIndex === i ? "opacity-100 z-10" : "opacity-80",
                  )}
                  style={{
                    left: x,
                    top: y,
                    width: w,
                    height: h,
                    minWidth: 6,
                    minHeight: 6,
                  }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  title={getBuildingLabel(device.buildingId)}
                >
                  {/* Building label (visible on hover or if big enough) */}
                  {(w > 40 && h > 20) && (
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-white drop-shadow-sm select-none px-1 leading-tight text-center">
                      {getBuildingLabel(device.buildingId)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
