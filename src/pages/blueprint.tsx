import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { ArrowLeft, Copy, Download, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBlueprint } from "@/hooks/useBlueprint";
import { BlueprintCanvas } from "@/components/blueprint/BlueprintCanvas";
import { ExportDialog } from "@/components/blueprint/ExportDialog";
import type { CalcResult } from "@/lib/calc";

export function BlueprintPage() {
  const location = useLocation();
  const calcResult = (location.state as { calcResult: CalcResult } | null)?.calcResult ?? null;
  const { layoutResult, blueprintString } = useBlueprint(calcResult);
  const [showExport, setShowExport] = useState(false);

  if (!calcResult) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <section className="text-center space-y-3 py-4">
          <Badge variant="secondary" className="mb-2">
            Blueprint Preview
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">蓝图预览</h1>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">无蓝图数据</CardTitle>
            <CardDescription>
              请先在计算器中生成计算结果，再查看蓝图
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link to="/calculator">
                <ArrowLeft className="mr-2 h-4 w-4" />
                前往计算器
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = layoutResult
    ? {
        buildings: layoutResult.devices.length,
        belts: layoutResult.belts.length,
        width: layoutResult.totalWidth.toFixed(0),
        height: layoutResult.totalHeight.toFixed(0),
      }
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero */}
      <section className="text-center space-y-3 py-4">
        <Badge variant="secondary" className="mb-2">
          Blueprint Preview
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">蓝图预览</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          查看生产链的 2D 布局，并导出为 DSP 蓝图字符串
        </p>
      </section>

      {/* Canvas */}
      <BlueprintCanvas layoutResult={layoutResult} />

      {/* Stats Bar */}
      {stats && (
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">总建筑:</span>
                <span className="font-semibold">{stats.buildings}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">占地:</span>
                <span className="font-semibold">
                  {stats.width}×{stats.height}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button
          size="lg"
          onClick={() => setShowExport(true)}
          disabled={!blueprintString}
        >
          <Copy className="mr-2 h-5 w-5" />
          复制蓝图
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => setShowExport(true)}
          disabled={!blueprintString}
        >
          <Download className="mr-2 h-5 w-5" />
          下载
        </Button>
        <Button variant="ghost" asChild>
          <Link to="/calculator">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回计算器
          </Link>
        </Button>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={showExport}
        onClose={() => setShowExport(false)}
        blueprintString={blueprintString ?? ""}
        layoutResult={layoutResult}
      />
    </div>
  );
}
