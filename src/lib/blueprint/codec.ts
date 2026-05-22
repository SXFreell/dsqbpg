/**
 * DSP Blueprint encoder/decoder.
 *
 * Ported from refs/edit-dspblue-print/src/utils/parser.js
 * Supports blueprint format version 2 (-102 building magic, reform data).
 *
 * Encoding pipeline:
 *   encode(): header string → encodeBinary() → gzip → base64 → compute MD5
 * Decoding pipeline:
 *   decode(): verify MD5 → base64 decode → ungzip → decodeBinary() → extract header
 */

import { gzip, ungzip } from "pako";
import { BufferReader, BufferWriter } from "./binary";
import { md5Digest } from "./hash";
import type {
  BlueprintData,
  BlueprintHeader,
  BlueprintArea,
  PlacedBuilding,
  ReformData,
  ReformRect,
  Vec3,
  Vec2i,
} from "./types";

// ─── Constants ───────────────────────────────────────────────────────────────

const START = "BLUEPRINT:";
const TIME_BASE = new Date(0).setUTCFullYear(1);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert binary string to Uint8Array (btoa produces a binary string) */
function btoUint8Array(b: string): Uint8Array {
  const arr = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) {
    arr[i] = b.charCodeAt(i);
  }
  return arr;
}

/** Convert Uint8Array to binary string */
function Uint8ArrayTob(a: Uint8Array): string {
  let out = "";
  for (let i = 0; i < a.length; i++) {
    out += String.fromCharCode(a[i]!);
  }
  return out;
}

/** Round float to 4 decimal places for stability */
function fix(num: number | undefined | null): number {
  return +(num?.toFixed(4) ?? 0);
}

// ─── Area encode/decode ──────────────────────────────────────────────────────

function importArea(r: BufferReader): BlueprintArea {
  return {
    index: r.getInt8(),
    parentIndex: r.getInt8(),
    tropicAnchor: r.getInt16(),
    areaSegments: r.getInt16(),
    anchorLocalOffset: {
      x: r.getInt16(),
      y: r.getInt16(),
    },
    size: {
      x: r.getInt16(),
      y: r.getInt16(),
    },
  };
}

function exportArea(w: BufferWriter, area: BlueprintArea): void {
  w.setInt8(area.index);
  w.setInt8(area.parentIndex);
  w.setInt16(area.tropicAnchor);
  w.setInt16(area.areaSegments);
  w.setInt16(area.anchorLocalOffset.x);
  w.setInt16(area.anchorLocalOffset.y);
  w.setInt16(area.size.x);
  w.setInt16(area.size.y);
}

// ─── Building encode/decode ──────────────────────────────────────────────────

function readXYZ(r: BufferReader): Vec3 {
  return {
    x: fix(r.getFloat32()),
    y: fix(r.getFloat32()),
    z: fix(r.getFloat32()),
  };
}

function writeXYZ(w: BufferWriter, v: Vec3): void {
  w.setFloat32(v.x);
  w.setFloat32(v.y);
  w.setFloat32(v.z);
}

function readParameters(r: BufferReader): number[] | null {
  const length = r.getInt16();
  if (length > 0) {
    const params: number[] = [];
    for (let i = 0; i < length; i++) {
      params.push(r.getInt32());
    }
    return params;
  }
  return null;
}

function writeParameters(w: BufferWriter, params: number[] | null): void {
  if (params != null && params.length > 0) {
    w.setInt16(params.length);
    for (const p of params) {
      w.setInt32(p);
    }
  } else {
    w.setInt16(0);
  }
}

function readContent(r: BufferReader): string {
  const length = r.getInt32();
  if (length > 0) {
    return r.getString();
  }
  return "";
}

function writeContent(w: BufferWriter, content: string): void {
  if (content.length > 0) {
    w.setInt32(content.length);
    w.setString(content);
  } else {
    w.setInt32(0);
  }
}

