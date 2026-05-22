import { useState, useCallback } from "react";
import {
  calculate,
  type CalcTarget,
  type CalcResult,
  DEFAULT_SETTINGS,
} from "@/lib/calc";
import type { DSPData } from "@/lib/dsp";

export interface UseCalcReturn {
  /** Current calculation result, or null if not yet calculated */
  result: CalcResult | null;
  /** Whether a calculation is in progress (currently synchronous, but kept for API readiness) */
  isCalculating: boolean;
  /** Current targets */
  targets: CalcTarget[];
  /** Set a single target (replaces all targets) */
  setTarget: (itemId: number, ratePerMinute: number) => void;
  /** Run calculation with current targets */
  calculate: () => void;
  /** Clear all targets and results */
  clear: () => void;
}

export function useCalc(data: DSPData | null): UseCalcReturn {
  const [result, setResult] = useState<CalcResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [targets, setTargets] = useState<CalcTarget[]>([]);

  const setTarget = useCallback((itemId: number, ratePerMinute: number) => {
    setTargets([{ itemId, ratePerMinute }]);
    setResult(null);
  }, []);

  const runCalculate = useCallback(() => {
    if (!data || targets.length === 0) return;
    setIsCalculating(true);
    try {
      const calcResult = calculate(targets, data, DEFAULT_SETTINGS);
      setResult(calcResult);
    } finally {
      setIsCalculating(false);
    }
  }, [data, targets]);

  const clear = useCallback(() => {
    setTargets([]);
    setResult(null);
  }, []);

  return {
    result,
    isCalculating,
    targets,
    setTarget,
    calculate: runCalculate,
    clear,
  };
}
