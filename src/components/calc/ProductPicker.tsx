import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import type { Item } from "@/lib/dsp";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ProductPickerProps {
  /** All available items */
  items: Item[];
  /** Currently selected item ID */
  value: number | null;
  /** Called when selection changes */
  onChange: (itemId: number) => void;
}

const ITEM_TYPE_LABELS: Record<number, string> = {
  1: "原材料",
  2: "中间产物",
  3: "最终产物",
  4: "物流设施",
  5: "建筑物",
  6: "生产设施",
};

/**
 * Searchable product picker using shadcn/ui Select.
 * Groups items by type and supports text filtering.
 */
export function ProductPicker({ items, value, onChange }: ProductPickerProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, search]);

  const grouped = useMemo(() => {
    const map = new Map<number, Item[]>();
    for (const item of filtered) {
      const list = map.get(item.type) ?? [];
      list.push(item);
      map.set(item.type, list);
    }
    // Sort groups by type order
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [filtered]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索产物..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={value != null ? String(value) : ""}
        onValueChange={(v) => onChange(Number(v))}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="选择产物..." />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {grouped.map(([type, typeItems]) => (
            <SelectGroup key={type}>
              <SelectLabel>{ITEM_TYPE_LABELS[type] ?? `类型 ${type}`}</SelectLabel>
              {typeItems.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
          {filtered.length === 0 && (
            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
              未找到匹配的产物
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