function importBuilding(r: BufferReader): PlacedBuilding {
  const num = r.getInt32();
  const b = {} as PlacedBuilding;
  b.parameters = null;
  b.content = "";

  if (num <= -102) {
    // V0.10.34.28281 format: magic -102
    b.index = r.getInt32();
    b.itemId = r.getInt16();
    b.modelIndex = r.getInt16();
    b.areaIndex = r.getInt8();
    const pos0 = readXYZ(r);
    b.localOffset = [pos0, { ...pos0 }];
    const y0 = fix(r.getFloat32());
    b.yaw = [y0, y0];
    if (b.itemId > 2000 && b.itemId < 2010) {
      // Belt
      b.tilt = r.getFloat32();
      b.pitch = 0;
      b.localOffset[1] = { ...b.localOffset[0] };
      b.yaw[1] = b.yaw[0];
      b.tilt2 = b.tilt;
      b.pitch2 = 0;
    } else if (b.itemId > 2010 && b.itemId < 2020) {
      // Sorter
      b.tilt = r.getFloat32();
      b.pitch = r.getFloat32();
      b.localOffset[1] = readXYZ(r);
      b.yaw[1] = fix(r.getFloat32());
      b.tilt2 = r.getFloat32();
      b.pitch2 = r.getFloat32();
    } else {
      b.tilt = 0;
      b.pitch = 0;
      b.tilt2 = 0;
      b.pitch2 = 0;
    }
    b.outputObjIdx = r.getInt32();
    b.inputObjIdx = r.getInt32();
    b.outputToSlot = r.getInt8();
    b.inputFromSlot = r.getInt8();
    b.outputFromSlot = r.getInt8();
    b.inputToSlot = r.getInt8();
    b.outputOffset = r.getInt8();
    b.inputOffset = r.getInt8();
    b.recipeId = r.getInt16();
    b.filterId = r.getInt16();
    b.parameters = readParameters(r);
    b.content = readContent(r);
  } else if (num <= -101) {
    // V0.10.31.24646 format: magic -101
    b.index = r.getInt32();
    b.itemId = r.getInt16();
    b.modelIndex = r.getInt16();
    b.areaIndex = r.getInt8();
    const pos0b = readXYZ(r);
    b.localOffset = [pos0b, { ...pos0b }];
    const y0b = fix(r.getFloat32());
    b.yaw = [y0b, y0b];
    if (b.itemId > 2000 && b.itemId < 2010) {
      b.tilt = r.getFloat32();
      b.pitch = 0;
      b.localOffset[1] = { ...b.localOffset[0] };
      b.yaw[1] = b.yaw[0];
      b.tilt2 = b.tilt;
      b.pitch2 = 0;
    } else if (b.itemId > 2010 && b.itemId < 2020) {
      b.tilt = r.getFloat32();
      b.pitch = r.getFloat32();
      b.localOffset[1] = readXYZ(r);
      b.yaw[1] = fix(r.getFloat32());
      b.tilt2 = r.getFloat32();
      b.pitch2 = r.getFloat32();
    } else {
      b.tilt = 0;
      b.pitch = 0;
      b.tilt2 = 0;
      b.pitch2 = 0;
    }
    b.outputObjIdx = r.getInt32();
    b.inputObjIdx = r.getInt32();
    b.outputToSlot = r.getInt8();
    b.inputFromSlot = r.getInt8();
    b.outputFromSlot = r.getInt8();
    b.inputToSlot = r.getInt8();
    b.outputOffset = r.getInt8();
    b.inputOffset = r.getInt8();
    b.recipeId = r.getInt16();
    b.filterId = r.getInt16();
    b.parameters = readParameters(r);
    b.content = readContent(r);
  } else if (num <= -101) {
    // V0.10.31.24646 format: magic -101
    b.index = r.getInt32();
    b.itemId = r.getInt16();
    b.modelIndex = r.getInt16();
    b.areaIndex = r.getInt8();
    const pos0c = readXYZ(r);
    b.localOffset = [pos0c, { ...pos0c }];
    const y0c = fix(r.getFloat32());
    b.yaw = [y0c, y0c];
    // V0.10.30.22239 format: magic -100
    b.index = r.getInt32();
    b.areaIndex = r.getInt8();
    b.localOffset = [readXYZ(r), readXYZ(r)];
    b.yaw = [fix(r.getFloat32()), fix(r.getFloat32())];
    b.tilt = r.getFloat32();
    b.itemId = r.getInt16();
    b.modelIndex = r.getInt16();
    b.outputObjIdx = r.getInt32();
    b.inputObjIdx = r.getInt32();
    b.outputToSlot = r.getInt8();
    b.inputFromSlot = r.getInt8();
    b.outputFromSlot = r.getInt8();
    b.inputToSlot = r.getInt8();
    b.outputOffset = r.getInt8();
    b.inputOffset = r.getInt8();
    b.recipeId = r.getInt16();
    b.filterId = r.getInt16();
    b.parameters = readParameters(r);
    b.pitch = 0;
    b.tilt2 = 0;
    b.pitch2 = 0;
    b.content = "";
  } else {
    // Old format: no magic number, index is first int32
    b.index = num;
    b.areaIndex = r.getInt8();
    b.localOffset = [readXYZ(r), readXYZ(r)];
    b.yaw = [fix(r.getFloat32()), fix(r.getFloat32())];
    b.tilt = 0;
    b.itemId = r.getInt16();
    b.modelIndex = r.getInt16();
    b.outputObjIdx = r.getInt32();
    b.inputObjIdx = r.getInt32();
    b.outputToSlot = r.getInt8();
    b.inputFromSlot = r.getInt8();
    b.outputFromSlot = r.getInt8();
    b.inputToSlot = r.getInt8();
    b.outputOffset = r.getInt8();
    b.inputOffset = r.getInt8();
    b.recipeId = r.getInt16();
    b.filterId = r.getInt16();
    b.parameters = readParameters(r);
    b.pitch = 0;
    b.tilt2 = 0;
    b.pitch2 = 0;
    b.content = "";
  }

  return b;
}

