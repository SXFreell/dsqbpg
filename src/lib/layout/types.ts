/** A position on the blueprint grid. Units are DSP tiles (each tile = ~1.26m in-game grid space). */
export interface GridPos {
  x: number;
  y: number;
}

/** Size of a building footprint in grid tiles */
export interface GridSize {
  width: number;
  height: number;
}

/** A single placed production device */
export interface PlacedDevice {
  /** DSP building item ID (e.g. 2303 = assembler Mk.I) */
  buildingId: number;
  /** Recipe ID this building is configured to produce */
  recipeId: number;
  /** Grid position (top-left corner of building footprint) */
  position: GridPos;
  /** Rotation: 0=0°, 1=90°, 2=180°, 3=270° (clockwise) */
  rotation: number;
}

/** A conveyor belt segment connecting two points */
export interface BeltSegment {
  from: GridPos;
  to: GridPos;
  /** Belt level: 0=Mk.I, 1=Mk.II, 2=Mk.III */
  level: number;
}

/** A sorter connecting a building to a belt */
export interface SorterConnection {
  buildingIndex: number; // index into devices[]
  beltIndex: number;     // index into belts[]
  fromBelt: boolean;     // true = belt→building (input), false = building→belt (output)
}

/** Complete layout result */
export interface LayoutResult {
  devices: PlacedDevice[];
  belts: BeltSegment[];
  sorters: SorterConnection[];
  /** Bounding box of the entire layout */
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  /** Total footprint in grid tiles */
  totalWidth: number;
  totalHeight: number;
}
