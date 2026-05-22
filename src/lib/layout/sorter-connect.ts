import type { BeltSegment, PlacedDevice, SorterConnection } from "./types";

/**
 * Create sorter connections between buildings and belts.
 *
 * **v1: Stub** — returns an empty array. Sorter connection placement requires
 * belt routing to be implemented first (planned for v2+).
 *
 * @param _devices - All placed production devices.
 * @param _belts - All belt segments.
 * @returns Empty array in v1.
 */
export function connectSorters(
  _devices: PlacedDevice[],
  _belts: BeltSegment[],
): SorterConnection[] {
  return [];
}
