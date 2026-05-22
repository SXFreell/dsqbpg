import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator, Map, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDSPData } from "@/hooks/useDSPData";
import { useCalc } from "@/hooks/useCalc";
import { ProductPicker } from "@/components/calc/ProductPicker";
import { CalcResultTable } from "@/components/calc/CalcResultTable";
import type { Item } from "@/lib/dsp";

export function CalculatorPage() {
  const navigate = useNavigate();
  const data = useDSPData();
  const { result, targets, setTarget, calculate: runCalc, clear } = useCalc(data);
  const [rate, setRate] = useState("60");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const items = useMemo<Item[]>(() => {
    if (!data) return [];
    return Array.from(data.items.values());
  }, [data]);

  const selectedItem = useMemo(() => {
    if (selectedId == null || !data) return null;
    return data.items.get(selectedId) ?? null;
  }, [selectedId, data]);

  const handleSelectItem = (itemId: number) => {
    setSelectedId(itemId);
    setTarget(itemId, Number(rate) || 0);
  };

  const handleRateChange = (value: string) => {
    setRate(value);
    if (selectedId != null) {
      setTarget(selectedId, Number(value) || 0);
    }
  };

  const handleCalculate = () => {
    runCalc();
  };

  const handleGenerateBlueprint = () => {
    if (!result) return;
    navigate("/blueprint", { state: { calcResult: result } });
  };

  const canCalculate = selectedId != null && Number(rate) > 0;
  const canGenerate = result != null && result.nodes.length > 0;

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-8 text-center">
        <Zap className="h-8 w-8 mx-auto animate-pulse text-muted-foreground" />
        <p className="text-muted-foreground">加载数据中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero */}
      <section className="text-center space-y-3 py-4">
        <Badge variant="secondary" className="mb-2">
          DSP Blueprint Generator
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">戴森球蓝图生成器</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          选择目标产物，输入期望产量，自动计算完整的生产链并生成 DSP 蓝图
        </p>
      </section>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            生产计算
          </CardTitle>
          <CardDescription>
            选择目标产物并设置期望的每分钟产量
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-[1fr_180px_auto] items-end">
            <ProductPicker
              items={items}
              value={selectedId}
              onChange={handleSelectItem}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                产量 (/min)
              </label>
              <Input
                type="number"
                min={1}
                step={1}
                value={rate}
                onChange={(e) => handleRateChange(e.target.value)}
                placeholder="60"
              />
            </div>

            <Button
              onClick={handleCalculate}
              disabled={!canCalculate}
              className="w-full sm:w-auto"
            >
              <Zap className="mr-2 h-4 w-4" />
              计算
            </Button>
          </div>

          {selectedItem && (
            <p className="mt-3 text-sm text-muted-foreground">
              当前目标: <span className="font-medium text-foreground">{selectedItem.name}</span>
              {" · "}
              <span className="font-medium text-foreground">{rate}</span> /min
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <CalcResultTable result={result} />

      {/* Generate Blueprint */}
      {canGenerate && (
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleGenerateBlueprint}
          >
            <Map className="mr-2 h-5 w-5" />
            生成蓝图
          </Button>
        </div>
      )}
    </div>
  );
}
