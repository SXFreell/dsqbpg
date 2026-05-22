import type { BeltData } from "./types";

/** Conveyor Belt Mk.I — 6 items/s */
export const beltMk1: BeltData = { id: 2001, name: "传送带", speed: 6 };

/** Conveyor Belt Mk.II — 12 items/s */
export const beltMk2: BeltData = { id: 2002, name: "高速传送带", speed: 12 };

/** Conveyor Belt Mk.III — 30 items/s */
export const beltMk3: BeltData = { id: 2003, name: "极速传送带", speed: 30 };

export const belts: BeltData[] = [beltMk1, beltMk2, beltMk3];

export const beltsById = new Map<number, BeltData>(
  belts.map((b) => [b.id, b])
);
