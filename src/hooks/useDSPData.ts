import { useState, useEffect, useRef } from "react";
import { loadDSPData, type DSPData } from "@/lib/dsp";

let cachedData: DSPData | null = null;
let isLoading = false;

/**
 * Lazy-load and memoize DSPData.
 * Data is loaded once and shared across all component instances.
 */
export function useDSPData(): DSPData | null {
  const [data, setData] = useState<DSPData | null>(cachedData);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (cachedData) {
      setData(cachedData);
      return;
    }

    if (isLoading) return;

    isLoading = true;
    // Load synchronously — DSPData is all in-memory already
    cachedData = loadDSPData();
    isLoading = false;

    if (mountedRef.current) {
      setData(cachedData);
    }

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return data;
}