function exportBuilding(w: BufferWriter, b: PlacedBuilding): void {
  // Always write latest format (-102)
  w.setInt32(-102);
  w.setInt32(b.index);
  w.setInt16(b.itemId);
  w.setInt16(b.modelIndex);
  w.setInt8(b.areaIndex);
  writeXYZ(w, b.localOffset[0]);
  w.setFloat32(b.yaw[0]);
  if (b.itemId > 2000 && b.itemId < 2010) {
    // Belt
    w.setFloat32(b.tilt);
  } else if (b.itemId > 2010 && b.itemId < 2020) {
    // Sorter
    w.setFloat32(b.tilt);
    w.setFloat32(b.pitch);
    writeXYZ(w, b.localOffset[1]);
    w.setFloat32(b.yaw[1]);
    w.setFloat32(b.tilt2);
    w.setFloat32(b.pitch2);
  }
  w.setInt32(b.outputObjIdx);
  w.setInt32(b.inputObjIdx);
  w.setInt8(b.outputToSlot);
  w.setInt8(b.inputFromSlot);
  w.setInt8(b.outputFromSlot);
  w.setInt8(b.inputToSlot);
  w.setInt8(b.outputOffset);
  w.setInt8(b.inputOffset);
  w.setInt16(b.recipeId);
  w.setInt16(b.filterId);
  writeParameters(w, b.parameters);
  writeContent(w, b.content);
}

// ─── Reform data encode/decode ───────────────────────────────────────────────

function importReformRect(r: BufferReader): ReformRect {
  r.getUint8(); // reserved
  const x = r.getInt16();
  const y = r.getInt16();
  const w = r.getUint8();
  const h = r.getUint8();
  const data = r.getUint8();
  const areaIndex = r.getUint8();
  // data: high 3 bits = decoration type, low 5 bits = color index
  return {
    x,
    y,
    w,
    h,
    type: data >> 5,
    color: data & 0x1f,
    areaIndex,
  };
}

function exportReformRect(w: BufferWriter, rect: ReformRect): void {
  w.setUint8(0); // reserved
  w.setInt16(rect.x);
  w.setInt16(rect.y);
  w.setUint8(rect.w);
  w.setUint8(rect.h);
  const data = (rect.type << 5) | rect.color;
  w.setUint8(data);
  w.setUint8(rect.areaIndex);
}

function importFormatData(r: BufferReader): ReformData {
  r.getUint8(); // reserved
  const rectLen = r.getInt32();
  if (rectLen < 0 || rectLen > 2930400) throw new Error("Invalid Reform Count");
  const rects: ReformRect[] = [];
  for (let i = 0; i < rectLen; i++) {
    rects[i] = importReformRect(r);
  }
  const customReformColorMask = r.getUint32();
  const customReformColors: number[] = [];
  const colorLen = r.getInt32();
  for (let i = 0; i < colorLen && i < 2930400; i++) {
    customReformColors[i] = r.getUint32();
  }
  return { rects, customReformColorMask, customReformColors };
}

