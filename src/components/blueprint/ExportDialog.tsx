import { useCallback, useEffect, useRef } from "react";
import { Copy, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { LayoutResult } from "@/lib/layout";

export interface ExportDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called to close the dialog */
  onClose: () => void;
  /** The encoded blueprint string */
  blueprintString: string;
  /** Layout result for stats display */
  layoutResult: LayoutResult | null;
}

export function ExportDialog({
  open,
  onClose,
  blueprintString,
  layoutResult,
}: ExportDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Auto-select textarea content on open
  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.select();
    }
  }, [open]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(blueprintString);
    } catch {
      // Fallback for older browsers
      if (textareaRef.current) {
        textareaRef.current.select();
        document.execCommand("copy");
      }
    }
  }, [blueprintString]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([blueprintString], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "blueprint.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [blueprintString]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose],
  );

  if (!open) return null;

  const totalBuildings = layoutResult?.devices.length ?? 0;
  const totalBelts = layoutResult?.belts.length ?? 0;
  const gridW = layoutResult?.totalWidth.toFixed(0) ?? "—";
  const gridH = layoutResult?.totalHeight.toFixed(0) ?? "—";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in-0"
      onClick={handleOverlayClick}
    >
      <div
        className={cn(
          "relative w-full max-w-lg mx-4 bg-background rounded-lg border shadow-lg",
          "animate-in zoom-in-95 fade-in-0",
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">导出蓝图</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="px-4 py-3 border-b bg-muted/30">
          <div className="flex gap-4 text-sm">
            <span>
              <span className="text-muted-foreground">建筑: </span>
              <span className="font-medium">{totalBuildings}</span>
            </span>
            <span>
              <span className="text-muted-foreground">传送带: </span>
              <span className="font-medium">{totalBelts}</span>
            </span>
            <span>
              <span className="text-muted-foreground">占地: </span>
              <span className="font-medium">{gridW}×{gridH}</span>
            </span>
          </div>
        </div>

        {/* Blueprint String */}
        <div className="p-4">
          <label className="text-sm font-medium mb-2 block">
            蓝图字符串
          </label>
          <Textarea
            ref={textareaRef}
            readOnly
            value={blueprintString}
            className="h-32 font-mono text-xs resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 pt-0 justify-end">
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            复制到剪贴板
          </Button>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            下载文件
          </Button>
        </div>
      </div>
    </div>
  );
}
