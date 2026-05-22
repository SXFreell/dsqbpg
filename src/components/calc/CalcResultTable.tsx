import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CalcResult, CalcNode } from "@/lib/calc";

export interface CalcResultTableProps {
  result: CalcResult | null;
}

const DEPTH_BADGES: Record<number, string> = {
  0: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  1: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  2: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  3: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

function getDepthBadge(depth: number): string {
  return DEPTH_BADGES[depth] ?? "bg-slate-500/10 text-slate-500 border-slate-500/20";
}

function formatRate(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toFixed(1);
}

function getInputSummary(node: CalcNode): string {
  if (node.isRaw) return "—";
  if (node.inputs.size === 0) return "—";
  const entries = Array.from(node.inputs.entries());
  return entries
    .slice(0, 3)
    .map(([, rate]) => `${formatRate(rate)}/min`)
    .join(", ")
    + (entries.length > 3 ? ` +${entries.length - 3}` : "");
}

function getOutputSummary(node: CalcNode): string {
  return `${formatRate(node.ratePerMinute)}/min`;
}

function getDepthLabel(depth: number): string {
  if (depth === 0) return "原材料";
  if (depth === 1) return "初级加工";
  return `第${depth}级`;
}

export function CalcResultTable({ result }: CalcResultTableProps) {
  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">计算结果</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            请选择产物并点击计算
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">计算结果</CardTitle>
        <p className="text-sm text-muted-foreground">
          共 {result.nodes.length} 个生产节点，总功率 {result.totalPowerMW.toFixed(1)} MW
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-6 py-3 text-xs font-medium text-muted-foreground border-b bg-muted/50">
          <div className="col-span-3">物品</div>
          <div className="col-span-3">建筑</div>
          <div className="col-span-2 text-right">数量</div>
          <div className="col-span-2 text-right">原料消耗</div>
          <div className="col-span-2 text-right">产出速率</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y">
          {result.nodes.map((node, i) => (
            <div
              key={`${node.itemId}-${i}`}
              className={cn(
                "grid grid-cols-12 gap-2 px-6 py-3 text-sm items-center",
                "hover:bg-muted/30 transition-colors",
              )}
            >
              {/* Item Name + Depth Badge */}
              <div className="col-span-3 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn("text-[10px] px-1.5 py-0 shrink-0", getDepthBadge(node.depth))}
                >
                  {getDepthLabel(node.depth)}
                </Badge>
                <span className="truncate">{node.itemName}</span>
              </div>

              {/* Building */}
              <div className="col-span-3 text-muted-foreground truncate">
                {node.buildingName}
              </div>

              {/* Count */}
              <div className="col-span-2 text-right font-mono text-sm">
                {node.buildingCount > 0
                  ? node.buildingCount.toFixed(1)
                  : "—"}
              </div>

              {/* Input Rate */}
              <div className="col-span-2 text-right font-mono text-xs text-muted-foreground">
                {getInputSummary(node)}
              </div>

              {/* Output Rate */}
              <div className="col-span-2 text-right font-mono text-sm font-medium">
                {getOutputSummary(node)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
