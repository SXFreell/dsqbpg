/** A 3D position in the blueprint coordinate system */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** A 2D integer position (used for area coordinates) */
export interface Vec2i {
  x: number;
  y: number;
}

/** A building placed in the blueprint */
export interface PlacedBuilding {
  index: number;
  itemId: number;       // building type ID (2000-2009=belt, 2010-2019=sorter, etc.)
  modelIndex: number;
  areaIndex: number;
  localOffset: [Vec3, Vec3];  // position + endpoint (same for buildings, different for belts/sorters)
  yaw: [number, number];      // rotation angles
  tilt: number;
  pitch: number;
  tilt2: number;
  pitch2: number;
  outputObjIdx: number;
  inputObjIdx: number;
  outputToSlot: number;
  inputFromSlot: number;
  outputFromSlot: number;
  inputToSlot: number;
  outputOffset: number;
  inputOffset: number;
  recipeId: number;      // which recipe this building is set to
  filterId: number;
  parameters: number[] | null;  // binary parameters (varies by building type)
  content: string;       // custom text content
}

/** A rectangular area/region in the blueprint */
export interface BlueprintArea {
  index: number;
  parentIndex: number;
  tropicAnchor: number;
  areaSegments: number;
  anchorLocalOffset: Vec2i;
  size: Vec2i;
}

/** Terrain reform data (foundation paving) */
export interface ReformRect {
  x: number;
  y: number;
  w: number;
  h: number;
  type: number;
  color: number;
  areaIndex: number;
}

export interface ReformData {
  rects: ReformRect[];
  customReformColorMask: number;
  customReformColors: number[];
}

/** Blueprint header (text portion before binary data) */
export interface BlueprintHeader {
  layout: number;
  icons: number[];       // 5 icon IDs
  time: Date;
  gameVersion: string;
  shortDesc: string;
  author: string;
  customVersion: string;
  externalFields: string;
  desc: string;
}

/** Complete blueprint structure */
export interface BlueprintData {
  header: BlueprintHeader;
  version: number;       // blueprint format version (1 or 2)
  cursorOffset: Vec2i;
  cursorTargetArea: number;
  dragBoxSize: Vec2i;
  primaryAreaIdx: number;
  areas: BlueprintArea[];
  buildings: PlacedBuilding[];
  patch: number;         // reserved field
  reformData: ReformData | null;
}
