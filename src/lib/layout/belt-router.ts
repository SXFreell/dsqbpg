import type { BeltSegment, PlacedDevice } from "./types";

/**
 * Route belts between devices in adjacent columns.
 *
 * **v1: Stub** — returns an empty array. Simple horizontal belt routing will
 * be implemented in v2 along with compact grid packing. The focus of v1 is
 * correct building placement.
 *
 * @param _devices - All placed production devices.
 * @param _connections - Mapping of output device indices → input device indices.
 * @returns Empty array in v1.
 */
export function routeBelts(
  _devices: PlacedDevice[],
  _connections: Array<{ from: number; to: number }>,
): BeltSegment[] {
  return [];
}