function exportFormatData(w: BufferWriter, reformData: ReformData): void {
  w.setUint8(0); // reserved
  const rectLen = reformData.rects?.length ?? 0;
  w.setInt32(rectLen);
  for (let i = 0; i < rectLen; i++) {
    exportReformRect(w, reformData.rects[i]!);
  }
  w.setUint32(reformData.customReformColorMask);
  const colorLen = reformData.customReformColors?.length ?? 0;
  w.setInt32(colorLen);
  for (let i = 0; i < colorLen; i++) {
    w.setUint32(reformData.customReformColors[i]!);
  }
}

// ─── Size estimation ─────────────────────────────────────────────────────────

/**
 * Estimate byte size needed for binary encoding.
 * Used to pre-allocate the output buffer before writing.
 */
function encodedSize(bp: BlueprintData): number {
  // meta: version(4) + cursorOffset(8) + cursorTargetArea(4) + dragBoxSize(8) + primaryAreaIdx(4) = 28
  let result = 28
    + 1 // numAreas
    + 14 * bp.areas.length
    + 4; // numBuildings

  for (const b of bp.buildings) {
    // Base building size for -102 format (without params/content)
    result += 53; // rough base: magic(4)+index(4)+itemId(2)+modelIdx(2)+areaIdx(1)+xyz(12)+yaw(4)+conn(22)+recipe(2)+filter(2)

    // Building-type specific extras
    if (b.itemId > 2010 && b.itemId < 2020) {
      result += 32; // sorter extra: tilt(4)+pitch(4)+xyz2(12)+yaw2(4)+tilt2(4)+pitch2(4)
    } else if (b.itemId > 2000 && b.itemId < 2010) {
      result += 4; // belt extra: tilt(4)
    }

    // Parameters
    if (b.parameters != null) {
      result += b.parameters.length * 4; // int32 per parameter
    }

    // Content
    if (b.content.length > 0) {
      const byteLen = new TextEncoder().encode(b.content).length;
      // 7-bit encoded prefix length
      let prefixLen = 0;
      let v = byteLen;
      do {
        prefixLen++;
        v >>>= 7;
      } while (v > 0);
      result += prefixLen + byteLen;
    }
  }

  if (bp.version >= 2) {
    result += 4; // patch (reserved)
    result += 1; // reform data present flag
    if (bp.reformData != null && bp.reformData.rects.length > 0) {
      result += 1; // reserved
      result += 4; // rects length
      result += bp.reformData.rects.length * 9;
      result += 4; // customReformColorMask
      result += 4; // customReformColors length
      result += (bp.reformData.customReformColors?.length ?? 0) * 4;
    }
  }

  return result;
}

// ─── Binary encode/decode ────────────────────────────────────────────────────

function decodeBinary(decoded: Uint8Array): Omit<BlueprintData, "header"> {
  const reader = new BufferReader(new DataView(decoded.buffer));

  const version = reader.getInt32();
  const cursorOffset: Vec2i = {
    x: reader.getInt32(),
    y: reader.getInt32(),
  };
  const cursorTargetArea = reader.getInt32();
  const dragBoxSize: Vec2i = {
    x: reader.getInt32(),
    y: reader.getInt32(),
  };
  const primaryAreaIdx = reader.getInt32();

  // Areas
  const numAreas = reader.getUint8();
  const areas: BlueprintArea[] = [];
  for (let i = 0; i < numAreas; i++) {
    areas.push(importArea(reader));
  }

  // Buildings
  const numBuildings = reader.getInt32();
  const buildings: PlacedBuilding[] = [];
  for (let i = 0; i < numBuildings; i++) {
    buildings.push(importBuilding(reader));
  }

  let patch = 0;
  let reformData: ReformData | null = null;

  if (version >= 2) {
    patch = reader.getInt32(); // reserved

    const numReformData = reader.getUint8();
    if (numReformData !== 0) {
      reformData = importFormatData(reader);
    }
  }

  return {
    version,
    cursorOffset,
    cursorTargetArea,
    dragBoxSize,
    primaryAreaIdx,
    areas,
    buildings,
    patch,
    reformData,
  };
}

function encodeBinary(bp: BlueprintData): Uint8Array {
  const size = encodedSize(bp);
  const decoded = new Uint8Array(size);
  const writer = new BufferWriter(new DataView(decoded.buffer));

  writer.setInt32(bp.version);
  writer.setInt32(bp.cursorOffset.x);
  writer.setInt32(bp.cursorOffset.y);
  writer.setInt32(bp.cursorTargetArea);
  writer.setInt32(bp.dragBoxSize.x);
  writer.setInt32(bp.dragBoxSize.y);
  writer.setInt32(bp.primaryAreaIdx);

  writer.setUint8(bp.areas.length);
  for (const a of bp.areas) {
    exportArea(writer, a);
  }

  writer.setInt32(bp.buildings.length);
  for (const b of bp.buildings) {
    exportBuilding(writer, b);
  }

  if (bp.version >= 2) {
    writer.setInt32(bp.patch); // reserved
    if (bp.reformData != null && bp.reformData.rects.length > 0) {
      writer.setUint8(1);
      exportFormatData(writer, bp.reformData);
    } else {
      writer.setUint8(0);
    }
  }

  // Return exact used slice
  return decoded.slice(0, writer.pos);
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Decode a DSP blueprint string into BlueprintData.
 * Throws if the string is invalid or MD5 checksum doesn't match.
 */
export function decode(strData: string): BlueprintData {
  if (!strData.startsWith(START)) throw new Error("Invalid start");

  // Parse header from comma-separated fields
  const p1 = strData.indexOf('"', START.length);
  if (p1 < 0) throw new Error("Header terminator not found");

  const cells = strData.substring(START.length, p1).split(",");
  if (cells.length < 12) throw new Error("Header too short");

  const flag0 = parseInt(cells[0]!);
  const header: BlueprintHeader = {
    layout: parseInt(cells[1]!),
    icons: cells.slice(2, 7).map((s) => parseInt(s)),
    time: new Date(TIME_BASE + parseInt(cells[8]!) / 10000),
    gameVersion: cells[9]!,
    shortDesc: decodeURIComponent(cells[10]!),
    author: flag0 >= 1 ? decodeURIComponent(cells[11]!) : "",
    customVersion: flag0 >= 1 ? decodeURIComponent(cells[12]!) : "",
    externalFields: flag0 >= 1 ? decodeURIComponent(cells[13]!) : "",
    desc: flag0 >= 1 ? decodeURIComponent(cells[14]!) : decodeURIComponent(cells[11]!),
  };

  // Verify MD5 checksum
  const p2 = strData.length - 33;
  if (strData[p2] !== '"') throw new Error("Checksum not found");

  const computedDigest = md5Digest(
    btoUint8Array(strData.substring(0, p2)).buffer as ArrayBuffer
  );
  const expectedDigest = strData.substring(p2 + 1);
  if (computedDigest !== expectedDigest) throw new Error("Checksum mismatch");

  // Decode binary body
  const encoded = strData.substring(p1 + 1, p2);
  const decoded = ungzip(btoUint8Array(atob(encoded)));
  const meta = decodeBinary(decoded);

  return {
    header,
    ...meta,
  };
}

/**
 * Encode a BlueprintData into a DSP blueprint string.
 */
export function encode(bp: BlueprintData): string {
  let result = START;

  // Header: flag=1
  result += "1,";
  result += bp.header.layout;
  result += ",";
  for (const i of bp.header.icons) {
    result += i;
    result += ",";
  }
  result += "0,";
  result += ((bp.header.time.getTime() - TIME_BASE) * 10000).toString();
  result += ",";
  result += bp.header.gameVersion;
  result += ",";
  result += encodeURIComponent(bp.header.shortDesc);
  result += ",";
  result += encodeURIComponent(bp.header.author);
  result += ",";
  result += encodeURIComponent(bp.header.customVersion);
  result += ",";
  result += encodeURIComponent(bp.header.externalFields);
  result += ",";
  result += encodeURIComponent(bp.header.desc);
  result += '"';

  // Binary body: gzip + base64
  const binary = encodeBinary(bp);
  result += btoa(Uint8ArrayTob(gzip(binary)));

  // MD5 over everything up to (but not including) closing quote and hash
  const digest = md5Digest(btoUint8Array(result).buffer as ArrayBuffer);
  result += '"';
  result += digest;

  return result;
}
